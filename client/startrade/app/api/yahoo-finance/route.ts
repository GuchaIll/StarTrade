import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const period = searchParams.get('period') || '6mo';
    const interval = searchParams.get('interval') || '1wk';

    if (!symbol) {
        return NextResponse.json(
            { error: 'Symbol parameter is required' },
            { status: 400 }
        );
    }

    try {
        // Calculate period1 and period2 based on period parameter
        const periodMap: { [key: string]: number } = {
            '1d': 1,
            '5d': 5,
            '1mo': 30,
            '3mo': 90,
            '6mo': 180,
            '1y': 365,
            '2y': 730,
            '5y': 1825,
            'max': 3650,
        };

        const days = periodMap[period] || 180;
        const period2 = Math.floor(Date.now() / 1000);
        const period1 = period2 - (days * 24 * 60 * 60);

        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${interval}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`Yahoo Finance API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.chart?.error) {
            throw new Error(data.chart.error.description || 'Yahoo Finance API error');
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching from Yahoo Finance:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch stock data' },
            { status: 500 }
        );
    }
}