from pydantic import BaseModel
from typing import List, Dict, Optional

class ChatRequest(BaseModel):
    message: str
    portfolio: Optional[List[str]] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    citations: List[Dict]
    conversation_id: str
    timestamp: str

class StockAnalysisRequest(BaseModel):
    symbol:str

class PortfolioRequest(BaseModel):
    symbols: List[str]


