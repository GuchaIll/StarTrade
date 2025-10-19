from abc import ABC, abstractmethod
from typing import Any, Dict, List
from dataclasses import dataclass
import requests
import asyncio
import aiohttp
import redis
try:
    from pyrate_limiter import Limiter, RequestRate, Duration, BucketFullException
    _HAVE_PYRATE = True
except Exception:
    # Provide a lightweight fallback if pyrate_limiter's API isn't available in the environment.
    _HAVE_PYRATE = False
    class BucketFullException(Exception):
        pass

    import collections, time, asyncio

    class SimpleRateLimiter:
        """A tiny async rate limiter compatible with the ratelimit(name, delay=True) usage.

        This is a sliding window limiter that allows `capacity` requests per `per_seconds`.
        It's intentionally simple and robust for development/testing environments.
        """
        def __init__(self, capacity: int, per_seconds: int = 60):
            self.capacity = int(capacity)
            self.per_seconds = per_seconds
            self.timestamps = collections.deque()
            self.lock = asyncio.Lock()

        def ratelimit(self, name: str, delay: bool = True):
            limiter = self

            class _Ctx:
                async def __aenter__(self_inner):
                    while True:
                        async with limiter.lock:
                            now = time.time()
                            # remove expired timestamps
                            while limiter.timestamps and now - limiter.timestamps[0] >= limiter.per_seconds:
                                limiter.timestamps.popleft()

                            if len(limiter.timestamps) < limiter.capacity:
                                limiter.timestamps.append(now)
                                return

                            if not delay:
                                raise BucketFullException('Rate limit exceeded')

                            # compute wait time until oldest timestamp expires
                            wait = limiter.per_seconds - (now - limiter.timestamps[0])
                        # wait outside of lock
                        await asyncio.sleep(max(wait, 0.01))

                async def __aexit__(self_inner, exc_type, exc, tb):
                    return False

            return _Ctx()

from datetime import datetime, timedelta

@dataclass
class DataSource:
    """Configuration for a data source."""
    name: str
    url: str
    API_key: str
    rate_limit: int # requests per minute
    priority: int #Higher priority sources are queried first

class BaseIngestionAgent(ABC):
    """Abstract base class for data ingestion agents."""
    
    def __init__(self, source: DataSource):
        self.source = source
        if _HAVE_PYRATE:
            self.rate_limiter = Limiter(RequestRate(source.rate_limit, Duration.MINUTE))
        else:
            # fallback: capacity per minute
            self.rate_limiter = SimpleRateLimiter(capacity=source.rate_limit, per_seconds=60)
        self.cache = redis.Redis(host='localhost', port=6379, db=0)
        self.error_handler = lambda e: print(f"Error: {e}")
    
    @abstractmethod
    def fetch_data(self, symbols: Any, days_back: int) -> Any:
        """Fetch data from the configured source."""
        pass


    @abstractmethod
    def parse_response(self, raw_data: Dict[str, Any], start_date: datetime) -> Any:
        """Parse raw data into structured format."""
        pass

    async def ingest(self, query: str, days_back: int) -> List[Dict[str, Any]]:
        """Ingest data with rate limiting and caching."""
        cache_key = f"{self.source.name}:{query}:{days_back}"
        cached_data = self.cache.get(cache_key)
        if cached_data:
            return eval(cached_data)

        try:
            async with self.rate_limiter.ratelimit(f"{self.source.name}_bucket", delay=True):
                raw_data = await self.fetch_data(query, days_back)
                start_date = datetime.now() - timedelta(days=days_back)
                parsed_data = self.parse_response(raw_data, start_date)
                self.cache.set(cache_key, str(parsed_data), ex=3600) # Cache for 1 hour
                return parsed_data
        except BucketFullException as e:
            self.error_handler(e, context = {'symbol': query, 'source': self.source.name, 'error': 'Rate limit exceeded'})
            await asyncio.sleep(60) # Wait before retrying
            return await self.ingest(query, days_back)
        except Exception as e:
            self.error_handler(e, context = {'symbol': query, 'source': self.source.name})
            return []
        

class YFinanceAgent(BaseIngestionAgent):
    """Agent to fetch data from Yahoo Finance. """

    async def fetch_data(self, symbols: List[str], days_back: int) -> Dict[str, Any]:
        import yfinance as yf

        data = []
        for symbol in symbols:
            ticker = yf.Ticker(symbol) 
            hist = ticker.history(period=f"{days_back}d", interval="1d")

            news = ticker.news

            info = ticker.info

            data.append({'symbol': symbol, 
                        'prices': hist.to_dict('records'),
                        'news': news,
                        'fundamentals': info,
                        'timestamp': datetime.now().isoformat()
                        })
            
            return data
        
    def parse_response(self, raw_data: Dict) -> Dict:
        """Standardize yahoo data into a consistent format."""
        return {
            'source': 'yfinance',
            'symbol': raw_data['symbol'],
            'data_type': 'market_data',
            'prices': raw_data['prices'],
            'news': [self._parse_news_item(item) for item in raw_data['news']],
            'fundamentals': self._parse_fundamentals(raw_data['fundamentals']),
            'timestamp': raw_data['timestamp']

        }
    
    def _parse_news_item(self, item: Dict) -> Dict:
        return {
            'title': item.get('title'),
            'link': item.get('link'),
            'publisher': item.get('publisher'),
            'providerPublishTime': datetime.fromtimestamp(item.get('providerPublishTime')).isoformat() if item.get('providerPublishTime') else None,
            'summary': item.get('summary', '')
        }
    
    def _parse_fundamentals(self, info: Dict) -> Dict:
        return {
            'market_cap': info.get('marketCap'),
            'pe_ratio': info.get('trailingPE'),
            'dividend_yield': info.get('dividendYield'),
            'beta': info.get('beta'),
            'sector': info.get('sector'),
            'industry': info.get('industry')
        }
    
