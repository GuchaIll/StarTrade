"use client"
import React, { useState, useEffect } from 'react'
import VerticalPool from "../../components/Pool/VerticalPool";
import dynamic from "next/dynamic";

const LiveChart = dynamic(() => import("../../components/LiveChart"), { ssr: false });

// Storage key for localStorage
const STORAGE_KEY = 'portfolio_data';

interface Entry {
    id: string;
    label: string;
    symbol?: string;
}

interface PoolData {
    id: string;
    name: string;
    entries: Entry[];
}

const AnalysisGraphPage = () => {
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>('AAPL');
    const [portfolioData, setPortfolioData] = useState<PoolData[] | null>(null);

    // Load portfolio from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setPortfolioData(parsed);
            }
        } catch (error) {
            console.error('Error loading portfolio from storage:', error);
        }
    }, []);

    // Save portfolio to localStorage whenever it changes
    useEffect(() => {
        if (portfolioData) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolioData));
            } catch (error) {
                console.error('Error saving portfolio to storage:', error);
            }
        }
    }, [portfolioData]);

    const handleSymbolSelect = (symbol: string | null) => {
        setSelectedSymbol(symbol);
    };

    const handlePortfolioChange = (pools: PoolData[]) => {
        setPortfolioData(pools);
    };

    return (
        <div className="flex p-4 h-full">
            <div className="w-1/3 mr-4">
                <VerticalPool
                    onSymbolSelect={handleSymbolSelect}
                    onPortfolioChange={handlePortfolioChange}
                    initialData={portfolioData}
                />
            </div>
            <div className="w-2/3 flex flex-col gap-2 h-full">
                {selectedSymbol ? (
                    <>
                        <div className="text-lg font-semibold mb-2">
                            {selectedSymbol}
                        </div>
                        <LiveChart symbol={selectedSymbol} />
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-neutral-400">
                        Select a symbol from the portfolio to view chart
                    </div>
                )}
            </div>
        </div>
    )
}

export default AnalysisGraphPage