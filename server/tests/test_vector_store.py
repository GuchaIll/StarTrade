import pytest
import numpy as np

from ResearchAgent.rag.vector_store import VectorStoreManager


class DummyIndex:
    def __init__(self):
        self._data = {}

    def upsert(self, vectors):
        for v in vectors:
            self._data[v['id']] = v

    def query(self, vector, top_k=10, filter=None, include_metadata=True):
        return {'matches': []}


class DummyPC:
    def __init__(self, api_key=None):
        pass

    def list_indexes(self):
        class L:
            def names(self):
                return []
        return L()

    def create_index(self, name, dimension, metric, spec):
        return True

    def Index(self, name):
        return DummyIndex()


def test_generate_embedding_and_upsert(monkeypatch):
    # Monkeypatch Pinecone and SentenceTransformer
    monkeypatch.setattr('ResearchAgent.rag.vector_store.Pinecone', DummyPC)

    class FakeModel:
        def encode(self, text, convert_to_numpy=True):
            return np.zeros(384)

    monkeypatch.setattr('ResearchAgent.rag.vector_store.SentenceTransformer', lambda name: FakeModel())

    vsm = VectorStoreManager(api_key='fake')
    docs = [{
        'symbol': 'TEST',
        'source': 'unit',
        'data_type': 'news',
        'title': 't',
        'content': 'c',
        'url': 'u',
        'timestamp': 'now',
        'sentiment': 'neutral',
        'sentiment_score': 0.0,
        'relevance_score': 0.0
    }]

    # Upsert should not raise and return a dict
    import asyncio
    v = asyncio.run(vsm.upsert_document(docs))
    assert isinstance(v, dict)
