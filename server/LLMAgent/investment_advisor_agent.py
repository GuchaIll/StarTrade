# agents/llm_agent.py

from typing import List, Dict, Optional
from groq import Groq
import os
from datetime import datetime
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor

class InvestmentAdvisorAgent:
    """
    Interactive LLM agent for investment advice using RAG with Groq API
    """
    
    def __init__(
        self,
        vector_store,  # VectorStoreManager
        portfolio_manager,  # PortfolioManager
        groq_api_key: Optional[str] = None
    ):
        self.vector_store = vector_store
        self.portfolio_manager = portfolio_manager
        
        # Initialize Groq client
        self.client = Groq(
            api_key=groq_api_key or os.environ.get("GROQ_API_KEY")
        )
        
        # Model selection - Groq offers several Llama models
        self.model = "llama-3.3-70b-versatile"  # Fast and capable
        
        # Conversation history storage (in-memory, could use Redis)
        self.conversations = {}
        
        # Thread pool for async execution
        self.executor = ThreadPoolExecutor(max_workers=5)
        
        # System prompt
        self.system_prompt = """You are an expert financial advisor AI assistant. You provide investment advice based on:
1. Recent news and market sentiment from reliable sources
2. Technical analysis and quantitative signals
3. The user's current portfolio composition
4. Risk management principles

Guidelines:
- Provide clear, actionable advice
- Always cite your sources with [Source X] notation when making claims
- Be transparent about uncertainty and risks
- Consider both sentiment and technical factors
- Prioritize capital preservation and risk management
- If you don't have enough information, explicitly say so
- Use markdown formatting for better readability
- Include specific numbers and percentages when available

IMPORTANT: You must cite sources for any specific claims about stocks, news, or market events."""

    async def chat(
        self,
        user_message: str,
        user_portfolio: Optional[List[str]] = None,
        conversation_id: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1500
    ) -> Dict:
        """
        Handle user chat message with RAG
        
        Args:
            user_message: The user's question or message
            user_portfolio: List of stock symbols in user's portfolio
            conversation_id: Unique ID for conversation continuity
            temperature: Model temperature (0.0-1.0, lower = more factual)
            max_tokens: Maximum response length
        """
        # Generate conversation ID if not provided
        if not conversation_id:
            conversation_id = self._generate_conversation_id()
        
        # Extract stock symbols from message
        symbols = self._extract_symbols(user_message)
        
        # Retrieve relevant context from vector store
        context_docs = await self._retrieve_context(user_message, symbols)
        
        # Get portfolio analysis if applicable
        portfolio_summary = ""
        if user_portfolio:
            portfolio_analysis = await self.portfolio_manager.monitor_existing_positions(
                user_portfolio
            )
            portfolio_summary = self._format_portfolio_summary(portfolio_analysis)
        
        # Format context for LLM
        context_text = self._format_context(context_docs)
        
        # Build conversation history
        messages = self._build_messages(
            user_message,
            context_text,
            portfolio_summary,
            conversation_id
        )
        
        # Call Groq API (synchronous, so wrap in executor)
        response = await asyncio.get_event_loop().run_in_executor(
            self.executor,
            self._call_groq_api,
            messages,
            temperature,
            max_tokens
        )
        
        # Extract answer
        answer = response.choices[0].message.content
        
        # Parse and enhance citations
        citations = self._extract_citations(context_docs)
        answer_with_links = self._enhance_citations_with_links(answer, citations)
        
        # Store conversation
        self._store_conversation(conversation_id, user_message, answer)
        
        # Track usage
        usage = {
            'prompt_tokens': response.usage.prompt_tokens,
            'completion_tokens': response.usage.completion_tokens,
            'total_tokens': response.usage.total_tokens
        }
        
        return {
            'answer': answer_with_links,
            'citations': citations,
            'context_used': len(context_docs),
            'symbols_analyzed': symbols,
            'conversation_id': conversation_id,
            'timestamp': datetime.now().isoformat(),
            'model': self.model,
            'usage': usage
        }
    
    def _call_groq_api(
        self,
        messages: List[Dict],
        temperature: float,
        max_tokens: int
    ):
        """Call Groq API synchronously"""
        return self.client.chat.completions.create(
            messages=messages,
            model=self.model,
            temperature=temperature,
            max_tokens=max_tokens,
            top_p=1,
            stream=False
        )
    
    async def chat_stream(
        self,
        user_message: str,
        user_portfolio: Optional[List[str]] = None,
        conversation_id: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1500
    ):
        """
        Stream chat responses for better UX
        
        Yields chunks of the response as they're generated
        """
        if not conversation_id:
            conversation_id = self._generate_conversation_id()
        
        symbols = self._extract_symbols(user_message)
        context_docs = await self._retrieve_context(user_message, symbols)
        
        portfolio_summary = ""
        if user_portfolio:
            portfolio_analysis = await self.portfolio_manager.monitor_existing_positions(
                user_portfolio
            )
            portfolio_summary = self._format_portfolio_summary(portfolio_analysis)
        
        context_text = self._format_context(context_docs)
        messages = self._build_messages(
            user_message,
            context_text,
            portfolio_summary,
            conversation_id
        )
        
        # Stream response
        stream = self.client.chat.completions.create(
            messages=messages,
            model=self.model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        )
        
        full_response = ""
        for chunk in stream:
            if chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                full_response += content
                yield {
                    'chunk': content,
                    'conversation_id': conversation_id
                }
        
        # Store complete conversation
        self._store_conversation(conversation_id, user_message, full_response)
        
        # Send final metadata
        citations = self._extract_citations(context_docs)
        yield {
            'done': True,
            'citations': citations,
            'symbols_analyzed': symbols,
            'conversation_id': conversation_id
        }
    
    async def _retrieve_context(
        self,
        query: str,
        symbols: List[str]
    ) -> List[Dict]:
        """Retrieve relevant context from vector store"""
        context_docs = []
        
        if symbols:
            # Get specific stock information
            for symbol in symbols:
                docs = self.vector_store.query(
                    query_text=query,
                    symbol=symbol,
                    top_k=5,
                    min_sentiment_score=None  # Include all sentiments
                )
                context_docs.extend(docs)
        else:
            # General query across all stocks
            docs = self.vector_store.query(
                query_text=query,
                top_k=10
            )
            context_docs.extend(docs)
        
        # Remove duplicates based on ID
        seen_ids = set()
        unique_docs = []
        for doc in context_docs:
            if doc['id'] not in seen_ids:
                seen_ids.add(doc['id'])
                unique_docs.append(doc)
        
        # Sort by relevance score
        unique_docs.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        return unique_docs[:15]  # Limit to top 15 most relevant
    
    def _build_messages(
        self,
        user_message: str,
        context: str,
        portfolio_data: str,
        conversation_id: str
    ) -> List[Dict]:
        """Build message list for Groq API"""
        messages = [
            {
                "role": "system",
                "content": self.system_prompt
            }
        ]
        
        # Add conversation history if exists
        if conversation_id in self.conversations:
            history = self.conversations[conversation_id]
            # Add last 5 exchanges to maintain context
            for msg in history[-10:]:  # Last 5 Q&A pairs
                messages.append(msg)
        
        # Build current user message with context
        user_prompt = f"""Context from recent market data:
{context}

"""
        
        if portfolio_data:
            user_prompt += f"""Current Portfolio Analysis:
{portfolio_data}

"""
        
        user_prompt += f"""User Question: {user_message}

Please provide a comprehensive response with proper citations using [Source X] notation."""
        
        messages.append({
            "role": "user",
            "content": user_prompt
        })
        
        return messages
    
    def _store_conversation(
        self,
        conversation_id: str,
        user_message: str,
        assistant_response: str
    ):
        """Store conversation in memory"""
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        
        self.conversations[conversation_id].extend([
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": assistant_response}
        ])
        
        # Limit history to last 20 messages (10 exchanges)
        if len(self.conversations[conversation_id]) > 20:
            self.conversations[conversation_id] = self.conversations[conversation_id][-20:]
    
    def _extract_symbols(self, text: str) -> List[str]:
        """Extract stock symbols from text"""
        import re
        # Match $SYMBOL or standalone tickers
        pattern = r'\$([A-Z]{1,5})\b|(?:^|\s)([A-Z]{2,5})(?:\s|$|[,.:;])'
        matches = re.findall(pattern, text.upper())
        symbols = [m[0] or m[1] for m in matches if m[0] or m[1]]
        
        # Filter to valid symbols
        valid_symbols = [s for s in symbols if len(s) <= 5 and s.isalpha()]
        
        # Remove common false positives
        false_positives = {'I', 'A', 'IN', 'ON', 'AT', 'TO', 'FOR', 'AND', 'OR', 'THE', 'IS', 'IT'}
        valid_symbols = [s for s in valid_symbols if s not in false_positives]
        
        return list(set(valid_symbols))
    
    def _format_context(self, docs: List[Dict]) -> str:
        """Format retrieved documents into context"""
        if not docs:
            return "No recent information available."
        
        context_parts = []
        for i, doc in enumerate(docs, 1):
            # Format date nicely
            timestamp = doc.get('timestamp', 'Unknown')
            try:
                dt = datetime.fromisoformat(timestamp)
                formatted_date = dt.strftime("%B %d, %Y at %I:%M %p")
            except:
                formatted_date = timestamp
            
            context_parts.append(
                f"[Source {i}]\n"
                f"Type: {doc.get('data_type', 'Unknown').title()}\n"
                f"Symbol: {doc.get('symbol', 'N/A')}\n"
                f"Title: {doc.get('title', 'N/A')}\n"
                f"Content: {doc.get('content', 'N/A')[:600]}\n"
                f"Sentiment: {doc.get('sentiment', 'N/A').title()} "
                f"(Score: {doc.get('sentiment_score', 0):.2f})\n"
                f"Date: {formatted_date}\n"
                f"URL: {doc.get('url', 'N/A')}"
            )
        
        return "\n\n---\n\n".join(context_parts)
    
    def _format_portfolio_summary(self, analysis: Dict) -> str:
        """Format portfolio analysis for LLM"""
        health = analysis['portfolio_health']
        
        summary = f"""**Portfolio Health Overview**
Overall Rating: {health['health_rating']} (Score: {health['average_score']:.1f}/100)

**Position Breakdown:**
- Positions with BUY signals: {health['position_breakdown']['buy']}
- Positions with HOLD signals: {health['position_breakdown']['hold']}
- Positions with SELL signals: {health['position_breakdown']['sell']}

**Recommendations:**
- Positions recommended for exit: {len(analysis['exit_recommendations'])}
- Positions recommended to add to: {len(analysis['add_recommendations'])}
"""
        
        # Add specific exit recommendations if any
        if analysis['exit_recommendations']:
            summary += "\n**Exit Candidates:**\n"
            for rec in analysis['exit_recommendations'][:3]:  # Top 3
                summary += f"- {rec['symbol']}: Score {rec['composite_score']:.1f}/100, "
                summary += f"Recommendation: {rec['recommendation']['action']}\n"
        
        return summary
    
    def _extract_citations(self, docs: List[Dict]) -> List[Dict]:
        """Extract citation information"""
        citations = []
        for i, doc in enumerate(docs, 1):
            citation = {
                'number': i,
                'title': doc.get('title', 'Untitled'),
                'source': doc.get('source', 'Unknown'),
                'date': doc.get('timestamp', 'Unknown'),
                'symbol': doc.get('symbol', 'N/A'),
                'sentiment': doc.get('sentiment', 'neutral'),
                'sentiment_score': doc.get('sentiment_score', 0.0)
            }
            
            # Add URL if available
            if doc.get('url') and doc.get('url') != 'N/A':
                citation['url'] = doc.get('url')
            
            citations.append(citation)
        
        return citations
    
    def _enhance_citations_with_links(self, answer: str, citations: List[Dict]) -> str:
        """Add clickable citation links to the answer"""
        import re
        
        # Find all [Source X] mentions
        pattern = r'\[Source (\d+)\]'
        
        def replace_citation(match):
            source_num = int(match.group(1))
            # Find corresponding citation
            for citation in citations:
                if citation['number'] == source_num:
                    if 'url' in citation:
                        return f'[Source {source_num}]({citation["url"]})'
            return match.group(0)  # Return original if no URL
        
        enhanced_answer = re.sub(pattern, replace_citation, answer)
        return enhanced_answer
    
    def _generate_conversation_id(self) -> str:
        """Generate unique conversation ID"""
        import uuid
        return str(uuid.uuid4())
    
    async def generate_stock_report(
        self,
        symbol: str,
        temperature: float = 0.2,
        max_tokens: int = 2500
    ) -> Dict:
        """
        Generate comprehensive stock report
        
        Args:
            symbol: Stock ticker symbol
            temperature: Lower = more factual
            max_tokens: Maximum report length
        """
        # Get comprehensive analysis
        analysis = await self.portfolio_manager.analyze_stock_for_entry(symbol)
        
        # Get recent documents
        recent_docs = self.vector_store.get_recent_documents(
            symbol=symbol,
            hours=72,  # Last 3 days
            data_types=['news', 'social_media']
        )
        
        # Format context
        context = self._format_context(recent_docs[:15])
        
        # Build report prompt
        report_prompt = f"""Generate a comprehensive investment analysis report for {symbol}.

**Available Data:**

Technical Analysis:
- Composite Technical Score: {analysis['technical_analysis']['composite_score']:.1f}/100
- ML Signal: {analysis['technical_analysis']['ml_signal']}
- Key Indicators: {json.dumps(analysis['technical_analysis']['indicators'], indent=2)}

Sentiment Analysis:
- Overall Sentiment: {analysis['sentiment_analysis']['combined']['overall_sentiment'].title()}
- Sentiment Score: {analysis['sentiment_analysis']['combined']['sentiment_score']:.2f} (-1 to +1)
- News Sentiment: {analysis['sentiment_analysis']['financial']['overall_sentiment'].title()}
- Social Media Sentiment: {analysis['sentiment_analysis']['social']['overall_sentiment'].title()}
- Confidence: {analysis['sentiment_analysis']['combined']['confidence']:.2f}

Overall Assessment:
- Composite Score: {analysis['composite_score']:.1f}/100
- Recommendation: {analysis['recommendation']['action']}
- Confidence Level: {analysis['recommendation']['confidence']}

Recent Market Data and News:
{context}

**Report Requirements:**

Please provide a professional investment report with the following sections:

1. **Executive Summary** (2-3 sentences)
   - Current recommendation and rationale
   - Key risk/reward points

2. **Technical Analysis** (3-4 bullet points)
   - Chart patterns and indicators
   - Support/resistance levels if mentioned
   - Technical outlook

3. **Sentiment Analysis** (3-4 bullet points)
   - News sentiment trends
   - Social media sentiment
   - Market perception

4. **Key Catalysts & Risks** (2-3 of each)
   - Positive catalysts
   - Risk factors

5. **Investment Recommendation**
   - Clear action (Buy/Hold/Sell)
   - Target allocation percentage
   - Time horizon
   - Stop-loss suggestions if applicable

6. **Supporting Evidence**
   - Cite specific sources using [Source X] notation
   - Reference specific data points

Format the report in clear markdown with proper headers and bullet points."""
        
        messages = [
            {
                "role": "system",
                "content": "You are a professional financial analyst at a top-tier investment firm. Write clear, actionable reports."
            },
            {
                "role": "user",
                "content": report_prompt
            }
        ]
        
        # Generate report
        response = await asyncio.get_event_loop().run_in_executor(
            self.executor,
            self._call_groq_api,
            messages,
            temperature,
            max_tokens
        )
        
        report = response.choices[0].message.content
        
        # Enhance citations
        citations = self._extract_citations(recent_docs[:15])
        report_with_links = self._enhance_citations_with_links(report, citations)
        
        return {
            'symbol': symbol,
            'report': report_with_links,
            'raw_report': report,
            'analysis': analysis,
            'supporting_documents': recent_docs[:15],
            'citations': citations,
            'generated_at': datetime.now().isoformat(),
            'model': self.model,
            'usage': {
                'prompt_tokens': response.usage.prompt_tokens,
                'completion_tokens': response.usage.completion_tokens,
                'total_tokens': response.usage.total_tokens
            }
        }
    
    async def answer_quick_question(
        self,
        question: str,
        context_symbols: Optional[List[str]] = None
    ) -> Dict:
        """
        Quick answers for simple questions without full RAG pipeline
        Useful for definitions, explanations, general advice
        """
        # For quick questions, use minimal context
        if context_symbols:
            # Get just a few recent docs for context
            context_docs = []
            for symbol in context_symbols[:2]:  # Limit to 2 symbols
                docs = self.vector_store.get_recent_documents(
                    symbol=symbol,
                    hours=24,
                    data_types=['news']
                )
                context_docs.extend(docs[:3])
            
            context = self._format_context(context_docs) if context_docs else ""
        else:
            context = ""
        
        messages = [
            {
                "role": "system",
                "content": "You are a helpful financial advisor. Provide concise, accurate answers."
            },
            {
                "role": "user",
                "content": f"""{"Recent context:\n" + context + "\n\n" if context else ""}Question: {question}

Provide a brief, clear answer (2-4 sentences)."""
            }
        ]
        
        response = await asyncio.get_event_loop().run_in_executor(
            self.executor,
            lambda: self.client.chat.completions.create(
                messages=messages,
                model="llama-3.1-8b-instant",  # Use faster model for quick Q&A
                temperature=0.3,
                max_tokens=300
            )
        )
        
        return {
            'answer': response.choices[0].message.content,
            'timestamp': datetime.now().isoformat(),
            'model': 'llama-3.1-8b-instant'
        }
    
    def clear_conversation(self, conversation_id: str):
        """Clear conversation history"""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict]:
        """Get conversation history"""
        return self.conversations.get(conversation_id, [])

