from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.concurrency import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import asyncio
import os
from dotenv import load_dotenv
from models.models import ChatRequest, ChatResponse, StockAnalysisRequest, PortfolioRequest
from scheduler import TradingSystemOrchestrator, screen_new_stocks

load_dotenv()

#Initialize global orchestrator (singleton)
orchestrator = None

# Define a lifespan context manager and call start up events
@asynccontextmanager
async def startup_event(app):
    """Lifespan context manager invoked by FastAPI with the app instance.

    FastAPI will call this with one positional argument (the app), so the
    function must accept it. We ignore `app` here but keep it for
    compatibility.
    """
    global orchestrator
    config = {
        'alpha_vantage_api_key': os.getenv('ALPHA_VANTAGE_API_KEY'),
        'pinecone_api_key': os.getenv('PINECONE_API_KEY'),
        'llama_api_key': os.getenv('LLAMA_API_KEY'),
    }

    orchestrator = TradingSystemOrchestrator(config)
    yield
    # clean up events


app = FastAPI(title = "Trading API Server", lifespan=startup_event)

# Use a regex to allow developer forwarded hosts (e.g. *.app.github.dev) and localhost.
# Using allow_origins=["*"] together with allow_credentials=True can result in the
# middleware echoing the origin in some environments; an explicit regex avoids that
# and keeps the Access-Control-Allow-Origin header well-formed.
# Allow configuring the frontend origin explicitly via env var for deterministic dev setups.
frontend_origin = os.getenv("FRONTEND_ORIGIN")
if frontend_origin:
    print(f"[startup] Using FRONTEND_ORIGIN from env: {frontend_origin}")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[frontend_origin],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[frontend_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Debug middleware to log incoming Origin headers and request info to help diagnose CORS issues.
@app.middleware("http")
async def log_origin_middleware(request, call_next):
    try:
        origin = request.headers.get("origin")
        print(f"[cors-debug] Incoming request: {request.method} {request.url.path} Origin={origin}")
    except Exception:
        print("[cors-debug] Incoming request (failed to read origin)")
    response = await call_next(request)
    # Also log what the response includes for CORS header (if any)
    try:
        aca_origin = response.headers.get("access-control-allow-origin")
        if aca_origin:
            print(f"[cors-debug] Response ACAO={aca_origin}")
    except Exception:
        pass
    return response


#Endpoints
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Interactive chat endpoint with LLM agent."""
    print(f"[api] /api/chat received. conversation_id={request.conversation_id}")
    try:
        response = await orchestrator.llm_agent.chat(
            user_message=request.message,
            user_portfolio=request.portfolio,
            conversation_id=request.conversation_id
        )
        print(f"[api] /api/chat responded. conversation_id={request.conversation_id}")
        return response
    except Exception as e:
        print(f"[api][error] /api/chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze/stock")
async def analyze_stock(request: StockAnalysisRequest):
    """Get comprehensive stock analysis"""
    print(f"[api] /api/analyze/stock for {request.symbol}")
    try:
        analysis = await orchestrator.portfolio_manager.analyze_stock_for_entry(
            symbol=request.symbol
        )
        print(f"[api] /api/analyze/stock completed for {request.symbol}")
        return analysis
    except Exception as e:
        print(f"[api][error] /api/analyze/stock {request.symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"failed to generate comprehensive stock analysis: {e}")


@app.post("/api/analyze/portfolio")
async def analyze_portfolio(request: PortfolioRequest):
    """Analyze existing portfolio"""
    print(f"[api] /api/analyze/portfolio for {len(request.symbols)} symbols")
    try:
        analysis = await orchestrator.portfolio_manager.monitor_existing_positions(
            request.symbols
        )
        print(f"[api] /api/analyze/portfolio completed")
        return analysis
    except Exception as e:
        print(f"[api][error] /api/analyze/portfolio: {e}")
        raise HTTPException(status_code=500, detail=f"failed to generate comprehensive portfolio overview: {e}")

@app.get("/api/stocks/{symbol}/report")
async def get_stock_report(symbol: str):
    """Generate comprehensive stock report"""
    print(f"[api] /api/stocks/{symbol}/report requested")
    try:
        analysis = await orchestrator.portfolio_manager.analyze_stock_for_entry(symbol)
        print(f"[api] /api/stocks/{symbol}/report completed")
        return analysis
    except Exception as e:
        print(f"[api][error] /api/stocks/{symbol}/report: {e}")
        raise HTTPException(status_code=500, detail=f"failed to get report for {symbol}: {e}")

@app.get("/api/news/{symbol}")
async def get_recent_news(symbol: str, hours: int = 24):
    """Get recent news for symbol"""
    print(f"[api] /api/news/{symbol} fetching (hours={hours})")
    try:
        news = orchestrator.vector_store.get_recent_documents(
            symbol=symbol,
            hours=hours,
            data_types=['news', 'social_media']
        )
        print(f"[api] /api/news/{symbol} returned {len(news)} items")
        return {'symbol': symbol, 'news': news}
    except Exception as e:
        print(f"[api][error] /api/news/{symbol}: {e}")
        raise HTTPException(status_code=500, detail=f"failed to get recent news for {symbol}: {e}")
    
@app.post("/api/screen")
async def screen_stocks(symbols: List[str], min_score: float = 65):
    """Screen stocks based for entry"""
    print(f"[api] /api/screen screening {len(symbols)} symbols min_score={min_score}")
    try: 
        recommendations = await screen_new_stocks(
            symbols=symbols,
            portfolio_manager=orchestrator.portfolio_manager,
            min_score=min_score
        )
        print(f"[api] /api/screen found {len(recommendations)} recommendations")
        return {'recommendations': recommendations}
    except Exception as e:
        print(f"[api][error] /api/screen: {e}")
        raise HTTPException(status_code=500, detail=f"failed to screen stocks: {e}")
    
##Web socket for real-time updates
@app.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    """Websocket endpoint for real-time updates."""
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_json()
            portfolio = data.get("portfolio", [])  
            print(f"[api] /ws/updates - subscribe portfolio len={len(portfolio)}")

            # Send updates every 60 seconds
            while True:
                try:
                    analysis = await orchestrator.portfolio_manager.monitor_existing_positions(portfolio)
                    await websocket.send_json(analysis)
                    print(f"[api] /ws/updates - sent update for portfolio len={len(portfolio)}")
                except Exception as e:
                    print(f"[api][error] /ws/updates - error sending update: {e}")
                await asyncio.sleep(60)

    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    # When running `python app.py` this will start the Uvicorn server and
    # keep the process running. The FastAPI `lifespan` context manager
    # (`startup_event`) will be executed on startup to initialize the
    # global `orchestrator`.
    uvicorn.run(app, host="0.0.0.0", port=8000)