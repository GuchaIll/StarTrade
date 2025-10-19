from prefect import flow, task
from prefect.task_runners import ConcurrentTaskRunner
from datetime import datetime, timedelta
import asyncio
from typing import Dict, List

from ResearchAgent.agents.data_ingestion_agent import AlphaVantageAgent, DataSource, TwitterAgent, YFinanceAgent
from ResearchAgent.agents.sentiment_agent import SentimentAnalysisAgent
from ResearchAgent.rag.vector_store import VectorStoreManager
from PortfolioManager.portfolio_manager import PortfolioManager
from LLMAgent.investment_advisor_agent import InvestmentAdvisorAgent

class TradingSystemOrchestrator:
    """Orchestrates all agents and data flows within the trading system"""

    def __init__(self, config: Dict):
        self.config = config
        # Create ingestion agents with explicit keyword args matching DataSource
        self.yfinance_agent = YFinanceAgent(DataSource(
            name="yfinance",
            url=None,
            API_key=None,
            rate_limit=60,
            priority=1
        ))

        self.alpha_vantage_agent = AlphaVantageAgent(
            DataSource(
                name="alpha_vantage",
                url=None,
                API_key=config.get('alpha_vantage_api_key'),
                rate_limit=5,
                priority=5
            )
        )

        self.twitter_agent = TwitterAgent(
            DataSource(
                name="twitter",
                url=None,
                API_key=config.get('twitter_api_key'),
                rate_limit=5,
                priority=5
            )
        )

        self.sentiment_agent = SentimentAnalysisAgent()
        self.vector_store = VectorStoreManager(
            api_key=config.get('pinecone_api_key')
        )

        # create portfolio manager before LLM agent so it can be passed in
        from PortfolioManager.portfolio_manager import PortfolioManager
        self.portfolio_manager = PortfolioManager(self.vector_store, self.sentiment_agent)

        # InvestmentAdvisorAgent expects (vector_store, portfolio_manager, groq_api_key)
        self.llm_agent = InvestmentAdvisorAgent(
            self.vector_store,
            self.portfolio_manager,
            groq_api_key=config.get('groq_api_key')
        )
        
@task(name="Fetch Market Data", retries = 3, retry_delay_seconds=60)
async def fetch_market_data(symbols: List[str], agents: List) -> list[Dict]:
    """Fetch market data from multiple agents"""
    print(f"[scheduler] fetch_market_data starting for {len(symbols)} symbols with {len(agents)} agents")
    all_data = []
    
    #fetch data concurrently from agents
    tasks = []
    for agent in agents:
        tasks.append(agent.fetch_data(symbols))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            print(f"[scheduler][error] fetch_market_data agent error: {result}")
            continue
        all_data.extend(result)

    return all_data

@task(name="Analyze Sentiment")
async def analyze_sentiment(data: List[Dict], sentiment_agent: SentimentAnalysisAgent) -> List[Dict]:
    """Analyze sentiment for all documents"""
    print(f"[scheduler] analyze_sentiment starting for {len(data)} items")
    enriched_data = []
    for item in data:
        if item['data_type'] in ['news', 'social_media']:
            # Extract text
            if 'news' in item:
                for news_item in item['news']:
                    text = f"{news_item['title']} {news_item['summary']}"
                    sentiment = sentiment_agent.analyze_financial_text(text)
                    
                    enriched_data.append({
                        'symbol': item['symbol'],
                        'source': item['source'],
                        'data_type': 'news',
                        'title': news_item['title'],
                        'content': news_item['summary'],
                        'url': news_item['url'],
                        'timestamp': news_item['published_at'],
                        'sentiment': sentiment['sentiment'],
                        'sentiment_score': sentiment['confidence']
                    })
            
            if 'tweets' in item:
                for tweet in item['tweets']:
                    sentiment = sentiment_agent.analyze_social_media(tweet['text'])
                    
                    enriched_data.append({
                        'symbol': item['symbol'],
                        'source': item['source'],
                        'data_type': 'social_media',
                        'title': f"Tweet by @{tweet['author']}",
                        'content': tweet['text'],
                        'url': tweet['url'],
                        'timestamp': tweet['created_at'],
                        'sentiment': sentiment['sentiment'],
                        'sentiment_score': sentiment['confidence']
                    })
    
    print(f"[scheduler] analyze_sentiment completed, {len(enriched_data)} items enriched")
    return enriched_data

@task(name="Store in Vector Database")
async def store_embeddings(data: List[Dict], vector_store: VectorStoreManager) -> Dict:
    """Store documents in vector database"""
    print(f"[scheduler] store_embeddings starting for {len(data)} documents")
    try:
        result = await vector_store.upsert_documents(data)
        print(f"[scheduler] store_embeddings completed, upserted={result.get('upserted', 'unknown')}")
        return result
    except Exception as e:
        print(f"[scheduler][error] store_embeddings failed: {e}")
        raise

