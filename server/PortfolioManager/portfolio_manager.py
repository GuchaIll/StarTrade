from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from ResearchAgent.rag.vector_store import VectorStoreManager 
from ResearchAgent.agents.sentiment_agent import SentimentAnalysisAgent

class PortfolioManager:
    """
    Manages portfolio data and provides methods to analyze and update the portfolio.
    """

    
    def __init__(self, vector_store: VectorStoreManager, sentiment_agent: SentimentAnalysisAgent):
        self.vector_store = vector_store
        self.sentiment_agent = sentiment_agent
        self.technical_analyzer = None  # TechnicalAnalyzer not available
    async def analyze_stock_for_entry(self, symbol: str) -> Dict:
        """
        comprehensive analysis of a stock for potential entry points
        """
        # Retrieve recent documents from vector store
        recent_news = self.vector_store.get_recent_documents(
            symbol=symbol,
            hours=48,
            data_types=['news', 'social_media']
        )

        news_texts = []
 
        news_texts = [doc['content'] for doc in recent_news if doc['data_type'] == 'news']
        social_texts = [doc['content'] for doc in recent_news if doc['data_type'] == 'social_media']

        news_sentiment = self.sentiment_agent.aggregate_sentiment(news_texts, source='financial')
        social_sentiment = self.sentiment_agent.aggregate_sentiment(social_texts, source='social')

        technical_signals = await self.technical_analyzer.analyze(symbol)
        technical_signals = {'composite_score': 50}  # Default neutral score when analyzer unavailable
        composite_score = self._calculate_composite_score(
            news_sentiment,
            social_sentiment,
            technical_signals
        )

        recommendation = self._generate_recommendation(composite_score)

        return {
            'symbol': symbol,
            'composite_score': composite_score,
            'recommendation': recommendation,
            'sentiment_analysis': {
                'news': news_sentiment,
                'social': social_sentiment
            },
            'technical_analysis': technical_signals,
            'supporting_documents': recent_news[:5],
            'analyzed_at': datetime.now().isoformat()
        }

    def _calculate_composite_score(self, news_sentiment: Dict,
                                   social_sentiment: Dict,
                                   technical_signals: Dict) -> float:
        """
        Calculate a composite score based on sentiment and technical analysis.
        Weights: News 40% Social 20% Technical 40%
        """
        news_score = self._sentiment_to_score(news_sentiment)
        social_score = self._sentiment_to_score(social_sentiment)

        technical_score = technical_signals.get('composite_score', 0)

        # Compute numeric composite score (weights: news 40%, social 20%, technical 40%)
        composite = (
            0.4 * news_score +
            0.2 * social_score +
            0.4 * technical_score
        )

        return round(composite, 2)
    
    def _sentiment_to_score(self, sentiment:Dict) -> float:
        """
        Convert sentiment to 0-100 score"""

        positive_ratio = sentiment['positive_ratio']
        negative_ratio = sentiment['negative_ratio']
        neutral_ratio = sentiment['neutral_ratio']

        net_sentiment = positive_ratio - negative_ratio
        return 50 + (net_sentiment * 50)
    
    def _generate_recommendation(self, composite_score: float) -> str:
        """
        Generate buy/hold/sell recommendation based on composite score.
        """
        if composite_score >= 70:
            action = 'BUY'
            confidence = 'HIGH'
        elif composite_score >= 60:
            action = 'BUY'
            confidence = 'MEDIUM'
        elif composite_score >= 50:
            action = 'HOLD'
            confidence = 'MEDIUM'
        elif composite_score >= 40:
            action = 'HOLD'
            confidence = 'LOW'
        else:
            action = 'SELL'
            confidence = 'MEDIUM' if composite_score < 30 else 'LOW'

        return {
            'action': action,
            'confidence': confidence,
            'score': composite_score
        }
    
    async def monitor_existing_positions(self, portfolio: List[Dict]) -> List[Dict]:
        """
        Monitor existing positions and provide updated analysis.
        """
        analyses = []

        for symbol in portfolio:
            analysis = await self.analyze_stock_for_entry(symbol)
            analyses.append(analysis)

        exit_candidates = [
            a for a in analyses
            if a['recommendation']['action'] == 'SELL'
        ]

        buy_candidates = [
            a for a in analyses
            if a['recommendation']['action'] == 'BUY' and
                a['recommendation']['confidence'] == 'HIGH'
        ]

        return {
            'portfolio_health': self._calculate_portfolio_health(analyses),
            'exit_recommendations': exit_candidates,
            'add_recommendations': buy_candidates,
            'detailed_analyses': analyses,
            'timestamp': datetime.now().isoformat()
        }
    
    def _calculate_portfolio_health(self, analyses: List[Dict]) -> str:
        """
        Calculate overall portfolio health based on individual analyses.
        """
        avg_score = np.mean([a['composite_score'] for a in analyses])
        
        buy_count = sum(1 for a in analyses if a['recommendation']['action'] == 'BUY')
        sell_count = sum(1 for a in analyses if a['recommendation']['action'] == 'SELL')
        hold_count = sum(1 for a in analyses if a['recommendation']['action'] == 'HOLD')

        return {
            'average_composite_score': round(avg_score, 2),
            'health_rating': 'GOOD' if avg_score >= 60 else 'FAIR' if avg_score >= 50 else 'POOR',
            'position_breakdown': {
                'buy': buy_count,
                'hold': hold_count,
                'sell': sell_count
            }
        }