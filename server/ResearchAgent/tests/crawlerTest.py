import requests
from bs4 import BeautifulSoup
import feedparser
import scheduler
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
import hashlib
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import re
from dataclasses import dataclass, asdict
from collections import defaultdict


@dataclass
class Article:
    url: str
    title: str
    content: str
    publish_date:datetime
    fetched_date: datetime
    tickers: List[str]
    sector: str
    view_count: int
    relevance_score: float
    sentiment_score: float
    content_hash: str


class NewSourceScraper:
    """Base class for news source scrapers."""

    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()

    def scrape_yahoo_finance_news(self, ticker: str) -> List[Article]:
        """Scrape Yahoo Finance for news articles related to the given ticker."""
        #url = f"{self.base_url}/quote/{ticker}?p={ticker}"
        url = self.base_url;
        headers = {
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        response = self.session.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        links = []

        print(response)

        for section in soup.select('section.container[data-testid="storyitem"][role="article"]'):
           

            for a in section.find_all('a', href=True):
                links.append(a['href'])
        return links
                 



scraper = NewSourceScraper(base_url="https://finance.yahoo.com")
links = scraper.scrape_yahoo_finance_news("AAPL")
for link in links:
    print(link)