class AlphaVantageAgent(BaseIngestionAgent):
    """Agent to fetch data from Alpha Vantage API."""

    def __init__(self, source: DataSource):
        super().__init__(source)
        self.base_url = "https://www.alphavantage.co/query"

    async def fetch_data(self, symbols: List[str], days_back: int) -> Dict[str, Any]:
        async with aiohttp.ClientSession() as session:
            tasks = []
            for symbol in symbols:
                tasks.append(self._fetch_time_series(session, symbol, days_back))
                tasks.append(self._fetch_news_sentiment(session, symbol))
            results = await asyncio.gather(*tasks)
            
            data = []
            for i in range(0, len(results), 2):
                time_series_data = results[i]
                news_data = results[i+1]
                symbol = symbols[i//2]
                data.append({
                    'symbol': symbol,
                    'time_series': time_series_data,
                    'news_sentiment': news_data,
                    'timestamp': datetime.now().isoformat()
                })
            return data
        
    async def _fetch_time_series(self, session: aiohttp.ClientSession, symbol: str, days_back: int) -> Dict:
        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "apikey": self.source.API_key,
            "outputsize": "compact"
        }
        async with session.get(self.base_url, params=params) as response:
            data = await response.json()
            return data.get("Time Series (Daily)", {})
        
    
    async def _fetch_news_sentiment(self, session: aiohttp.ClientSession, symbol: str) -> Dict:
        params = {
            "function": "NEWS_SENTIMENT",
            "tickers": symbol,
            "apikey": self.source.API_key,
            'limit': 50
        }
        async with session.get(self.base_url, params=params) as response:
            return await response.json()
           

    def parse_response(self, raw_data: Dict, start_date: datetime) -> List[Dict]:
        """Standardize Alpha Vantage data into a consistent format."""
        
        return {
            'source': 'alpha_vantage',
            'symbol': raw_data['symbol'],
            'data_type': 'market_data_with_sentiment',
            'prices':self._parse_time_series(raw_data['time_series'], start_date),
            'news_sentiment': self._parse_news_sentiment(raw_data['news_sentiment']),
            'timestamp': raw_data['timestamp']
        }
    

    def _parse_time_series(self, data: Dict, start_date: datetime) -> List[Dict]:
        time_series = data.get('Time Series (Daily)', {})
        return [
            {
                'date': date,
                'open': float(data['1. open']),
                'high': float(data['2. high']),
                'low': float(data['3. low']),
                'close': float(data['4. close']),
                'volume': int(data['5. volume'])
            }
            for date, data in time_series.items()
        ]
    
    def _parse_news_sentiment(self, data: Dict) -> List[Dict]:
        return [
            {
                'title': item.get('title'),
                'url': item.get('url'),
                'time_published': item.get('time_published'),
                'source': item.get('source'),
                'summary': item.get('summary', ''),
                'sentiment_score': float(item.get('overall_sentiment_score', 0)),
                'sentiment_label': item.get('overall_sentiment_label', 'Neutral'),
                'ticker_sentiment': [
                    {
                        'ticker': ts['ticker'],
                        'relevance_score': float(ts['relevance_score']),
                        'sentiment_score': float(ts['ticker_sentiment_score']),
                        'sentiment_label': ts['ticker_sentiment_label']
                    }
                    for ts in item.get('ticker_sentiment', [])
                ]
            }
            for item in data.get('feed', [])
        ]
    

class TwitterAgent(BaseIngestionAgent):
    """Agent to fetch data from Twitter API."""

    def __init__(self, source: DataSource):
        super().__init__(source)
        from ntscraper import Nitter
        self.scraper = Nitter()
        

    async def fetch_data(self, symbols: List[str], days_back: int) -> Dict[str, Any]:
        data = []

        for symbol in symbols:
            search_query = f"${symbol} OR #{symbol} -filter:retweets"
    
    def parse_response(self, raw_data: Dict, start_date: datetime) -> List[Dict]:
        """Standardize Twitter data into a consistent format."""
        return {
            'source': 'twitter',
            'symbol': raw_data['symbol'],
            'data_type': 'social_media',
            'tweets': self._parse_tweets(raw_data['tweets']),
            'timestamp': raw_data['timestamp']
        }
    
    def _parse_tweets(self, tweets: List[Dict]) -> List[Dict]:
        return [
            {
                'text': tweet['text'],
                    'author': tweet['user']['username'],
                    'created_at': tweet['date'],
                    'likes': tweet.get('likes', 0),
                    'retweets': tweet.get('retweets', 0),
                    'replies': tweet.get('replies', 0),
                    'url': tweet.get('link', '')
            }
            for tweet in tweets
        ]


        
