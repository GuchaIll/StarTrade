'use client'
import React, { useState } from 'react'
import PoolEntry from './Pool/PoolEntry';
import StockChart from './StockChart'
import { useAlphaVantage, OHLCV } from '../hooks/useAlphaVantage'

interface IndicatorMap {
  [key: string]: string | number;
}

interface Props {
  symbol: string | null;
}

const SymbolTechnicalAnalysisPanel: React.FC<Props> = ({ symbol }) => {
  // Use Alpha Vantage to fetch OHLCV and compute lightweight indicators locally
  const { data: ohlcv, loading: avLoading, error: avError } = useAlphaVantage(symbol ?? '');
  const [indicators, setIndicators] = useState<IndicatorMap>({});

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

  const computeIndicators = (series: OHLCV[] | null) => {
    if (!series || series.length === 0) return {} as IndicatorMap;
    const closes = series.map(s => s.close);
    return {
      'SMA(20)': Number.isFinite(sma(closes, 20)) ? sma(closes, 20).toFixed(2) : 'n/a',
      'SMA(50)': Number.isFinite(sma(closes, 50)) ? sma(closes, 50).toFixed(2) : 'n/a',
      'EMA(20)': Number.isFinite(ema(closes, 20)) ? ema(closes, 20).toFixed(2) : 'n/a',
      'RSI(14)': Number.isFinite(rsi(closes, 14)) ? rsi(closes, 14).toFixed(2) : 'n/a',
      'Latest Close': closes[closes.length - 1].toFixed(2),
    } as IndicatorMap;
  }

  // Recompute when alpha vantage data arrives
  React.useEffect(() => {
    setIndicators(computeIndicators(ohlcv));
  }, [ohlcv]);

  return (
    <div className="flex flex-col w-full p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Technical Indicators</h1>
        <PoolEntry key={symbol || 'none'} id={symbol || 'none'} label={symbol || '—'} />
      </div>

      <div className="mt-4 w-full max-w-lg bg-white/5 p-3 rounded-lg shadow-sm overflow-auto max-h-[300px]">
        {(avLoading) ? (
          <div className="text-sm text-neutral-400">Loading indicators for {symbol} from Alpha Vantage...</div>
        ) : (avError) ? (
          <div className="text-sm text-red-400">Alpha Vantage error: {avError}</div>
        ) : (
          <>
            <h3 className="text-sm font-medium mb-2">Summary</h3>
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