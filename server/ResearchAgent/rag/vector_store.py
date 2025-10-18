from typing import List, Dict, Optional
import numpy as np
from sentence_transformer import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from datetime import datetime, timedelta
import hashlib

class VectorStoreManager:
    """
    Manage vector embeddings and retrieval
    """

    def __init__ (self, api_key: str, index_name: str = "stock-intelligence"):

        self.pc = Pinecone(api_key = api_key)
        self.index_name = index_name

        if index_name not in self.pc.list_indexes().names():
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


        #Initialize embedding mode
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')


        #structure Metadata
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

    def generate_embedding(self, test: str) -> np.ndarray:
        """Generate embedding for text"""
        return self.embedding_model.encoder(text, convert_to_numpy = True)

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
                'timestamp': doc.get('timestamp', datetime.utcnow().isoformat()),
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
        cutoff_time = datetime.now() - timedelta(hours=hours).isoformat()

        filter_dict = {
            'symbol': {'$eq': symbol},
            'timestamp': {'$gte': cutoff_time}
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
