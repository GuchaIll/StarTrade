"use client";
import React from 'react'
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import StockDropDownSelection from '../StockDropDownSelection';

interface PoolProps {
  id: string;
  name: string;
  children?: React.ReactNode;
  maxHeight?: number;
}

export default function Pool({ id, name, children, maxHeight }: PoolProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

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
    
    <section
      ref={setNodeRef}
      className={`pool relative p-4 rounded-2xl h-[40vh] min-h-[120px] max-h-[240px] overflow-y-auto pb-16 transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.02]' : ''
      }`}
    >
      <div className="flex flex-col">
        <h2 className="pool-title mb-2 text-md sticky top-0 bg-inherit pb-2 z-10">{name}</h2>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-min">
          {/* Render selected stocks first as pool tiles (non-draggable entries created via dropdown) */}
          {selectedStocks.map((ticker) => (
            <div key={`selected-${ticker}`} className="min-w-0 w-full">
              <div className="bg-white/5 px-3 py-2 rounded-md flex items-center justify-between">
                <span className="text-sm font-medium truncate">{ticker}</span>
                <button
                  className="ml-2 text-sm text-red-400 hover:text-red-300"
                  onClick={() => removeStock(ticker)}
                  aria-label={`Remove ${ticker}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Render children (should be PoolEntry components) directly so they control styling
              Avoid wrapping children in an extra tile to prevent double-wrapping and broken drag visuals */}
          {React.Children.map(children, (child, i) => (
            <div key={`child-${i}`} className="min-w-0 w-full">
              {child}
            </div>
          ))}
        </div>

        {/* Button placed at the bottom center of the pool. Kept inside the pool so it visually sits in the container,
            but the dropdown itself is rendered into document.body (portal) so it can overlay other elements. */}
        <div className="absolute left-1/2 bottom-4 transform -translate-x-1/2 z-20">
          <StockDropDownSelection onStockSelect={handleStockSelect} />
        </div>
      </div>
    </section>
  );
}