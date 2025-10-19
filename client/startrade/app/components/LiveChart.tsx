"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StockChartProps {
  symbol: string;
}

export const candleStickOptions = {
  chart: {
    type: "candlestick",
  },
  title: {
    text: "CandleStick Chart",
    align: "left",
  },
  xaxis: {
    type: "datetime",
  },
  yaxis: {
    tooltip: {
      enabled: true,
    },
  },
};

export type ApexOHLC = { x: string | number | Date; y: [number, number, number, number] };

const fetchStockData = async (symbol: string) => {
  // Using Yahoo Finance API directly (no API key needed)
  const period1 = Math.floor(Date.now() / 1000) - (180 * 24 * 60 * 60); // 6 months ago
  const period2 = Math.floor(Date.now() / 1000); // now
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1wk`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.chart?.error) {
    throw new Error(data.chart.error.description || 'Yahoo Finance API error');
  }
  
  return data;
};

export const formatStockData = (stockData: any): ApexOHLC[] => {
  const formattedData: ApexOHLC[] = [];

  try {
    const result = stockData?.chart?.result?.[0];
    if (!result) return formattedData;

    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0];
    
    if (!quotes) return formattedData;

    const { open, high, low, close } = quotes;

    for (let i = 0; i < timestamps.length; i++) {
      const o = open?.[i];
      const h = high?.[i];
      const l = low?.[i];
      const c = close?.[i];
      
      // Skip if any value is null/undefined
      if ([o, h, l, c].every((n) => n != null && Number.isFinite(n))) {
        formattedData.push({
          x: timestamps[i] * 1000, // Convert to milliseconds
          y: [o, h, l, c]
        });
      }
    }
  } catch (error) {
    console.error('Error formatting stock data:', error);
  }

  return formattedData;
};

const LiveChart: React.FC<StockChartProps> = ({ symbol }) => {
  const [stockData, setStockData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    
    setLoading(true);
    setError(null);
    setStockData(null);
    
    fetchStockData(symbol)
      .then((data) => {
        if (!cancelled) {
          setStockData(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err?.message ?? String(err));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const seriesData = useMemo(() => formatStockData(stockData), [stockData]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading chart for {symbol}...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (!seriesData || seriesData.length === 0) {
    return <div className="text-sm text-neutral-400">No data for {symbol}</div>;
  }

  const series = [{ data: seriesData }];

  return (
    <ReactApexChart
      series={series as any}
      options={candleStickOptions as any}
      type="candlestick"
      height={350}
    />
  );
};

export default LiveChart;