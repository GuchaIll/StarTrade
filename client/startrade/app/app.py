from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import os
from dotenv import load_dotenv
from models.models import ChatRequest, ChatResponse, StockAnalysisRequest, PortfolioRequest
from server.scheduler import TradingSystemOrchestrator, screen_new_stocks

load_dotenv()

app = FastAPI(title = "Trading API Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Initialize global orchestrator (singleton)
orchestrator = None

# Define a lifespan context manager and call start up events
@asynccontextmanager
async def startup_event():
    global orchestrator
    config = {
        'alpha_vantage_api_key': os.getenv('ALPHA_VANTAGE_API_KEY'),
        'pinecone_api_key': os.getenv('PINECONE_API_KEY'),
        'llama_api_key': os.getenv('LLAMA_API_KEY'),
    }

    orchestrator = TradingSystemOrchestrator(config)
    yield
    #clean up events

#Endpoints
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Interactive chat endpoint with LLM agent."""

    try: 
        response = await orchestrator.llm_agent.chat(
            user_message=request.message,
            user_portfolio=request.portfolio,
            conversation_id=request.conversation_id
        )

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/stock")
async def analyze_stock(request: StockAnalysisRequest):
    """Get comprehensive stock analysis"""
    try:
        analysis = await orchestrator.portfolio_manager.analyze_stock_for_entry(
            symbol=request.symbol
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e, "failed to generate comprehensive stock analysis"))


@app.post("/api/analyze/portfolio")
async def analyze_portfolio(request: PortfolioRequest):
    """Analyze existing portfolio"""
    try:
        analysis = await orchestrator.portfolio_manager.monitor_existing_positions(
            request.symbols
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e, "failed to generate comprehensive portfolio overview"))

@app.get("/api/stocks/{symbol}/report")
async def get_stock_report(symbol: str):
    """Generate comprehensive stock report"""
    try:
        analysis = await orchestrator.portfolio_manager.analyze_stock_for_entry(symbol)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e, f"failed to get report for {symbol}"))

@app.get("/api/news/{symbol}")
async def get_recent_news(symbol: str, hours: int = 24):
    """Get recent news for symbol"""
    try:
        news = orchestrator.vector_store.get_recent_documents(
            symbol=symbol,
            hours=hours,
            data_types=['news', 'social_media']
        )

        return {'symbol': symbol, 'news': news}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e, f"failed to get recent news for {symbol}"))
    
@app.post("/api/screen")
async def screen_stocks(symbols: List[str], min_score: float = 65):
    """Screen stocks based for entry"""
    try: 
        recommendations = await screen_new_stocks(
            symbols=symbols,
            portfolio_manager=orchestrator.portfolio_manager,
            min_score=min_score
        )
        return {'recommendations': recommendations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e, "failed to screen stocks"))
    
##Web socket for real-time updates
@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    """Websocket endpoint for real-time updates."""
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            portfolio = data.get("portfolio", [])   

            # Send updates every 60 seconds
            while True:
                analysis = await orchestrator.portfolio_manager.monitor_existing_positions(
                    portfolio)
                await websocket.send_json(analysis)
                await asyncio.sleep(60)

    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__app__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)