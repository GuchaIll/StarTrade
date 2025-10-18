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

// Small utility to turn numeric data into an SVG path for a sparkline
function sparklinePath(data: number[], width = 300, height = 80) {
  if (!data || data.length === 0) return "";
  const max = Math.max(...data);
  const min = Math.min(...data);
  const len = data.length;
  const step = width / Math.max(1, len - 1);
  const scaleY = (v: number) => {
    if (max === min) return height / 2;
    return height - ((v - min) / (max - min)) * height;
  };
  return data.map((d, i) => `${i === 0 ? "M" : "L"} ${i * step} ${scaleY(d)}`).join(" ");
}

const fetchStockData = async (symbol: string) => {
  const key = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY ?? process.env.ALPHA_VANTAGE_KEY;
  if (!key) throw new Error("Alpha Vantage API key is not set in environment (NEXT_PUBLIC_ALPHA_VANTAGE_KEY)");
  const response = await fetch(
    `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY_ADJUSTED&symbol=${encodeURIComponent(
      symbol
    )}&apikey=${key}`
  );
  const data = await response.json();
  return data;
};

export type ApexOHLC = { x: string | number | Date; y: [number, number, number, number] };

export const formatStockData = (stockData: any): ApexOHLC[] => {
  const formattedData: ApexOHLC[] = [];

  const series = stockData?.["Weekly Adjusted Time Series"];
  if (series && typeof series === "object") {
    Object.entries(series).forEach(([key, value]) => {
      const v: any = value;
      const open = parseFloat(v["1. open"]);
      const high = parseFloat(v["2. high"]);
      const low = parseFloat(v["3. low"]);
      const close = parseFloat(v["4. close"]);
      if ([open, high, low, close].every((n) => Number.isFinite(n))) {
        formattedData.push({ x: key, y: [open, high, low, close] });
      }
    });
  }

  // sort ascending by date
  formattedData.sort((a, b) => new Date(a.x as string).getTime() - new Date(b.x as string).getTime());
  return formattedData;
};

const LiveChart: React.FC<StockChartProps> = ({ symbol }) => {
  const [stockData, setStockData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    fetchStockData(symbol)
      .then((data) => {
        if (!cancelled) setStockData(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? String(err));
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const seriesData = useMemo(() => formatStockData(stockData), [stockData]);

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  if (!seriesData || seriesData.length === 0) {
    return <div className="text-sm text-neutral-400">No data for {symbol}</div>;
  }

  // react-apexcharts expects series: [{ data: ApexOHLC[] }]
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