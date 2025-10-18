from groq import Groq
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional, Tuple
import json
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import hashlib 
import re
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import yfinance as yf
import requests
from collections import defaultdict

load_dotenv()

@dataclass 
class Evidence:
    """Piece of evidence to support investment decisions."""
    source: str
    url: str
    quote: str
    publish_date: datetime
    relevance_score: float
    sentiment_score: float

@dataclass
class StockResearchNode:
    """A node in the stock research knowledge graph."""
    query: str
    parent_query: Optional[str]
    depth: int
    articles_found: int
    key_findings: List[str]
    next_queries: List[str]
    tiemstamp: datetime


class LLMOrchestrator:
    """LLM decision making engine for autonomous stock research."""

    def __init__(self, groq_api_key: str):
        api_key = groq_api_key or os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    
    def analyze_user_query(self, query: str) -> Dict:
        """Analyze user query to determine research direction."""
        prompt = f"""You are a financial research assistant. Analyze this user query and create a research plan.

User Query: "{query}"

Create a JSON response with:
1. main_intent: What is the user really asking? (bullish_case, bearish_case, general_analysis, price_prediction, risk_assessment)
2. tickers: List of stock tickers mentioned
3. time_horizon: Relevant time period (today, this_week, this_month, this_quarter, this_year)
4. key_questions: 3-5 specific sub-questions to research
5. required_evidence: What types of evidence would answer this? (earnings, news, analyst_ratings, product_launches, regulatory, technical_analysis)
6. search_queries: 5-7 specific search queries to find relevant articles

Format as valid JSON only, no other text."""

        response = self._call_llm(prompt)
        return json.loads(response)
    
    def decide_next_action(self, current_state: Dict) -> Dict:
        """Decide what to research next based on current findings"""
        
        prompt = f"""You are conducting autonomous financial research. Based on what we've found so far, decide the next action.

Current State:
- Main Question: {current_state['main_question']}
- Articles Collected: {current_state['articles_collected']}
- Key Findings So Far: {json.dumps(current_state['findings'], indent=2)}
- Queries Explored: {current_state['queries_explored']}
- Depth: {current_state['depth']}/5

Decide:
1. continue: Should we continue researching? (yes/no with reason)
2. next_queries: If yes, what 2-3 specific queries should we explore next?
3. missing_info: What critical information are we still missing?
4. confidence: How confident are we in our current understanding? (0-100)

Format as JSON only."""

        response = self._call_llm(prompt)
        return json.loads(response)
    
    def synthesize_answer(self, query: str, evidence: List[Dict]) -> Dict:
        """Synthesize evidence into a comprehensive answer"""
        
        evidence_text = "\n\n".join([
            f"Source {i+1}: {e['title']}\n"
            f"Date: {e['publish_date']}\n"
            f"Content: {e['summary']}\n"
            f"URL: {e['url']}"
            for i, e in enumerate(evidence[:15])  # Limit to top 15
        ])
        
        prompt = f"""You are a financial analyst synthesizing research findings.

User Question: "{query}"

Evidence Collected:
{evidence_text}

Provide a comprehensive answer with:
1. direct_answer: Clear, direct answer to the question (2-3 paragraphs)
2. key_points: 5-7 bullet points of most important findings
3. evidence_summary: How the evidence supports each key point (map key_point_index to source numbers)
4. strength_indicators: Specific bullish factors found with evidence
5. weakness_indicators: Specific bearish factors found with evidence
6. confidence_level: Overall confidence in analysis (low/medium/high)
7. missing_information: What data would improve this analysis
8. recommendation: Brief investment perspective based on findings

Be specific and cite source numbers. Format as JSON."""

        response = self._call_llm(prompt, max_tokens=2000)
        return json.loads(response)
    
    def extract_structured_data(self, article_html: str, extraction_goal: str) -> Dict:
        """Extract specific structured data from article"""
        
        prompt = f"""Extract the following information from this article:

Goal: {extraction_goal}

Article Text (first 3000 chars):
{article_html[:3000]}

Extract as JSON with these fields:
- headline: Main headline
- key_facts: List of 3-5 key facts (be specific, include numbers/dates)
- tickers_mentioned: List of stock tickers mentioned
- sentiment: overall/bullish/bearish/neutral
- price_targets: Any price targets or financial projections mentioned
- timeframe: Relevant time period discussed
- source_credibility: high/medium/low (based on specificity and data quality)

Format as valid JSON only."""

        response = self._call_llm(prompt, max_tokens=500)
        return json.loads(response)
    
    def _call_llm(self, prompt: str, max_tokens: int = 1000) -> str:
        """Call Groq LLM with error handling"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are a financial research assistant. Always respond with valid JSON only, no markdown formatting or extra text."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model=self.model,
                temperature=0.3,
                max_tokens=max_tokens,
                top_p=1,
                stream=False
            )
            
            response_text = chat_completion.choices[0].message.content
            
            # Clean up response - remove markdown code blocks if present
            response_text = response_text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            return response_text.strip()
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response was: {response_text[:200]}")
            return "{}"
        except Exception as e:
            print(f"Groq API error: {e}")
            return "{}"

            