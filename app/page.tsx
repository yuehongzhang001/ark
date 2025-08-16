"use client";

import { useState, useEffect } from "react";
import { fetchTrades, type Trade } from "./service/tradeService";

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState("CAI");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTrades(symbol, dateFrom, dateTo);
      setTrades(data.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const handleSearch = () => {
    loadTrades();
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSymbol(e.target.value);
    loadTrades();
  };

  return (
    <div className="font-sans p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">TSLA 交易数据展示</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">股票代码:</label>
            <select 
              value={symbol}
              onChange={handleSymbolChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TSLA">TSLA</option>
              <option value="NVDA">NVDA</option>
              <option value="CAI">CAI</option>
              <option value="PACB">PACB</option>
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
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 text-center border-b border-gray-300">日期</th>
                <th className="py-3 px-4 text-center border-b border-gray-300">基金</th>
                <th className="py-3 px-4 text-center border-b border-gray-300">方向</th>
                <th className="py-3 px-4 text-center border-b border-gray-300">股数</th>
                <th className="py-3 px-4 text-center border-b border-gray-300">ETF占比(%)</th>
                <th className="py-3 px-4 text-center border-b border-gray-300">收盘价</th>
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
                  <td className="py-3 px-4 border-b border-gray-300">{trade.shares || ""}</td>
                  <td className="py-3 px-4 border-b border-gray-300">{trade.etf_percent || ""}</td>
                  <td className="py-3 px-4 border-b border-gray-300">{trade.close ? trade.close.toFixed(2) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}