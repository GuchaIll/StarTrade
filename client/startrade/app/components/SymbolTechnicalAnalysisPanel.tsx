'use client'
import React, { useState, useEffect } from 'react'
import PoolEntry from './Pool/PoolEntry';

interface IndicatorMap {
  [key: string]: string | number;
}

interface Props {
  symbol: string | null;
}

interface StockQuote {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

const SymbolTechnicalAnalysisPanel: React.FC<Props> = ({ symbol }) => {
  const [indicators, setIndicators] = useState<IndicatorMap>({});
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Small helper indicator calculations
  const sma = (series: number[], period: number) => {
    if (series.length < period) return NaN;
    const slice = series.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  const ema = (series: number[], period: number) => {
    if (series.length < period) return NaN;
    const k = 2 / (period + 1);
    let prev = series[series.length - period];
    for (let i = series.length - period + 1; i < series.length; i++) {
      prev = series[i] * k + prev * (1 - k);
    }
    return prev;
  }

  const rsi = (series: number[], period: number = 14) => {
    if (series.length <= period) return NaN;
    let gains = 0;
    let losses = 0;
    for (let i = series.length - period; i < series.length; i++) {
      const change = series[i] - series[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  const macd = (series: number[]) => {
    if (series.length < 26) return { macd: NaN, signal: NaN };
    const ema12 = ema(series, 12);
    const ema26 = ema(series, 26);
    const macdLine = ema12 - ema26;

    // For signal line, we'd need to calculate EMA of MACD line
    // Simplified version - just return MACD line
    return { macd: macdLine, signal: NaN };
  }

  const bollingerBands = (series: number[], period: number = 20) => {
    if (series.length < period) return { upper: NaN, middle: NaN, lower: NaN };
    const middle = sma(series, period);
    const slice = series.slice(-period);
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    return {
      upper: middle + (2 * stdDev),
      middle: middle,
      lower: middle - (2 * stdDev),
    };
  }

  useEffect(() => {
    if (!symbol) {
      setIndicators({});
      setQuote(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch historical data for indicators
        const histResponse = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}&period=1y&interval=1d`);

        if (!histResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const histData = await histResponse.json();

        if (histData.chart?.error) {
          throw new Error(histData.chart.error.description || 'API error');
        }

        const result = histData?.chart?.result?.[0];
        if (!result) throw new Error('No data available');

        const timestamps = result.timestamp || [];
        const quotes = result.indicators?.quote?.[0];

        if (!quotes) throw new Error('No quote data');

        const { open, high, low, close, volume } = quotes;
        const closes: number[] = [];

        for (let i = 0; i < timestamps.length; i++) {
          if (close[i] != null && Number.isFinite(close[i])) {
            closes.push(close[i]);
          }
        }

        if (closes.length === 0) throw new Error('No valid data');

        // Calculate indicators
        const bb = bollingerBands(closes, 20);
        const macdVal = macd(closes);

        const computed: IndicatorMap = {
          'Latest Close': closes[closes.length - 1].toFixed(2),
          'SMA(20)': Number.isFinite(sma(closes, 20)) ? sma(closes, 20).toFixed(2) : 'n/a',
          'SMA(50)': Number.isFinite(sma(closes, 50)) ? sma(closes, 50).toFixed(2) : 'n/a',
          'EMA(12)': Number.isFinite(ema(closes, 12)) ? ema(closes, 12).toFixed(2) : 'n/a',
          'EMA(26)': Number.isFinite(ema(closes, 26)) ? ema(closes, 26).toFixed(2) : 'n/a',
          'RSI(14)': Number.isFinite(rsi(closes, 14)) ? rsi(closes, 14).toFixed(2) : 'n/a',
          'BB Upper': Number.isFinite(bb.upper) ? bb.upper.toFixed(2) : 'n/a',
          'BB Middle': Number.isFinite(bb.middle) ? bb.middle.toFixed(2) : 'n/a',
          'BB Lower': Number.isFinite(bb.lower) ? bb.lower.toFixed(2) : 'n/a',
          'MACD': Number.isFinite(macdVal.macd) ? macdVal.macd.toFixed(2) : 'n/a',
        };

        // Calculate price change
        const latestClose = closes[closes.length - 1];
        const prevClose = closes[closes.length - 2];
        const change = latestClose - prevClose;
        const changePercent = (change / prevClose) * 100;

        const quoteData: StockQuote = {
          price: latestClose,
          change: change,
          changePercent: changePercent,
          volume: volume[volume.length - 1] || 0,
        };

        if (!cancelled) {
          setIndicators(computed);
          setQuote(quoteData);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? 'Failed to load data');
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return (
      <div className="flex flex-col w-full p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Technical Indicators</h1>
          <PoolEntry key={symbol || 'none'} id={symbol || 'none'} label={symbol || '—'} />
        </div>

        {/* Price Display */}
        {quote && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">${quote.price.toFixed(2)}</span>
                <span className={`text-lg font-semibold ${quote.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {quote.change >= 0 ? '+' : ''}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </span>
              </div>
              <div className="text-sm text-neutral-400 mt-2">
                Volume: {quote.volume.toLocaleString()}
              </div>
            </div>
        )}

        <div className="w-full bg-white/5 p-3 rounded-lg shadow-sm overflow-auto max-h-[400px]">
          {loading ? (
              <div className="text-sm text-neutral-400">Loading indicators for {symbol}...</div>
          ) : error ? (
              <div className="text-sm text-red-400">Error: {error}</div>
          ) : (
              <>
                <h3 className="text-sm font-medium mb-2">Technical Summary</h3>
                <ul className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(indicators).length === 0 ? (
                      <li className="col-span-2 text-sm text-neutral-500">No indicators available. Select a symbol to load data.</li>
                  ) : (
                      Object.entries(indicators).map(([label, value], idx) => (
                          <li
                              key={`${label}-${idx}`}
                              className="flex items-center justify-between py-1 border-b border-neutral-800 last:border-b-0"
                          >
                            <span className="text-sm text-neutral-300">{label}</span>
                            <span className="font-semibold">{String(value)}</span>
                          </li>
                      ))
                  )}
                </ul>
              </>
          )}
        </div>
      </div>
  )
}

export default SymbolTechnicalAnalysisPanel