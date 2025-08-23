import yahooFinance from "yahoo-finance2";
import { SupabaseService } from "./supabaseService";

yahooFinance.suppressNotices(["ripHistorical"]);

// ── 日期工具（全部用 UTC，避免 23 变 22 的时区偏移） ──────────────────────────────
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 把任意输入（Date 或字符串）转换为“UTC 的 YYYY-MM-DD”键 */
function toYMD(input: string | Date): string {
  if (typeof input === "string") {
    if (YMD_RE.test(input)) return input; // 已经是 YYYY-MM-DD
    const d = new Date(input);
    if (isNaN(d.getTime())) throw new Error(`Invalid date string: ${input}`);
    return d.toISOString().slice(0, 10); // 用 UTC 截到日期
  } else {
    // Date → UTC 的 YYYY-MM-DD
    return new Date(input).toISOString().slice(0, 10);
  }
}

/** 在一个 YYYY-MM-DD 的基础上，用 UTC 方式加天数并返回 YYYY-MM-DD */
function addDaysYMD(ymd: string, days: number): string {
  if (!YMD_RE.test(ymd)) throw new Error(`Invalid YMD: ${ymd}`);
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

// ── 主函数 ──────────────────────────────────────────────────────────────────────
/**
 * 为交易记录添加收盘价（逐日请求 Yahoo，先去重日期；所有日期用 UTC-YYYY-MM-DD）
 */
export async function tradesWithClosePrice(symbol: string, trades: any[]) {
  console.log(`Processing trades for symbol: ${symbol}`);
  if (trades.length === 0) return [];

  // 1) 计算交易范围（仅用于一次性查询 DB）
  const dateKeys = trades.map(t => toYMD(t.date));
  const minYmd = dateKeys.reduce((a, b) => (a < b ? a : b));
  const maxYmd = dateKeys.reduce((a, b) => (a > b ? a : b));
  console.log(`Date range from trades (UTC YMD): ${minYmd} to ${maxYmd}`);
  console.log(`Number of trades: ${trades.length}`);

  // 2) 从数据库取已有价格（表的 date 是 DATE 类型，直接用 YYYY-MM-DD）
  console.log(`Fetching price data from DB for ${symbol} from ${minYmd} to ${maxYmd}`);
  let dbPrices: any[] = [];
  try {
    // 保持你原来的方法名
    dbPrices = await SupabaseService.getDailyPricesByDateRange(symbol, minYmd, maxYmd);
    console.log(`Retrieved ${dbPrices.length} price records from DB`);
  } catch (err) {
    console.error("Error fetching prices from database:", err);
  }

  // 3) 构建 (YYYY-MM-DD → price) 映射（统一转为 UTC-YYYY-MM-DD 键）
  const priceMap = new Map<string, number>();
  for (const p of dbPrices) {
    const key = typeof p.date === "string" && YMD_RE.test(p.date) ? p.date : toYMD(p.date);
    priceMap.set(key, Number(p.price));
  }

  // 4) 先用 DB 结果回填
  let enriched = trades.map(t => {
    const key = toYMD(t.date);
    const dbPrice = priceMap.get(key);
    return dbPrice !== undefined ? { ...t, close: dbPrice } : { ...t };
  });

  // 5) 找出缺少价格的唯一日期（UTC-YYYY-MM-DD 去重）
  const missingDates = Array.from(
    new Set(enriched.filter(t => t.close === undefined).map(t => toYMD(t.date)))
  );

  if (missingDates.length === 0) {
    console.log("All trades have prices from DB, done.");
    return enriched;
  }
  console.log(`Need Yahoo data for ${missingDates.length} unique dates`);

  // 6) 逐日请求 Yahoo（period1=当天, period2=次日；两者都用 UTC-YYYY-MM-DD）
  const yahooData: Record<string, number> = {};
  for (const ymd of missingDates) {
    try {
      const next = addDaysYMD(ymd, 1);
      const result = await yahooFinance.chart(symbol, {
        period1: ymd,
        period2: next,
      });

      if (result?.quotes?.length) {
        // 取第一条（那天的收盘）
        const q = result.quotes[0];
        if (q?.close != null) {
          yahooData[ymd] = Number(q.close);
          console.log(`Yahoo: ${symbol} ${ymd} close=${q.close}`);
        } else {
          console.log(`Yahoo: ${symbol} ${ymd} no close in quotes[0]`);
        }
      } else {
        console.log(`Yahoo: ${symbol} ${ymd} no quotes`);
      }
    } catch (err) {
      console.error(`Error fetching Yahoo data for ${symbol} on ${ymd}:`, err);
    }
  }

  // 7) upsert 进 DB（去重，避免 ON CONFLICT 命中多次）
  const pricesToInsert = Object.entries(yahooData).map(([date, price]) => ({
    symbol,
    date,     // 已是 YYYY-MM-DD
    price,    // numeric
    ts: Date.now(),
  }));

  if (pricesToInsert.length > 0) {
    // 以 (symbol,date) 去重（理论上此处已唯一，但稳一手）
    const uniq = Array.from(
      new Map(pricesToInsert.map(p => [`${p.symbol}_${p.date}`, p])).values()
    );

    console.log(`Inserting ${uniq.length} new prices into DB`);
    try {
      await SupabaseService.upsertDailyPrices(uniq);
      console.log(`Successfully inserted ${uniq.length} prices`);
    } catch (err) {
      console.error("Error inserting new prices into DB:", err);
    }
  }

  // 8) 再次回填 Yahoo 获取的价格
  enriched = enriched.map(t => {
    if (t.close !== undefined) return t;
    const key = toYMD(t.date);
    const close = yahooData[key];
    return close !== undefined ? { ...t, close } : t;
  });

  return enriched;
}
