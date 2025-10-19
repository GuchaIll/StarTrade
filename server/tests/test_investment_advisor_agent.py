import pytest
import asyncio

from LLMAgent.investment_advisor_agent import InvestmentAdvisorAgent


class DummyVS:
    def query(self, query_text, symbol=None, top_k=5, min_sentiment_score=None):
        return []


class DummyPM:
    async def monitor_existing_positions(self, portfolio):
        return {
            'portfolio_health': {'health_rating': 'GOOD', 'average_score': 75.0, 'position_breakdown': {'buy': 1, 'hold': 0, 'sell': 0}},
            'exit_recommendations': [],
            'add_recommendations': [],
            'detailed_analyses': [],
            'timestamp': 'now'
        }


def test_investment_agent_symbol_extraction_and_message_build(monkeypatch):
    # Create agent but monkeypatch Groq client and model calls
    monkeypatch.setattr(InvestmentAdvisorAgent, '__init__', lambda self, vector_store, portfolio_manager, groq_api_key=None: None)
    agent = InvestmentAdvisorAgent(None, None)

    # Attach required attributes manually
    agent.vector_store = DummyVS()
    agent.portfolio_manager = DummyPM()
    agent.conversations = {}
    agent.system_prompt = "system"
    agent.model = 'dummy'

    # Monkeypatch _call_groq_api to return a fake response object with choices and usage
    class FakeResponse:
        class C:
            class M:
                content = 'Answer text'

        choices = [type('o', (), {'message': type('m', (), {'content': 'Answer text'})})()]
        usage = type('u', (), {'prompt_tokens': 1, 'completion_tokens': 1, 'total_tokens': 2})

    agent._call_groq_api = lambda messages, temperature, max_tokens: FakeResponse()

    # Test symbol extraction
    symbols = agent._extract_symbols('Should we buy $AAPL and MSFT?')
    assert 'AAPL' in symbols or 'MSFT' in symbols

    # Test message building and storage
    msgs = agent._build_messages('Hello', 'ctx', 'portfolio', 'cid')
    assert any(m['role'] == 'user' for m in msgs)

    # Test storing conversation
    agent._store_conversation('cid', 'q', 'a')
    assert 'cid' in agent.conversations
