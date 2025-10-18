'use client'
import Image from "next/image";
import StockDropDownSelection from "./components/StockDropDownSelection";
import { useState } from "react";

export default function Home() {
  const [selectedStocks, setSelectedStocks] = useState<string[]>([]);

  const handleStockSelect = (ticker: string) => {
    if (!selectedStocks.includes(ticker)) {
      setSelectedStocks(prev => [...prev, ticker]);
    }
  };

  const removeStock = (ticker: string) => {
    setSelectedStocks(prev => prev.filter(stock => stock !== ticker));
  };

  return (
    <div className="space-y-6">
      <div className="card p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-4">Quant Trading Bot</h1>
        <p className="text-lg mb-4">Welcome to the Artemis Quant Trading Bot application.</p>
        <p className="mb-4">
          This application supports both light and dark themes. Use the theme toggle in the top-right corner to switch between themes.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Trading Features</h2>
          <ul className="space-y-2">
            <li>• Real-time market analysis</li>
            <li>• Automated trading strategies</li>
            <li>• Portfolio management</li>
            <li>• Risk assessment</li>
          </ul>
        </div>
        
        <div className="card p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">AI-Powered Insights</h2>
          <ul className="space-y-2">
            <li>• Machine learning predictions</li>
            <li>• Market sentiment analysis</li>
            <li>• News impact assessment</li>
            <li>• Adaptive strategies</li>
          </ul>
        </div>
      </div>

      <div className="card p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Stock Inventory</h2>
        <div className="flex items-center gap-4 mb-4">
          <span className="text-sm text-muted-foreground">Add stocks to your inventory:</span>
          <StockDropDownSelection onStockSelect={handleStockSelect} />
        </div>
        
        {selectedStocks.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-medium mb-2">Selected Stocks:</h3>
            <div className="flex flex-wrap gap-2">
              {selectedStocks.map((ticker) => (
                <div
                  key={ticker}
                  className="flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                >
                  <span className="font-mono font-medium">{ticker}</span>
                  <button
                    onClick={() => removeStock(ticker)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={`Remove ${ticker}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Theme Demo</h2>
        <div className="flex gap-4 mb-4">
          <button className="btn-primary px-4 py-2 rounded">Primary Button</button>
          <button className="btn-secondary px-4 py-2 rounded">Secondary Button</button>
        </div>
        <input 
          type="text" 
          placeholder="Type something here..." 
          className="input w-full p-3 rounded border"
        />
      </div>
    </div>
  );
}
