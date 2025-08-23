#!/usr/bin/env tsx
//npx tsx __tests__/tradesWithClosePrice.integration.test.ts
import { loadEnvLocal } from './utils/envLoader';
loadEnvLocal();
console.log('✅ Loaded environment variables from .env.local');

type Trade = { date: string; price: number; shares: number; close?: number };
type PriceData = { symbol: string; date: string; price: number; ts: number };

async function runTradesWithClosePriceIntegrationTest() {
  try {
    console.log('\nStarting tradesWithClosePrice integration test with .env.local variables...');

    // 动态导入 SupabaseService
    const supabaseModule = await import('../app/api/services/supabaseService');
    const { SupabaseService } = supabaseModule;

    // 测试数据
    const testSymbol = 'TSLA';
    const testDates = ['2023-01-01', '2023-01-02', '2023-01-03'];
    const testPrices = [150, 155.5, 149.75];

    console.log(`Testing tradesWithClosePrice logic with symbol: ${testSymbol}`);

    // 清理已有测试数据
    try {
      await SupabaseService.deleteDailyPrices(testSymbol);
      console.log('Cleaned up existing test data');
    } catch {
      console.log('No existing data to clean up, continuing...');
    }

    // 插入测试价格
    const priceData: PriceData[] = testDates.map((date, index) => ({
      symbol: testSymbol,
      date,
      price: testPrices[index],
      ts: Date.now(),
    }));

    console.log('Inserting test price data...');
    await SupabaseService.upsertDailyPrices(priceData);
    console.log('Inserted test price data');

    // 创建测试 trades
    const trades: Trade[] = [
      { date: testDates[0], price: 100, shares: 10 }, // 匹配数据库价格
      { date: testDates[1], price: 120, shares: 5 },  // 匹配数据库价格
      { date: '2023-01-04', price: 130, shares: 8 },  // 数据库没有价格
    ];

    // 动态导入 tradesWithClosePrice 方法
    const tradeModule = await import('../app/api/services/tradesService');
    const tradesWithClosePrice: (symbol: string, trades: Trade[]) => Promise<Trade[]> = tradeModule.tradesWithClosePrice;

    // 调用待测方法
    const tradesWithPrices = await tradesWithClosePrice(testSymbol, trades);

    console.log('Trades with applied prices:', tradesWithPrices);

    // 校验结果
    const trade1 = tradesWithPrices.find(t => t.date === testDates[0]);
    const trade2 = tradesWithPrices.find(t => t.date === testDates[1]);
    const trade3 = tradesWithPrices.find(t => t.date === '2023-01-04');

    let testPassed = true;

    if (!trade1 || trade1.close !== testPrices[0]) {
      console.log(`❌ Trade 1 assertion failed. Expected close price ${testPrices[0]}, got ${trade1?.close}`);
      testPassed = false;
    } else {
      console.log(`✅ Trade 1 correctly has close price: ${trade1.close}`);
    }

    if (!trade2 || trade2.close !== testPrices[1]) {
      console.log(`❌ Trade 2 assertion failed. Expected close price ${testPrices[1]}, got ${trade2?.close}`);
      testPassed = false;
    } else {
      console.log(`✅ Trade 2 correctly has close price: ${trade2.close}`);
    }

// 断言 Trade 3
if (!trade3 || trade3.close === undefined) {
  console.log(`❌ Trade 3 assertion failed. Expected close price from Yahoo Finance, got ${trade3?.close}`);
  testPassed = false;
} else {
  console.log(`✅ Trade 3 correctly fetched close price from Yahoo Finance: ${trade3.close}`);
}


    if (testPassed) {
      console.log('\n🎉 All tests PASSED! tradesWithClosePrice logic works correctly with real database.');
    } else {
      console.log('\n❌ Some tests FAILED.');
    }

    // 清理测试数据
    await SupabaseService.deleteDailyPrices(testSymbol);
    console.log('Cleaned up test data');

  } catch (error) {
    console.error('❌ Integration test ERROR:', error);
  }
}

// 运行测试
runTradesWithClosePriceIntegrationTest();
