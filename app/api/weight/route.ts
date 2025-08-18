import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing symbol query parameter' },
      { status: 400 }
    );
  }

  try {
    const url = `https://arkfunds.io/api/v2/stock/fund-ownership?symbol=${symbol}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch fund weight data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log(`Fetched fund weights for symbol: ${symbol} data: ${JSON.stringify(data, null, 2)}`);
    // Return the data as-is, or we can process it further if needed
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching fund weight data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fund weight data' }, 
      { status: 500 }
    );
  }
}