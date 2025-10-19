import axios from 'axios';

// Determine API base URL robustly for Next.js (app router) and client runtime.
// Preference order:
// 1. NEXT_PUBLIC_API_URL (Next.js public env)
// 2. REACT_APP_API_URL (legacy / CRA env)
// 3. In-browser fallback: use current host with port 8000 (assumes backend on 8000)
// 4. Default to http://localhost:8000 for non-browser contexts (tests / node)
const API_BASE_URL = "https://shiny-system-r554xpwqj74hp5r4-8000.app.github.dev/";

export interface ChatMessage {
  message: string;
  portfolio?: string[];
  conversation_id?: string;
}

export interface StockAnalysis {
  symbol: string;
  composite_score: number;
  recommendation: {
    action: string;
    confidence: string;
  };
  sentiment_analysis: any;
  technical_analysis: any;
}

class TradingAPI {
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    // Allow opt-in of credentials (cookies/auth) via NEXT_PUBLIC_API_USE_CREDENTIALS=true
    withCredentials: false,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async chat(message: ChatMessage) {
    try {
      // Debug: log full URL the client will call (helps confirm host/port forwarding)
      try { console.debug('[tradingAPI] POST', `${this.client.defaults.baseURL}/api/chat`, 'withCredentials=', this.client.defaults.withCredentials); } catch (e) {}
      const response = await this.client.post('/api/chat', message);
      return response.data;
    } catch (err: any) {
      // Normalize axios/network errors so caller (UI) can show a friendly message
      if (err?.response) {
        // Server responded with non-2xx
        const status = err.response.status;
        const data = err.response.data;
        throw new Error(`Server error (${status}): ${JSON.stringify(data)}`);
      } else if (err?.request) {
        // Request made but no response (network / CORS / connection refused)
        throw new Error('Network error: could not reach backend. Is the server running on the configured API host?');
      }
      // Other errors
      throw new Error(err?.message || 'Unknown error while calling chat API');
    }
  }

  async analyzeStock(symbol: string): Promise<StockAnalysis> {
    const response = await this.client.post('/api/analyze/stock', { symbol });
    return response.data;
  }

  async analyzePortfolio(symbols: string[]) {
    const response = await this.client.post('/api/analyze/portfolio', { symbols });
    return response.data;
  }

  async getStockReport(symbol: string) {
    const response = await this.client.get(`/api/stock/${symbol}/report`);
    return response.data;
  }

  async getRecentNews(symbol: string, hours: number = 24) {
    const response = await this.client.get(`/api/news/${symbol}`, {
      params: { hours }
    });
    return response.data;
  }

  async screenStocks(symbols: string[], minScore: number = 65) {
    const response = await this.client.post('/api/screen', symbols, {
      params: { min_score: minScore }
    });
    return response.data;
  }


}

export const tradingAPI = new TradingAPI();
