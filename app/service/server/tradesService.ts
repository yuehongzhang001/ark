import yahooFinance from 'yahoo-finance2';
import { SupabaseService } from '../supabaseService';

// 抑制关于historical()方法弃用的通知
yahooFinance.suppressNotices(['ripHistorical']);

/**
 * 为交易记录添加收盘价
 * @param symbol 股票代码
 * @param trades 交易记录数组
 * @returns 添加了收盘价的交易记录数组
 */
export async function tradesWithClosePrice(symbol: string, trades: any[]) {
  // 获取价格数据
  console.log(`Fetching price data from database for ${symbol} for ${trades.length} trades`);
  
  // 如果没有交易数据，则直接返回
  if (trades.length === 0) {
    return trades;
  }
  
  // 获取所有交易日期
  const dates = trades.map(trade => new Date(trade.date));
  const minDate = new Date(Math.min(...dates.map(date => date.getTime())));
  const maxDate = new Date(Math.max(...dates.map(date => date.getTime())));
  
  // 格式化日期
  const startDate = minDate.toISOString().split('T')[0];
  const endDate = maxDate.toISOString().split('T')[0];

  console.log(`Fetching price data from database for ${symbol} from ${startDate} to ${endDate}`);
  
  // 从数据库获取价格数据
  let dbPrices: any[] = [];
  try {
    dbPrices = await SupabaseService.getDailyPricesByDateRange(symbol, startDate, endDate);
    console.log(`Retrieved ${dbPrices.length} price records from database`);
  } catch (error) {
    console.error('Error fetching prices from database:', error);
  }

  // 创建日期到价格的映射，统一使用YYYY-MM-DD格式作为键
  const priceMap = new Map<string, number>();
  dbPrices.forEach(price => {
    const normalizedDate = new Date(price.date).toISOString().split('T')[0];
    priceMap.set(normalizedDate, price.price);
  });

  // 更新有数据库价格的交易记录
  const tradesWithDbPrices = trades.map(trade => {
    // 确保trade.date格式统一为YYYY-MM-DD
    const normalizedTradeDate = new Date(trade.date).toISOString().split('T')[0];
    
    // 检查数据库中是否有该日期的价格
    const dbPrice = priceMap.get(normalizedTradeDate);
    if (dbPrice !== undefined) {
      console.log(`Using database price for ${symbol} on ${normalizedTradeDate}: ${dbPrice}`);
      return { ...trade, close: dbPrice };
    }
    
    return trade;
  });

  // 找出仍然没有价格的交易记录
  const tradesWithoutPrices = tradesWithDbPrices.filter(trade => trade.close === undefined);
  
  // 如果所有交易都有价格，直接返回
  if (tradesWithoutPrices.length === 0) {
    return tradesWithDbPrices;
  }

  // 为剩余的交易记录从Yahoo Finance获取价格
  console.log(`Fetching ${tradesWithoutPrices.length} trades from Yahoo Finance`);
  const pricesToInsert: any[] = [];
  
  const tradesWithNewPrices = await Promise.all(
    tradesWithDbPrices.map(async (trade) => {
      // 如果已经有价格，直接返回
      if (trade.close !== undefined) {
        return trade;
      }

      // 确保trade.date格式统一为YYYY-MM-DD
      const normalizedTradeDate = new Date(trade.date).toISOString().split('T')[0];

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
          const closePrice = stockData.quotes[0].close;
          console.log(`Fetched new data for ${symbol} on ${normalizedTradeDate}: ${closePrice}`);
          
          // 添加到待插入数据库的数组
          pricesToInsert.push({
            symbol: symbol,
            date: normalizedTradeDate,
            price: closePrice,
            ts: Date.now()
          });
          
          return { ...trade, close: closePrice };
        } else {
          console.log(`No stock data found for ${symbol} on ${normalizedTradeDate}`);
        }
      } catch (error) {
        console.error(`Error fetching close price for ${symbol} on ${normalizedTradeDate}:`, error);
      }
      
      return trade;
    })
  );

  // 将新获取的价格数据插入数据库
  if (pricesToInsert.length > 0) {
    try {
      console.log(`Inserting ${pricesToInsert.length} price records into database`);
      await SupabaseService.upsertDailyPrices(pricesToInsert);
      console.log(`Successfully inserted ${pricesToInsert.length} price records into database`);
    } catch (error) {
      console.error('Error inserting prices into database:', error);
    }
  }

  return tradesWithNewPrices;
}