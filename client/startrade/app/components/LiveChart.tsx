"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface StockChartProps {
  symbol: string;
}

export type ApexOHLC = { x: string | number | Date; y: [number, number, number, number] };

// Technical Indicator Calculations
const calculateSMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

const calculateEMA = (data: number[], period: number): (number | null)[] => {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  // Start with SMA for first value
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  return result;
};

const calculateBollingerBands = (data: number[], period: number, stdDev: number) => {
  const sma = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i]!;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { middle: sma, upper, lower };
};

const calculateRSI = (data: number[], period: number = 14): (number | null)[] => {
  const result: (number | null)[] = [];
  const changes: number[] = [];

  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      const slice = changes.slice(i - period, i);
      const gains = slice.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
      const losses = Math.abs(slice.filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;

      if (losses === 0) {
        result.push(100);
      } else {
        const rs = gains / losses;
        result.push(100 - (100 / (1 + rs)));
      }
    }
  }

  return result;
};

const calculateMACD = (data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const macdLine: (number | null)[] = fastEMA.map((fast, i) =>
      fast !== null && slowEMA[i] !== null ? fast - slowEMA[i]! : null
  );

  const validMacd = macdLine.filter(v => v !== null) as number[];
  const signalEMA = calculateEMA(validMacd, signalPeriod);

  // Align signal line with macd line
  const signalLine: (number | null)[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      signalLine.push(signalEMA[signalIndex] || null);
      signalIndex++;
    }
  }

  const histogram: (number | null)[] = macdLine.map((macd, i) =>
      macd !== null && signalLine[i] !== null ? macd - signalLine[i]! : null
  );

  return { macdLine, signalLine, histogram };
};

