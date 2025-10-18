'use client'
import React, { useState } from 'react'
import PoolEntry from './Pool/PoolEntry';
import StockChart from './StockChart'



const SymbolTechnicalAnalysisPanel = () => {

    const [selectedStocks, setSelectedStocks] = useState<string>("");

  // Indicators stored in a Map so they can be updated programmatically later
  const indicators = new Map<string, string | number>([
    ['Last Price', '$173.60'],
    ['SMA (5)', '$175.19'],
    ['EMA (12)', '$177.92'],
    ['RSI (14)', 40.8],
    ['MACD (12,26,9)', 'N/A'],
  ]);



  return (
   
  <div className = "flex flex-col w-full p-4">
        <div className = "flex items-center justify-between">
            <h1 className = "text-2xl font-bold">Technical Indicators</h1>
            <PoolEntry key={selectedStocks} id={selectedStocks} label={selectedStocks} />
        </div>

       
        <div className="mt-4 w-full max-w-lg bg-white/5 p-3 rounded-lg shadow-sm">
          <ul className="flex flex-col gap-2 text-sm">
            {Array.from(indicators.entries()).map(([label, value], idx) => (
              <li
                key={`${label}-${idx}`}
                className="flex items-center justify-between py-1 border-b border-neutral-800 last:border-b-0"
              >
                <span className="text-sm text-neutral-300">{label}</span>
                <span className="font-semibold">{String(value)}</span>
              </li>
            ))}
          </ul>
        </div>
      
        
    </div>
  )
}

export default SymbolTechnicalAnalysisPanel
