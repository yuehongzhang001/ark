import { NextResponse } from 'next/server';
import { tradesWithClosePrice } from '../services/tradesService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'TSLA';
  const date_from = searchParams.get('date_from');
  const date_to = searchParams.get('date_to');

  try {
    let url = `https://arkfunds.io/api/v2/stock/trades?symbol=${symbol}`;
    
    if (date_from) url += `&date_from=${date_from}`;
    if (date_to) url += `&date_to=${date_to}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch trades: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
     
    // 打印请求的参数和获取到的交易数据
    console.log(`Processing trades for symbol: ${symbol}`);
    console.log(`Date range from API: ${data.date_from} to ${data.date_to}`);
    console.log(`Number of trades: ${data.trades.length}`);
    
    // 为每个交易记录添加收盘价
    const tradesWithClosePriceResult = await tradesWithClosePrice(symbol, data.trades);
    
    // 组装包含收盘价的完整数据
    const result = {
      ...data,
      trades: tradesWithClosePriceResult
    };

    
    // 返回包含收盘价的完整数据
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trades data' }, 
      { status: 500 }
    );
  }
}

