import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// 抑制关于historical()方法弃用的通知
yahooFinance.suppressNotices(['ripHistorical']);

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
    
    // 为每个交易记录添加收盘价
    const tradesWithClosePrice = await Promise.all(
      data.trades.map(async (trade: any) => {
        try {
          // 创建结束日期（第二天）
          const period1 = new Date(trade.date);
          const period2 = new Date(period1);
          period2.setDate(period2.getDate() + 1);

          // 获取指定日期的股票数据
          const stockData = await yahooFinance.chart(symbol, {
            period1: period1.toISOString().split('T')[0],
            period2: period2.toISOString().split('T')[0]
          });

          // 从返回数据中提取收盘价
          if (stockData.quotes && stockData.quotes.length > 0) {
            return { ...trade, close: stockData.quotes[0].close };
          }
          
          return trade;
        } catch (error) {
          console.error(`Error fetching close price for ${symbol} on ${trade.date}:`, error);
          return trade;
        }
      })
    );
    
    // 组装包含收盘价的完整数据
    const result = {
      ...data,
      trades: tradesWithClosePrice
    };
    
    // 打印即将返回给客户端的数据
    console.log('Returning trades data to client:', JSON.stringify(result, null, 2));
    
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