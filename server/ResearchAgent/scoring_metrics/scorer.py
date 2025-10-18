import re
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import lru_cache
from array import array
import ctypes
import platform

from sentence_transformers import SentenceTransformer, util
PLATFORM = platform.system()

#TODO: UPDATE THE WEIGHTS

#Freshness scoring weights for articles based on age in months and days
#exponential decay weights
_FRESHNESS_SCORE = [
    1.0,  # 0 days old
    0.9,  # 1 day old
]

class ArticleScorer:
    """Class to score articles based on various metrics"""

    def __init__(self, keywords: List[str], domain_authority: Dict[str, int]):
        self.logger = logging.getLogger(__name__)
        self.keywords = keywords
        self.domain_authority = domain_authority
        self.model = SentenceTransformer('all-MiniLM-L6-v2')#for similarity and diversity scoring

    def relevance_score(self, article: Dict) -> float:
        
        content = (article.get('title', '') + ' ' + article.get('summary', '')).lower()
        return sum(kw.lower() in content for kw in self.keywords) / len(self.keywords)
    
    #Exponential decay: fresher articles get higher scores
    def freshness_score(self, article: Dict) -> float:
        publish_data = article.get('published_date')
        if not publish_data:
            return 0.0
        day_old = (datetime.utcnow() - publish_data).days
        return 1.0 / (1.0 + day_old)

    def popularity_score(self, article: Dict) -> float:
        return min(article.get('popularity', 0) / 1000.0, 1.0)
    
    def authority_score(self, article: Dict) -> float:
        domain = article.get('url', '').split('/')[2]
        return self.domain_authority.get(domain, 0.5)

    def diversity_score(self, article_embedding, selected_embeddings) -> float:
        if not selected_embeddings:
            return 1.0
        max_sim = max(util.pytorch_cos_sim(article_embedding, emb).item() for emb in selected_embeddings)
        return 1.0 - max_sim  # Lower similarity = higher diversity

    def composite_score(self, article: Dict, selected_embeddings: List) -> float:

        

        relevance = self.relevance_score(article)
        freshness = self.freshness_score(article)
        popularity = self.popularity_score(article)
        authority = self.authority_score(article)
        
        embed = self.article.get('embedding')
        if embed is None:
            content = article.get('content') or article.get('summary') or article.get('title', '')
            embed = self.model.encode(content, convert_to_tensor=True)
            article['embedding'] = embed
        
        diversity = self.diversity_score(embed, selected_embeddings)

        # Weighted sum of scores
        score = (0.3 * relevance +
                 0.2 * freshness +
                 0.2 * popularity +
                 0.1 * authority +
                 0.1 * diversity)
        
        return score
