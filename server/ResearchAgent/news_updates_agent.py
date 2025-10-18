from datetime import datetime, timedelta
import os
import requests
from typing import List, Dict, Optional, Tuple

from scoring_metrics.scorer import ArticleScorer


###News Update Agent 
REPUTABLE_SOURCES = {
    "reuters.com",
    "bloomberg.com",
    "wsj.com",
    "ft.com",
    "cnbc.com",
    "marketwatch.com",
    "seekingalpha.com",
    "yahoo.com",
    "yahoo-finance.com",
    "yahoo.co.uk",
    "yahoo.co.in",
    "yahoo.co.jp",
    "yahoo.ca",
    "yahoo.com.au",
    "fool.com",
    "investopedia.com",
    "theverge.com",
    "techcrunch.com",
    "wired.com",
    "engadget.com"
}

MARKET_KEYWORDS = [
    "stock", "market",
    "shares", "invest", "investment",
    "bullish", "bearish", "earnings",
    "revenue", "profit", "loss",
    "forecast", "outlook", "guidance",
    "acquisition", "merger", "ipo",
    "dividend", "buyback", "valuation",
    "economy", "inflation", "interest rate",
    "fed", "federal reserve", "cpi",
    "gdp", "unemployment", "jobs report",
    "sec", "regulation", "compliance",
    "cryptocurrency", "bitcoin", "blockchain",
    "etf", "mutual fund", "hedge fund"
]

class NewsUpdatesAgent:
    """Agent for fetching and processing news updates with LLM guided queries"""


    def __init__(self, finnhHUB_KEY: str = None, alphaVantage_KEY: str = None, groq_api_key: str = None):
        self.finnhub_api_key = finnhHUB_KEY or os.environ.get("FINN_HUB_API_KEY")
        self.alphaVantage_key = alphaVantage_KEY or os.environ.get("ALPHA_VANTAGE_API_KEY")
        api_key = groq_api_key or os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        
        self.session = requests.Session()

        #use market keywords and new relevant market keywords for scoring
        self.scorer = ArticleScorer(keywords=MARKET_KEYWORDS, domain_authority=REPUTABLE_SOURCES)

    def search_news(self, query: str, ticker: str = None, days_back: int = 30) -> List[Dict]:
        """Search news with intelligent query expansion"""
        articles = []

        if ticker:
            articles.extend(self._get_finnhub_news(ticker, days_back))
            articles.extend(self._get_alpha_vantage_news(ticker, days_back))

        if self.alphaVantage_key:
            articles.extend(self._get_alpha_vantage_news(query, days_back))

        seen_utls = set()
        unique_articles = []

        #Deduplicate articles by URL, sort by scoring metrics
        for article in articles:
            if article['url'] not in seen_utls:
                seen_utls.add(article['url'])
                unique_articles.append(article)

        selected_embeddings = []
        #Score and sort articles
        #calculate embedding scores
        for article in unique_articles:
            content = article.get('content') or article.get('summary') or article.get('title', '')
            article['embedding'] = self.scorer.model.encode(content, convert_to_tensor=True)

        for article in unique_articles:
            article['score'] = self.scorer.composite_score(article, selected_embeddings)
            selected_embeddings.append(article['embedding'])

        sorted_articles = sorted(unique_articles, key=lambda x: x['score'], reverse=True)
        return sorted_articles[:50]
    

    def _get_finnhub_news(self, ticker: str, days_back: int) -> List[Dict]:
        """Fetch news from Finnhub API"""
        if not self.finnhub_api_key:
            return []
        
        try:
        
            url = "https://finnhub.io/api/v1/company-news"
            from_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
            to_date = datetime.now().strftime('%Y-%m-%d')
            params = {
                "symbol": ticker,
                "from": from_date,
                "to": to_date,
                "token": self.finnhub_api_key
            }
            response = self.session.get(url, params=params)
            if response.status_code != 200:
                return []
        
            data = response.json()
            articles = []
            for item in data:
                articles.append({
                    "title": item.get("headline"),
                    "url": item.get("url"),
                    "summary": item.get("summary"),
                    "published_date": datetime.fromtimestamp(item.get("datetime")),
                    "source": item.get("source"),
                    "content": item.get("summary"),  # Finnhub does not provide full content
                    "popularity": 0  # Placeholder, Finnhub does not provide popularity
                })
            return articles
        except Exception as e:
            print(f"Error fetching Finnhub news: {e}")
            return []

    def _get_alpha_vantage_news(self, query: str, days_back: int) -> List[Dict]:
        """Fetch news from Alpha Vantage API"""
        if not self.alphaVantage_key:
            return []
        
        try:
            url = "https://www.alphavantage.co/query"
            params = {
                "function": "NEWS_SENTIMENT",
                "keywords": query,
                "apikey": self.alphaVantage_key
            }
            response = self.session.get(url, params=params)
            if response.status_code != 200:
                return []
        
            data = response.json()
            articles = []
            from_date = datetime.now() - timedelta(days=days_back)
            for item in data.get("feed", []):
                pub_date_str = item.get("time_published")
                pub_date = datetime.strptime(pub_date_str, '%Y-%m-%dT%H:%M:%S.%fZ') if pub_date_str else None
                if pub_date and pub_date >= from_date:
                    articles.append({
                        "title": item.get("title"),
                        "url": item.get("url"),
                        "summary": item.get("summary"),
                        "published_date": pub_date,
                        "source": item.get("source"),
                        "content": item.get("summary"),  # Alpha Vantage does not provide full content
                        "popularity": 0  # Placeholder, Alpha Vantage does not provide popularity
                    })
            return articles
        except Exception as e:
            print(f"Error fetching Alpha Vantage news: {e}")
            return []


                            
        