const fetchStockData = async (symbol: string) => {
  const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}&period=6mo&interval=1d`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to fetch data' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
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

      if ([o, h, l, c].every((n) => n != null && Number.isFinite(n))) {
        formattedData.push({
          x: timestamps[i] * 1000,
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
  const [indicators, setIndicators] = useState({
    sma20: true,
    sma50: false,
    ema12: false,
    bb: false,
    oscillator: 'rsi' as 'rsi' | 'macd' | null
  });

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

  const chartData = useMemo(() => {
    if (!stockData) return null;

    const candleData = formatStockData(stockData);
    const closePrices = candleData.map(d => d.y[3]);
    const timestamps = candleData.map(d => d.x);

    const series: any[] = [{ name: 'Price', type: 'candlestick', data: candleData }];

    if (indicators.sma20) {
      const sma20 = calculateSMA(closePrices, 20);
      series.push({
        name: 'SMA 20',
        type: 'line',
        data: timestamps.map((x, i) => ({ x, y: sma20[i] }))
      });
    }

    if (indicators.sma50) {
      const sma50 = calculateSMA(closePrices, 50);
      series.push({
        name: 'SMA 50',
        type: 'line',
        data: timestamps.map((x, i) => ({ x, y: sma50[i] }))
      });
    }

    if (indicators.ema12) {
      const ema12 = calculateEMA(closePrices, 12);
      series.push({
        name: 'EMA 12',
        type: 'line',
        data: timestamps.map((x, i) => ({ x, y: ema12[i] }))
      });
    }

    if (indicators.bb) {
      const bb = calculateBollingerBands(closePrices, 20, 2);
      series.push(
          {
            name: 'BB Upper',
            type: 'line',
            data: timestamps.map((x, i) => ({ x, y: bb.upper[i] }))
          },
          {
            name: 'BB Middle',
            type: 'line',
            data: timestamps.map((x, i) => ({ x, y: bb.middle[i] }))
          },
          {
            name: 'BB Lower',
            type: 'line',
            data: timestamps.map((x, i) => ({ x, y: bb.lower[i] }))
          }
      );
    }

    // RSI and MACD data for separate charts
    const rsiData = indicators.oscillator === 'rsi' ? calculateRSI(closePrices) : null;
    const macdData = indicators.oscillator === 'macd' ? calculateMACD(closePrices) : null;

    return { series, timestamps, rsiData, macdData };
  }, [stockData, indicators]);

  if (loading) {
    return <div className="text-sm text-neutral-400">Loading chart for {symbol}...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (!chartData || chartData.series[0].data.length === 0) {
    return <div className="text-sm text-neutral-400">No data for {symbol}</div>;
  }

  const mainChartOptions = {
    chart: {
      type: 'candlestick',
      height: 350,
      toolbar: { show: true },
      zoom: {
        enabled: true,
        type: 'x' as const,
        autoScaleYaxis: true
      },
      animations: {
        enabled: false
      }
    },
    title: {
      text: `${symbol} - Technical Analysis`,
      align: 'left' as const,
      style: {
        color: '#ffffff'
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        style: {
          colors: '#ffffff'
        }
      }
    },
    yaxis: {
      tooltip: { enabled: true },
      labels: {
        style: {
          colors: '#ffffff'
        },
        formatter: (val: number) => val?.toFixed(2) || ''
      }
    },
    stroke: {
      width: [1, 2, 2, 2, 2, 2, 2]
    },
    legend: {
      show: true,
      position: 'top' as const,
      labels: {
        colors: '#ffffff'
      }
    }
  };

  const rsiOptions = {
    chart: {
      type: 'line',
      height: 150,
      toolbar: { show: false },
      zoom: {
        enabled: true,
        type: 'x' as const,
        autoScaleYaxis: true
      },
      animations: {
        enabled: false
      }
    },
    title: {
      text: 'RSI (14)',
      align: 'left' as const,
      style: {
        fontSize: '14px',
        color: '#ffffff'
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        show: false
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 2,
      labels: {
        style: {
          colors: '#ffffff'
        },
        formatter: (val: number) => val?.toFixed(0) || ''
      }
    },
    stroke: {
      width: 2
    },
    colors: ['#9C27B0'],
    annotations: {
      yaxis: [
        { y: 70, borderColor: '#f87171', strokeDashArray: 4 },
        { y: 30, borderColor: '#4ade80', strokeDashArray: 4 }
      ]
    }
  };

  const macdOptions = {
    chart: {
      type: 'line',
      height: 150,
      toolbar: { show: false },
      zoom: {
        enabled: true,
        type: 'x' as const,
        autoScaleYaxis: true
      },
      animations: {
        enabled: false
      }
    },
    title: {
      text: 'MACD (12, 26, 9)',
      align: 'left' as const,
      style: {
        fontSize: '14px',
        color: '#ffffff'
      }
    },
    xaxis: {
      type: 'datetime' as const,
      labels: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#ffffff'
        },
        formatter: (val: number) => val?.toFixed(2) || ''
      }
    },
    stroke: {
      width: [2, 2, 0]
    },
    plotOptions: {
      bar: {
        columnWidth: '80%'
      }
    },
    colors: ['#2196F3', '#FF9800', '#9E9E9E'],
    legend: {
      show: true,
      position: 'top' as const,
      fontSize: '11px',
      labels: {
        colors: '#ffffff'
      }
    }
  };

  return (
      <div className="space-y-4">
        {/* Indicator Controls */}
        <div className="flex flex-wrap gap-2 p-4 bg-neutral-800 rounded-lg">
          <button
              onClick={() => setIndicators(prev => ({ ...prev, sma20: !prev.sma20 }))}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  indicators.sma20
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
          >
            SMA 20
          </button>
          <button
              onClick={() => setIndicators(prev => ({ ...prev, sma50: !prev.sma50 }))}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  indicators.sma50
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
          >
            SMA 50
          </button>
          <button
              onClick={() => setIndicators(prev => ({ ...prev, ema12: !prev.ema12 }))}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  indicators.ema12
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
          >
            EMA 12
          </button>
          <button
              onClick={() => setIndicators(prev => ({ ...prev, bb: !prev.bb }))}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  indicators.bb
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
          >
            Bollinger Bands
          </button>
          <div className="w-px h-8 bg-neutral-600 self-center mx-1"></div>
          <button
              onClick={() => setIndicators(prev => ({
                ...prev,
                oscillator: prev.oscillator === 'rsi' ? null : 'rsi'
              }))}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  indicators.oscillator === 'rsi'
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
          >
            RSI
          </button>
          <button
              onClick={() => setIndicators(prev => ({
                ...prev,
                oscillator: prev.oscillator === 'macd' ? null : 'macd'
              }))}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  indicators.oscillator === 'macd'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-neutral-600 text-white hover:bg-neutral-500'
              }`}
          >
            MACD
          </button>
        </div>

        {/* Main Chart */}
        <ReactApexChart
            series={chartData.series}
            options={mainChartOptions as any}
            type="candlestick"
            height={350}
        />

        {/* RSI Chart */}
        {indicators.oscillator === 'rsi' && chartData.rsiData && (
            <ReactApexChart
                series={[{
                  name: 'RSI',
                  data: chartData.timestamps.map((x, i) => ({ x, y: chartData.rsiData![i] }))
                }]}
                options={rsiOptions as any}
                type="line"
                height={150}
            />
        )}

        {/* MACD Chart */}
        {indicators.oscillator === 'macd' && chartData.macdData && (
            <ReactApexChart
                series={[
                  {
                    name: 'MACD',
                    type: 'line',
                    data: chartData.timestamps.map((x, i) => ({ x, y: chartData.macdData!.macdLine[i] }))
                  },
                  {
                    name: 'Signal',
                    type: 'line',
                    data: chartData.timestamps.map((x, i) => ({ x, y: chartData.macdData!.signalLine[i] }))
                  },
                  {
                    name: 'Histogram',
                    type: 'bar',
                    data: chartData.timestamps.map((x, i) => ({ x, y: chartData.macdData!.histogram[i] }))
                  }
                ]}
                options={macdOptions as any}
                type="line"
                height={150}
            />
        )}
      </div>
  );
};

export default LiveChart;