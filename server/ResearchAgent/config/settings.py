from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    ALPHA_VANTAGE_API_KEY: str
    PINECONE_API_KEY: str
    LLAMA_API_KEY: str
    TWITTER_API_KEY: str

    # Database
    PINECONE_INDEX_NAME: str = "stock-intelligence"
    PINECONE_ENVIRONMENT: str = "us-east-1"
    
    # Redis (for caching)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Trading Parameters
    DEFAULT_WATCHLIST: List[str] = ["AAPL", "GOOGL", "MSFT", "TSLA", "NVDA"]
    MIN_COMPOSITE_SCORE: float = 65.0
    MAX_PORTFOLIO_SIZE: int = 20
    
    # Rate Limits
    YFINANCE_RATE_LIMIT: int = 2000  # requests per hour
    ALPHA_VANTAGE_RATE_LIMIT: int = 5  # requests per minute
    TWITTER_RATE_LIMIT: int = 15  # requests per 15 minutes
    
    # Scheduling
    UPDATE_SCHEDULE_CRON: str = "0 16 * * 1-5"  # 4 PM ET weekdays
    SENTIMENT_UPDATE_HOURS: int = 6  # Update sentiment every 6 hours
    
    # Model Paths
    ML_MODEL_PATH: str = "./models/trading_model.pth"
    FINBERT_MODEL_PATH: str = "ProsusAI/finbert"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "./logs/trading_system.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Load settings
settings = Settings()


