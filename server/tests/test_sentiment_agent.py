import pytest

from ResearchAgent.agents import sentiment_agent as sa_mod


def test_sentiment_agent_monkeypatched(monkeypatch):
    # Avoid downloading models by skipping __init__
    monkeypatch.setattr(sa_mod.SentimentAnalysisAgent, "__init__", lambda self: None)
    agent = sa_mod.SentimentAnalysisAgent()

    # Provide lightweight implementations for methods used in aggregation
    agent.analyze_financial_sentiment = lambda text: {
        'sentiment': 'positive',
        'scores': {'positive': 0.8, 'neutral': 0.1, 'negative': 0.1},
        'confidence': 0.8
    }

    agent.analyze_social_sentiment = lambda text: {
        'sentiment': 'neutral',
        'score': 0.5,
        'confidence': 0.5
    }

    agent.classifier = lambda text, labels, multi_label=True: {
        'labels': ['economy', 'earnings'],
        'scores': [0.9, 0.45]
    }

    topics = agent.extract_topics("Company beats estimates", ['economy', 'earnings'])
    assert 'topics' in topics

    agg = agent.aggregate_sentiment(["Good quarter", "Mixed guidance"], source='financial')
    assert 'overall_sentiment' in agg
    assert 'detailed_scores' in agg
