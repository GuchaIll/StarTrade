import pytest
from fastapi.testclient import TestClient

import app as server_app


@pytest.fixture
def client(monkeypatch):
    # Replace orchestrator with a lightweight fake to avoid heavy startup
    class FakeOrchestrator:
        class LLMAgent:
            async def chat(self, user_message, user_portfolio=None, conversation_id=None):
                return type('R', (), {'answer': 'ok', 'citations': [], 'conversation_id': conversation_id or 'cid', 'timestamp': 'now'})()

        class PortfolioManager:
            async def analyze_stock_for_entry(self, symbol):
                return {
                    'symbol': symbol,
                    'composite_score': 75,
                    'recommendation': {'action': 'BUY', 'confidence': 'HIGH', 'score': 75},
                    'portfolio_health': {},
                }

            async def monitor_existing_positions(self, symbols):
                # Return a structure similar to PortfolioManager.monitor_existing_positions
                analyses = []
                for s in symbols:
                    analyses.append({
                        'symbol': s,
                        'composite_score': 75,
                        'recommendation': {'action': 'BUY', 'confidence': 'HIGH', 'score': 75}
                    })
                return {
                    'portfolio_health': {'health_rating': 'GOOD', 'average_composite_score': 75.0, 'position_breakdown': {'buy': len(analyses), 'hold': 0, 'sell': 0}},
                    'exit_recommendations': [],
                    'add_recommendations': analyses,
                    'detailed_analyses': analyses,
                    'timestamp': 'now'
                }

    fake = FakeOrchestrator()
    fake.llm_agent = FakeOrchestrator.LLMAgent()
    fake.portfolio_manager = FakeOrchestrator.PortfolioManager()
    fake.vector_store = type('VS', (), {'get_recent_documents': lambda self, symbol, hours, data_types: []})()

    monkeypatch.setattr(server_app, 'orchestrator', fake)
    client = TestClient(server_app.app)
    return client


def test_chat_endpoint(client):
    payload = {'message': 'hello', 'portfolio': ['AAPL'], 'conversation_id': 'test'}
    r = client.post('/api/chat', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert 'answer' in body
    assert body['conversation_id'] == 'test'


def test_analyze_stock(client):
    payload = {'symbol': 'AAPL'}
    r = client.post('/api/analyze/stock', json=payload)
    assert r.status_code == 200
    assert r.json().get('symbol') == 'AAPL'


def test_get_recent_news(client):
    r = client.get('/api/news/AAPL')
    assert r.status_code == 200
    body = r.json()
    assert body['symbol'] == 'AAPL'
    assert isinstance(body['news'], list)


def test_analyze_portfolio_endpoint(client):
    payload = {'symbols': ['AAPL', 'MSFT']}
    r = client.post('/api/analyze/portfolio', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert 'portfolio_health' in body


def test_stock_report_endpoint(client):
    r = client.get('/api/stocks/AAPL/report')
    assert r.status_code == 200
    body = r.json()
    assert body.get('symbol') == 'AAPL'


def test_screen_stocks_endpoint(client):
    # set up two symbols where only one meets threshold
    payload = ['AAPL', 'MSFT']
    # Prefect-wrapped function in code may expect different param names; monkeypatch a tolerant stub
    import app as server_app

    async def _fake_screen(*args, **kwargs):
        # accept either positional or keyword symbols
        syms = kwargs.get('symbols') or kwargs.get('candidate_symbols') or (args[0] if args else [])
        min_score = kwargs.get('min_score', 65)
        # return those above threshold
        return [ {'symbol': s, 'composite_score': 80} for s in syms if 80 >= min_score ]

    # Patch the function used by the endpoint
    monkeypatch = client.__class__
    import importlib
    server_app = importlib.import_module('app')
    server_app.screen_new_stocks = _fake_screen

    r = client.post('/api/screen?min_score=70', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert 'recommendations' in body
    assert isinstance(body['recommendations'], list)


def test_chat_error_returns_500(client, monkeypatch):
    # Use the client fixture's orchestrator via monkeypatch
    import app as server_app

    class E:
        async def chat(self, *args, **kwargs):
            raise Exception('boom')

    # ensure the fixture-created orchestrator is accessible
    server_app.orchestrator.llm_agent = E()
    r = client.post('/api/chat', json={'message': 'hi'})
    assert r.status_code == 500


def test_get_recent_news_error(client, monkeypatch):
    import app as server_app

    class VS:
        def get_recent_documents(self, symbol, hours, data_types):
            raise RuntimeError('fail')

    server_app.orchestrator.vector_store = VS()
    r = client.get('/api/news/AAPL')
    assert r.status_code == 500


def test_websocket_updates(client, monkeypatch):
    import app as server_app

    # make sleep a no-op so the inner loop won't delay
    async def _nosleep(_):
        return None

    monkeypatch.setattr(server_app.asyncio, 'sleep', _nosleep)

    # ensure portfolio_manager returns expected shape
    class PM:
        async def monitor_existing_positions(self, portfolio):
            return {
                'portfolio_health': {'health_rating': 'GOOD', 'average_composite_score': 75.0, 'position_breakdown': {'buy': 1, 'hold': 0, 'sell': 0}},
                'exit_recommendations': [],
                'add_recommendations': [],
                'detailed_analyses': [],
                'timestamp': 'now'
            }

    server_app.orchestrator.portfolio_manager = PM()

    with client.websocket_connect('/ws/updates') as ws:
        ws.send_json({'portfolio': ['AAPL']})
        msg = ws.receive_json()
        assert 'portfolio_health' in msg
