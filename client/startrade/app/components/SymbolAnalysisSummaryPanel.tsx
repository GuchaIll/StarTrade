'use client'
import React, { useState, useEffect } from 'react'

interface Props {
    symbol: string | null;
}

interface AnalysisData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    indicators: {
        sma20: number;
        sma50: number;
        rsi: number;
        macd: number;
        bbUpper: number;
        bbLower: number;
    };
}

const SymbolAnalysisSummaryPanel: React.FC<Props> = ({ symbol }) => {
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Helper functions for indicator calculations
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

    const bollingerBands = (series: number[], period: number = 20) => {
        if (series.length < period) return { upper: NaN, middle: NaN, lower: NaN };
        const middle = sma(series, period);
        const slice = series.slice(-period);
        const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        return {
            upper: middle + (2 * stdDev),
            middle: middle,
            lower: middle - (2 * stdDev),
        };
    }

    const generateSummary = (data: AnalysisData): string => {
        const { price, change, changePercent, indicators } = data;
        const { sma20, sma50, rsi, macd, bbUpper, bbLower } = indicators;

        let summary = `${symbol} is currently trading at $${price.toFixed(2)}, `;

        // Price movement
        if (change > 0) {
            summary += `up $${change.toFixed(2)} (${changePercent.toFixed(2)}%) today. `;
        } else {
            summary += `down $${Math.abs(change).toFixed(2)} (${changePercent.toFixed(2)}%) today. `;
        }

        // Trend analysis based on moving averages
        if (price > sma20 && price > sma50) {
            summary += `The stock is trading above both its 20-day SMA ($${sma20.toFixed(2)}) and 50-day SMA ($${sma50.toFixed(2)}), indicating a bullish trend. `;
        } else if (price < sma20 && price < sma50) {
            summary += `The stock is trading below both its 20-day SMA ($${sma20.toFixed(2)}) and 50-day SMA ($${sma50.toFixed(2)}), suggesting a bearish trend. `;
        } else {
            summary += `The stock is showing mixed signals with the 20-day SMA at $${sma20.toFixed(2)} and 50-day SMA at $${sma50.toFixed(2)}. `;
        }

        // RSI analysis
        if (rsi > 70) {
            summary += `With an RSI of ${rsi.toFixed(2)}, the stock appears overbought and may face selling pressure. `;
        } else if (rsi < 30) {
            summary += `With an RSI of ${rsi.toFixed(2)}, the stock appears oversold and could see a potential bounce. `;
        } else {
            summary += `The RSI at ${rsi.toFixed(2)} indicates neutral momentum. `;
        }

        // Bollinger Bands analysis
        const bbMid = (bbUpper + bbLower) / 2;
        if (price > bbUpper) {
            summary += `The price is above the upper Bollinger Band ($${bbUpper.toFixed(2)}), suggesting the stock may be overextended. `;
        } else if (price < bbLower) {
            summary += `The price is below the lower Bollinger Band ($${bbLower.toFixed(2)}), indicating potential oversold conditions. `;
        } else {
            summary += `The stock is trading within the Bollinger Bands ($${bbLower.toFixed(2)} - $${bbUpper.toFixed(2)}). `;
        }

        // MACD momentum
        if (macd > 0) {
            summary += `The MACD is positive at ${macd.toFixed(2)}, showing bullish momentum.`;
        } else {
            summary += `The MACD is negative at ${macd.toFixed(2)}, showing bearish momentum.`;
        }

        return summary;
    };

    useEffect(() => {
        if (!symbol) {
            setSummary('');
            setError(null);
            return;
        }

        let cancelled = false;

        const fetchAndAnalyze = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch historical data
                const response = await fetch(`/api/yahoo-finance?symbol=${encodeURIComponent(symbol)}&period=1y&interval=1d`);

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();

                if (data.chart?.error) {
                    throw new Error(data.chart.error.description || 'API error');
                }

                const result = data?.chart?.result?.[0];
                if (!result) throw new Error('No data available');

                const timestamps = result.timestamp || [];
                const quotes = result.indicators?.quote?.[0];

                if (!quotes) throw new Error('No quote data');

                const { close, volume } = quotes;
                const closes: number[] = [];

                for (let i = 0; i < timestamps.length; i++) {
                    if (close[i] != null && Number.isFinite(close[i])) {
                        closes.push(close[i]);
                    }
                }

                if (closes.length === 0) throw new Error('No valid data');

                // Calculate indicators
                const latestClose = closes[closes.length - 1];
                const prevClose = closes[closes.length - 2];
                const change = latestClose - prevClose;
                const changePercent = (change / prevClose) * 100;

                const bb = bollingerBands(closes, 20);
                const ema12 = ema(closes, 12);
                const ema26 = ema(closes, 26);
                const macdVal = ema12 - ema26;

                const analysisData: AnalysisData = {
                    symbol: symbol,
                    price: latestClose,
                    change: change,
                    changePercent: changePercent,
                    volume: volume[volume.length - 1] || 0,
                    indicators: {
                        sma20: sma(closes, 20),
                        sma50: sma(closes, 50),
                        rsi: rsi(closes, 14),
                        macd: macdVal,
                        bbUpper: bb.upper,
                        bbLower: bb.lower,
                    }
                };

                const generatedSummary = generateSummary(analysisData);

                if (!cancelled) {
                    setSummary(generatedSummary);
                    setLoading(false);
                }
            } catch (err: any) {
                if (!cancelled) {
                    setError(err?.message ?? 'Failed to generate summary');
                    setLoading(false);
                }
            }
        };

        fetchAndAnalyze();

        return () => {
            cancelled = true;
        };
    }, [symbol]);

    return (
        <div className="flex flex-col w-full p-4">
            <h2 className="text-2xl font-bold mb-4">Analysis Summary</h2>

            <div className="bg-white/5 p-4 rounded-lg shadow-sm">
                {loading ? (
                    <div className="text-sm text-neutral-400">Generating analysis for {symbol}...</div>
                ) : error ? (
                    <div className="text-sm text-red-400">Error: {error}</div>
                ) : summary ? (
                    <div className="text-sm leading-relaxed text-neutral-200">
                        {summary}
                    </div>
                ) : (
                    <div className="text-sm text-neutral-500">
                        Select a symbol from your portfolio to view analysis summary.
                    </div>
                )}
            </div>

            {summary && (
                <div className="mt-4 text-xs text-neutral-400">
                   
                </div>
            )}
        </div>
    )
}

export default SymbolAnalysisSummaryPanel