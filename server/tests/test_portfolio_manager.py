import pytest
from ResearchAgent.rag.vector_store import VectorStoreManager
from ResearchAgent.agents.sentiment_agent import SentimentAnalysisAgent
from PortfolioManager.portfolio_manager import PortfolioManager


class DummyVS:
    def get_recent_documents(self, symbol, hours, data_types=None):
        return [
            {'id': '1', 'symbol': symbol, 'data_type': 'news', 'content': 'Good earnings', 'sentiment': 'positive', 'sentiment_score': 0.8},
            {'id': '2', 'symbol': symbol, 'data_type': 'social_media', 'content': 'Tweet about product', 'sentiment': 'neutral', 'sentiment_score': 0.5}
        ]


def test_portfolio_manager_analysis(monkeypatch):
    # Monkeypatch SentimentAnalysisAgent to avoid model loading
    class FakeSentiment:
        def aggregate_sentiment(self, texts, source='financial'):
            return {
                'positive_ratio': 0.6,
                'negative_ratio': 0.2,
                'neutral_ratio': 0.2
            }

    vs = DummyVS()
    sa = FakeSentiment()

    pm = PortfolioManager(vector_store=vs, sentiment_agent=sa)

    # Provide a dummy technical analyzer with an async analyze method
    class DummyTechAnalyzer:
        async def analyze(self, symbol):
            return {'composite_score': 50}

    pm.technical_analyzer = DummyTechAnalyzer()

    # Call analyze_stock_for_entry synchronously via asyncio
    import asyncio

    async def run():
        res = await pm.analyze_stock_for_entry('TEST')
        return res

    result = asyncio.run(run())
    assert result['symbol'] == 'TEST'
    assert 'composite_score' in result
