"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchTrades, type Trade } from "./service/tradeService";

// 定义股票代码和描述的数据结构
const STOCK_DESCRIPTIONS: Record<string, string> = {
  "TSLA": "生产电动汽车、能源存储和太阳能产品。",
  "NVDA": "设计 GPU 和人工智能计算芯片。",
  "CAI": "提供癌症精准医疗的分子分析和检测服务。",
  "PACB": "开发高精度 DNA 测序技术。",
  "CRCL": "提供临床试验和诊断服务。",
  "TWST": "生产和销售生物制药产品。",
  "SOFI": "提供在线个人理财、贷款和投资服务。",
  "CRWV": "提供面向 AI 和图形渲染的 GPU 云计算服务。",
  "XYZ": "提供支付处理、个人理财、比特币服务和“先买后付”金融服务。",
  "TTD": "提供程序化数字广告购买平台。",
  "BEAM": "开发基于碱基编辑的基因疗法。",
  "AMD": "设计 CPU、GPU 和半导体产品。",
  "ROKU": "提供流媒体平台和相关硬件设备。",
  "BLDE": "提供城市空中出行和医疗器官运输服务。",
  "COIN": "coinbase 加密货币交易",
  "JOBY":"电动垂直起降（eVTOL）飞行器",
  "GOOG": "谷歌母公司，提供搜索引擎、广告服务和云计算等多种产品和服务。",
  "CRSP": "开发基因编辑技术和治疗方法，专注于罕见疾病和癌症。",
  "PLTR": "提供大数据分析和人工智能软件解决方案。",
  "RBLX": "提供在线游戏平台和游戏开发工具，允许用户创建和分享游戏内容。",
  "DE": "约翰迪尔，农业机械和设备制造商，提供农业、建筑和林业设备。",
  "LHX": "洛克希德·马丁，全球领先的航空航天、防务和安全公司，提供飞机、导弹和卫星等产品。",
  "KTOS": "无人系统、空间、推进、微波电子等领域，旨在为美国在新型冲突时代保持决定性优势",
  "AVAV": "专注于设计、开发和制造无人系统（UAS）、战术导弹系统以及相关服务",
  "IRDM": "卫星通信公司，提供全球范围的语音和数据通信服务。",
};

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("CAI");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [previousClose, setPreviousClose] = useState<number | null>(null);
  const [prevCloseLoading, setPrevCloseLoading] = useState(false);

  const loadTrades = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching trades for symbol:", symbol, "from:", dateFrom, "to:", dateTo);
      const data = await fetchTrades(symbol, dateFrom, dateTo);
      setTrades(data.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Error fetching trades for symbol:", symbol, err);
    } finally {
      setLoading(false);
    }
  }, [symbol, dateFrom, dateTo]);

  const fetchPreviousClose = useCallback(async (symbol: string) => {
    setPrevCloseLoading(true);
    try {
      // 获取当前日期的前一天
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];
      
      const response = await fetch(`/api/stock?symbol=${symbol}&date=${dateString}`);
      if (response.ok) {
        const data = await response.json();
        setPreviousClose(data?.close || null);
      } else {
        setPreviousClose(null);
      }
    } catch (err) {
      console.error("Error fetching previous close:", err);
      setPreviousClose(null);
    } finally {
      setPrevCloseLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrades();
    fetchPreviousClose(symbol);
  }, [loadTrades, fetchPreviousClose, symbol]);

  const handleSearch = () => {
    loadTrades();
    fetchPreviousClose(symbol);
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("Selected symbol:", e.target.value);
    setSymbol(e.target.value);
  };

  return (
    <div className="font-sans p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{symbol} 交易数据展示</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">股票代码:</label>
            <select 
              value={symbol}
              onChange={handleSymbolChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(STOCK_DESCRIPTIONS).map((stockSymbol) => (
                <option key={stockSymbol} value={stockSymbol}>
                  {stockSymbol}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleSearch}
            className="h-fit px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            查询
          </button>
          
          {trades.length > 0 && (() => {
            const closes = trades
              .map(t => t.close)
              .filter((close): close is number => close !== undefined && close !== null);
            if (closes.length > 0) {
              const min = Math.min(...closes).toFixed(2);
              const max = Math.max(...closes).toFixed(2);
              return (
                <div className="ml-4 py-2 text-gray-700">
                  价格范围：{min} - {max}
                </div>
              );
            }
            return null;
          })()}
          
          <div className="ml-4 py-2 text-gray-700">
            {prevCloseLoading ? (
              <span>加载中...</span>
            ) : previousClose !== null ? (
              <span>昨日收盘价: {previousClose.toFixed(2)}</span>
            ) : (
              <span>无法获取昨日收盘价</span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
          加载数据失败: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p>加载中...</p>
        </div>
      ) : (
        <>
          {/* 显示股票描述 */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-800">
              <span className="font-semibold">{symbol}：</span>
              {STOCK_DESCRIPTIONS[symbol] || "暂无描述信息"}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-center border-b border-gray-300">日期</th>
                  <th className="py-3 px-4 text-center border-b border-gray-300">基金</th>
                  <th className="py-3 px-4 text-center border-b border-gray-300">方向</th>
                  <th className="py-3 px-4 text-center border-b border-gray-300">收盘价</th>
                  <th className="py-3 px-4 text-center border-b border-gray-300">股数</th>
                  <th className="py-3 px-4 text-center border-b border-gray-300">ETF占比(%)</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade, index) => (
                  <tr 
                    key={index} 
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="py-3 px-4 border-b border-gray-300">{trade.date || ""}</td>
                    <td className="py-3 px-4 border-b border-gray-300">{trade.fund || ""}</td>
                    <td 
                      className={`py-3 px-4 border-b border-gray-300 ${
                        trade.direction === "Buy" 
                          ? "bg-yellow-100" 
                          : trade.direction === "Sell" 
                            ? "bg-orange-100" 
                            : ""
                      }`}
                    >
                      {trade.direction || ""}
                    </td>
                    <td className="py-3 px-4 border-b border-gray-300">{trade.close ? trade.close.toFixed(2) : ""}</td>
                    <td className="py-3 px-4 border-b border-gray-300">{trade.shares || ""}</td>
                    <td className="py-3 px-4 border-b border-gray-300">{trade.etf_percent || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}