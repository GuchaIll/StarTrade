from typing import List, Dict, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
try:
    from pinecone import Pinecone, ServerlessSpec
    _HAVE_PINECONE = True
except Exception:
    _HAVE_PINECONE = False
from datetime import datetime, timedelta
import hashlib

class VectorStoreManager:
    """
    Manage vector embeddings and retrieval
    """

    def __init__ (self, api_key: Optional[str], index_name: str = "stock-intelligence"):

        self.index_name = index_name
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

        # If Pinecone isn't available or API key is missing/invalid, use an in-memory fallback
        self._use_in_memory = False
        if not _HAVE_PINECONE or not api_key:
            self._use_in_memory = True
        else:
            try:
                self.pc = Pinecone(api_key = api_key)
                # create index if missing
                existing = self.pc.list_indexes()
                # depending on Pinecone client shape, list_indexes() may return a list or object
                indexes = existing
                if hasattr(existing, 'names'):
                    indexes = existing.names()

                if index_name not in indexes:
                    self.pc.create_index(
                        name=index_name,
                        dimension = 384,
                        metric = 'cosine',
                        spec = ServerlessSpec(
                            cloud='aws',
                            region = 'us-east-1'
                        )
                    )

                self.index = self.pc.Index(index_name)
            except Exception as e:
                # fall back to in-memory store if any Pinecone error occurs (e.g. Unauthorized)
                print(f"[vector_store][warning] Pinecone unavailable, using in-memory store: {e}")
                self._use_in_memory = True

        # in-memory structures
        if self._use_in_memory:
            self._store = {}  # id -> {'vector': [...], 'metadata': {...}}

        # structure Metadata
        self.metadata_schema = {
            'symbol': str,
            'source': str,
            'data_type': str,
            'title': str,
            'content': str,
            'url': str,
            'timestamp': str,
            'sentiment': str,
            'sentiment_score': float,
            'relevance_score': float
        }

    def generate_embedding(self, text: str) -> np.ndarray:
        """Generate embedding for text"""
        # SentenceTransformer provides an `encode` method which can return numpy arrays
        return self.embedding_model.encode(text, convert_to_numpy=True)

    def create_document_id(self, content: str, symbol: str, timestamp: str) -> str:
        unique_string = f"{symbol}_{content[:100]}_{timestamp}"
        return hashlib.md5(unique_string.encode()).hexdigest()

    async def upsert_document(self, documents: List[Dict]) -> Dict:
        """
        Upsert documents into vector store
        format:
            {
                'symbol' : 'AAPL',
                'source' : 'yfinance',
                'data_type' : 'news',
                'title' : 'Apple announces...',
                'content': 'full article content',
                'url': 'https://...'
                'timestamp': '2025-01015T10:00:00',
                'sentiment': 'positive',
                'sentiment_score': 0.85
            }
            """

        vectors = []

        for doc in documents:
            #generate embeddings: title + content
            text_to_embed = f"{doc.get('title', '')} {doc.get('content', '')}"
            embedding = self.generate_embedding(text_to_embed)

            doc_id = self.create_document_id (
                doc.get('content', ''),
                doc.get('symbol', ''),
                doc.get('timestamp', '')
            )

            metadata = {
                'symbol': doc.get('symbol', ''),
                'source': doc.get('source', ''),
                'data_type': doc.get('data_type', ''),
                'title': doc.get('title', ''),
                'content': doc.get('content', ''),
                'url': doc.get('url', ''),
                'timestamp': doc.get('timestamp', datetime.now().isoformat()),
                'sentiment': doc.get('sentiment', ''),
                'sentiment_score': doc.get('sentiment_score', 0.0),
                'relevance_score': doc.get('relevance_score', 0.0)
            }

            vectors.append({
                'id': doc_id,
                'values': embedding.tolist(),
                'metadata': metadata
            })

        #batch upsert
        if self._use_in_memory:
            for vec in vectors:
                self._store[vec['id']] = {'vector': vec['values'], 'metadata': vec['metadata']}
        else:
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i+batch_size]
                self.index.upsert(vectors=batch)

        return {
            'upserted' : len(vectors),
            'timestamp': datetime.now().isoformat()
        }

    def query(
            self,
            query_text: str,
            symbol: Optional[str] = None,
            data_types: Optional[List[str]] = None,
            top_k: int = 10,
            min_sentiment_score: Optional[float] = None
        ) -> List[Dict]:

        """
        Query vector store with filters"""

        query_embedding = self.generate_embedding(query_text)

        filter_dict = {}
        if symbol:
            filter_dict['symbol'] = {'$eq': symbol}
        if data_types:
            filter_dict['data_type'] = {'$in': data_types}
        if min_sentiment_score is not None:
            filter_dict['sentiment_score'] = {'$gte': min_sentiment_score}

        if self._use_in_memory:
            # naive similarity: cosine on stored vectors
            def cosine(a, b):
                a = np.array(a)
                b = np.array(b)
                if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
                    return 0.0
                return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

            matches = []
            for _id, item in self._store.items():
                md = item['metadata']
                # apply filters
                if symbol and md.get('symbol') != symbol:
                    continue
                if data_types and md.get('data_type') not in data_types:
                    continue
                if min_sentiment_score is not None and md.get('sentiment_score', 0) < min_sentiment_score:
                    continue

                score = cosine(query_embedding.tolist(), item['vector'])
                matches.append({'id': _id, 'score': score, 'metadata': md})

            matches = sorted(matches, key=lambda x: x['score'], reverse=True)[:top_k]
            return [
                {'id': m['id'], 'score': m['score'], **m['metadata']} for m in matches
            ]

        results = self.index.query(
            vector = query_embedding.tolist(),
            top_k = top_k,
            filter = filter_dict if filter_dict else None,
            include_metadata = True
        )

        return [
            {
                'id': match['id'],
                'score': match['score'],
                 **match['metadata']
            }
            for match in results['matches']
        ]

    def get_revent_documents(
            self,
            symbol: str,
            hours: int = 24,
            data_types: Optional[List[str]] = None
        ) -> List[Dict]:
        """ Get most recent documents for a symbol within the last 'hours' """
        cutoff_time = datetime.now() - timedelta(hours=hours)

        if self._use_in_memory:
            results = []
            for _id, item in self._store.items():
                md = item['metadata']
                ts = md.get('timestamp')
                try:
                    t = datetime.fromisoformat(ts)
                except Exception:
                    continue
                if t < cutoff_time:
                    continue
                if data_types and md.get('data_type') not in data_types:
                    continue
                if md.get('symbol') != symbol:
                    continue

                results.append({'id': _id, **md})

            # return latest first
            results = sorted(results, key=lambda r: r.get('timestamp', ''), reverse=True)
            return results[:100]

        cutoff_iso = cutoff_time.isoformat()

        filter_dict = {
            'symbol': {'$eq': symbol},
            'timestamp': {'$gte': cutoff_iso}
        }

        if data_types:
            filter_dict['data_type'] = {'$in': data_types}

        dummy_vector = [0.0] * 384

        results = self.index.query(
            vector = dummy_vector,
            top_k = 100,
            filter = filter_dict,
            include_metadata = True
        )

        return [
            {
                'id': match['id'],
                 **match['metadata']
            }
            for match in results['matches']
        ]

    # Backwards-compatible alias (fix typo in original name)
    def get_recent_documents(self, symbol: str, hours: int = 24, data_types: Optional[List[str]] = None) -> List[Dict]:
        """Alias for get_revent_documents (keeps existing callers working)."""
        return self.get_revent_documents(symbol, hours, data_types)
