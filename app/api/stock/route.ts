import yahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

yahooFinance.suppressNotices(['ripHistorical']);

// Example data output:{"date":"2024-08-15T13:30:00.000Z","high":225.35000610351562,"volume":46414000,"open":224.60000610351562,"low":222.75999450683594,"close":224.72000122070312,"adjclose":223.6790008544922}
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const dateStr = searchParams.get('date');

  if (!symbol || !dateStr) {
    return NextResponse.json(
      { error: 'Missing symbol or date query parameters' },
      { status: 400 }
    );
  }

  try {
    const period1 = new Date(dateStr);
    // period2 设置为 period1 的下一天
    const period2 = new Date(period1);
    period2.setDate(period2.getDate() + 1);

    const data = await yahooFinance.chart(symbol, {
      period1: period1.toISOString().split('T')[0],
      period2: period2.toISOString().split('T')[0]
    });

    if (data.quotes && data.quotes.length > 0) {
      return NextResponse.json(data.quotes[0]);
    } else {
      return NextResponse.json(null);
    }
  } catch (error: any) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
