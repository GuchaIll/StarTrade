"use client"
import React from 'react'

import type { OHLCV } from '../hooks/useAlphaVantage'

interface StockChartProps {
  symbol: string
  lastPrice: string | number
  data?: number[] // sparkline data (legacy)
  ohlcv?: OHLCV[] // normalized OHLCV data
  indicators?: Map<string, string | number>
}

// Small utility to turn numeric data into an SVG path for a sparkline
function sparklinePath(data: number[], width = 300, height = 80) {
  if (!data || data.length === 0) return ''
  const max = Math.max(...data)
  const min = Math.min(...data)
  const len = data.length
  const step = width / Math.max(1, len - 1)
  const scaleY = (v: number) => {
    if (max === min) return height / 2
    return height - ((v - min) / (max - min)) * height
  }
  return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${scaleY(d)}`).join(' ')
}

const StockChart: React.FC<StockChartProps> = ({ symbol, lastPrice, data = [], ohlcv, indicators }) => {
  // prefer OHLCV close prices when available
  const values = (ohlcv && ohlcv.length > 0) ? ohlcv.map(d => d.close) : data
  const path = sparklinePath(values)

  return (
    <div className="p-4 bg-white/5 rounded-lg shadow-sm w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">{symbol}</h3>
          <div className="text-sm text-neutral-300">Last Price: <span className="font-medium">{String(lastPrice)}</span></div>
        </div>
        <div className="text-right text-sm text-neutral-400">Sparkline</div>
      </div>

      <div className="w-full overflow-hidden">
        <svg width="100%" height={80} viewBox={`0 0 300 80`} preserveAspectRatio="none" className="block">
          <path d={path} fill="none" stroke="#60A5FA" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {indicators && (
        <div className="mt-3">
          <ul className="flex flex-col gap-2 text-sm">
            {Array.from(indicators.entries()).map(([label, value], i) => (
              <li key={`${label}-${i}`} className="flex items-center justify-between">
                <span className="text-neutral-300">{label}</span>
                <span className="font-semibold">{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default StockChart
