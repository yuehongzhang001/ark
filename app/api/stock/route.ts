import yahooFinance from 'yahoo-finance2';
import { NextResponse } from 'next/server';

yahooFinance.suppressNotices(['ripHistorical']);

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
    const targetDate = new Date(dateStr);

    // 向前查 3 天，确保能覆盖周末或节假日
    const period1 = new Date(targetDate);
    period1.setDate(period1.getDate() - 3);

    const period2 = new Date(targetDate);
    period2.setDate(period2.getDate() + 1); // period2 必须大于 period1

    const data = await yahooFinance.chart(symbol, {
      period1: period1.toISOString().slice(0, 10),
      period2: period2.toISOString().slice(0, 10),
    });

    let quote = null;
    let quoteDate = null;

    if (data.quotes && data.quotes.length > 0) {
      // 筛选出日期 <= targetDate 且有收盘价的记录
      const quotesWithClose = data.quotes
        .filter(q => q.close != null)
        .map(q => ({ ...q, quoteDate: new Date(q.date) }))
        .filter(q => q.quoteDate.getTime() <= targetDate.getTime());

      if (quotesWithClose.length > 0) {
        // 取最近的前一个交易日
        quote = quotesWithClose.reduce((prev, curr) => {
          return curr.quoteDate.getTime() > prev.quoteDate.getTime() ? curr : prev;
        });
        
        // 提取实际的报价日期并格式化为 yyyy-mm-dd
        quoteDate = new Date(quote.date).toISOString().split('T')[0];
      }
    }

    // 返回报价和实际日期
    return NextResponse.json(quote ? { ...quote, date: quoteDate } : null);
  } catch (error: any) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}