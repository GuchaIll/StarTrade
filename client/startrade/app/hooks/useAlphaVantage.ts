"use client"
import { useState, useEffect } from 'react'

export interface OHLCV {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume?: number
}


export function useAlphaVantage(symbol: string, apiKey?: string) {
  const [data, setData] = useState<OHLCV[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    const key = apiKey ?? process.env.NEXT_PUBLIC_ALPHA_VANTAGE_KEY ?? process.env.ALPHA_VANTAGE_KEY
    if (!key) {
      setError('Alpha Vantage API key not provided')
      return
    }

    let cancelled = false
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(symbol)}&outputsize=compact&apikey=${key}`
        const res = await fetch(url)
        const json = await res.json()
        if (json['Error Message'] || json['Note']) {
          throw new Error(json['Error Message'] || json['Note'] || 'Alpha Vantage error')
        }
        const series = json['Time Series (Daily)']
        if (!series) throw new Error('Unexpected response from Alpha Vantage')

        const parsed: OHLCV[] = Object.keys(series).map(dateStr => {
          const item = series[dateStr]
          return {
            date: new Date(dateStr),
            open: parseFloat(item['1. open']),
            high: parseFloat(item['2. high']),
            low: parseFloat(item['3. low']),
            close: parseFloat(item['4. close']),
            volume: parseFloat(item['6. volume'] ?? item['5. volume'] ?? 0),
          }
        }).sort((a, b) => a.date.getTime() - b.date.getTime())

        if (!cancelled) setData(parsed)
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [symbol, apiKey])

  return { data, loading, error }
}
