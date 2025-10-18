'use client';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';
import StockDropDownSelection from '../StockDropDownSelection';

interface PoolProps {
  id: string;
  name: string;
  children?: React.ReactNode;
}

export default function Pool({ id, name, children }: PoolProps) {
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
      className={`pool relative p-4 rounded-2xl h-[50vh] min-h-[220px] overflow-y-auto pb-16 transition-all duration-200 ${
        isOver ? 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.02]' : ''
      }`}
    >
      <div className="flex flex-col">
        <h2 className="pool-title mb-4 text-lg sticky top-0 bg-inherit pb-2 z-10">{name}</h2>
        <div className="pool-grid">
          {children}
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