@task(name="Analyze Portfolio")
async def analyze_portfolio(
    portfolio: List[str],
    portfolio_manager: PortfolioManager
) -> Dict:
    """Analyze existing portfolio"""
    print(f"[scheduler] analyze_portfolio for {len(portfolio)} positions")
    try:
        analysis = await portfolio_manager.monitor_existing_positions(portfolio)
        print(f"[scheduler] analyze_portfolio completed")
        return analysis
    except Exception as e:
        print(f"[scheduler][error] analyze_portfolio failed: {e}")
        raise

@task(name = "Screen new Stocks")
async def screen_new_stocks(
    candidate_symbols: List[str],
    portfolio_manager: PortfolioManager,
    min_score: float = 65) -> List [Dict]:
    """Screen new stocks for potential investment"""
    print(f"[scheduler] screen_new_stocks starting for {len(candidate_symbols)} candidates min_score={min_score}")
    recommendations = []

    for symbol in candidate_symbols:
        try:
            analysis = await portfolio_manager.analyze_stock_for_entry(symbol)  
            if analysis['composite_score'] >= min_score:
                recommendations.append(analysis)
        except Exception as e:
            print(f"[scheduler][error] Error analyzing {symbol}: {e}")

    #Sort by composite score
    recommendations.sort(key = lambda x: x['composite_score'], reverse = True)
    return recommendations

#Research Agents automatically updates periodically
def _make_concurrent_task_runner(max_concurrent_tasks: int = 10):
    """Try common constructor argument names across Prefect versions.

    Returns a ConcurrentTaskRunner instance. If none of the common
    kwarg names are supported, returns a default ConcurrentTaskRunner().
    """
    try:
        return ConcurrentTaskRunner(max_concurrent_tasks=max_concurrent_tasks)
    except TypeError:
        try:
            return ConcurrentTaskRunner(limit=max_concurrent_tasks)
        except TypeError:
            try:
                return ConcurrentTaskRunner(max_workers=max_concurrent_tasks)
            except TypeError:
                # Last resort: default
                return ConcurrentTaskRunner()


@flow(
    name="Trading System Daily Update",
    task_runner=_make_concurrent_task_runner(10),
    description="Daily data ingestion, analysis, and portfolio updates",
)
async def daily_trading_system_update(
    orchestrator: TradingSystemOrchestrator,
    watchlist: List[str],
    portfolio: List[str]
)-> Dict:
    """
    Update the trading system daily with new data, sentiment analysis, and portfolio review
    """
    print(f"Starting daily trading system update at {datetime.now().isoformat()}")

    agents = [
        orchestrator.yfinance_agent,
        orchestrator.alpha_vantage_agent,
        orchestrator.twitter_agent
    ]

    raw_data = await fetch_market_data(watchlist + portfolio, agents)
    print(f"Fetched market data for {len(raw_data)} dataitems")

    enriched_data = await analyze_sentiment(raw_data, orchestrator.sentiment_agent)
    print(f"Analyzed sentiment for {len(enriched_data)} documents")

    storage_result = await store_embeddings(enriched_data, orchestrator.vector_store )
    print(f"Stored {storage_result['upserted']} documents in vector DB")

    portfolio_analysis = await analyze_portfolio(portfolio, orchestrator.portfolio_manager)
    print(f"Portfolio health: {portfolio_analysis['portfolio_health']['health_rating']}")

    new_recommendations = await screen_new_stocks(
        watchlist,
        orchestrator.portfolio_manager,
        min_score=orchestrator.config.get('entry_score_threshold', 65)
    )
        
    print(f"Found {len(new_recommendations)} new stock recommendations")

    summary = {
        'date': datetime.now().isoformat(),
        'data_processed': {
            'raw_items': len(raw_data),
            'enriched_items': len(enriched_data),
            'stored_items': storage_result['upserted']
        },
        'portfolio_analysis': portfolio_analysis,
        'new_opportunities': new_recommendations[:10],  # Top 10
        'alerts': []
    }

    #Add alerts for critical portfolio issues
    if portfolio_analysis['portfolio_health']['health_rating']  == 'POOR':
        summary['alerts'].append({
            'type': 'PORTFOLIO_HEALTH',
            'severity': 'HIGH',
            'message': 'Portfolio health is POOR - review exit recommendations'
        })

    if len(portfolio_analysis['exit_recommendations']) > len(portfolio) * 0.3:
        summary['alerts'].append({
            'type': 'EXIT_RECOMMENDATIONS',
            'severity': 'MEDIUM',
            'message': f"{len(portfolio_analysis['exit_recommendations'])} positions recommended for exit"
        })

    print("Daily update completed successfully.")
    return summary

#Schedule flow from deployment
@flow(name = "Tradign System Scheduler")
def schedule_trading_system():
    """
    Schedule the trading system daily update flow
    """
    from prefect.deployments import Deployment
    from prefect.schemas.schedules import CronSchedule

    deployment = Deployment.build_from_flow(
        flow = daily_trading_system_update,
        name = "daily-trading-system-update",
        schedule=CronSchedule(cron="0 16 * * 1-5"),  # 4 PM ET on weekdays
        work_queue_name="trading-system"
    )

    deployment.apply()