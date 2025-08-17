"use client";

import { useState, useEffect, useCallback } from "react";
import {fetchTrades, type Trade, fetchNote, saveNote } from "./service/client/tradeService";

// 定义股票代码和描述的数据结构
const STOCK_DESCRIPTIONS: Record<string, string> = {
  "TSLA": "生产电动汽车、能源存储和太阳能产品。",
  "NVDA": "设计 GPU 和人工智能计算芯片。",
  "CAI": "提供癌症精准医疗的分子分析和检测服务。",
  "PACB": "开发高精度 DNA 测序技术。",
  "CRCL": "稳定币",
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
  "BMNR": "区块链技术的美国公司，主要从事比特币的大规模矿业业务、自营矿机托管、矿机销售",
  "BLSH": "加密货币交易所，同时拥有加密媒体平台 CoinDesk",
  "BWXT": "核蒸汽发生器、核燃料、热交换器、反应堆部件、压力容器",
  "EXAS": "主要提供癌症筛查和诊断测试，包括 Cologuard（结直肠癌粪便 DNA 检测）",
  "GH": "精准肿瘤学的生物技术公司",
  "META": "Meta Platforms, Inc.，前身为 Facebook，专注于社交媒体、虚拟现实和人工智能等领域。",
  "ACHR": "电动垂直起降（eVTOL）飞行器制造商",
  "ARKB": "ARK Invest 与 21Shares 联合推出的现货比特币 ETF，旨在为投资者提供直接持有比特币的机会，无需自行管理钱包或私钥",
  "DKNG": "在线和零售体育博彩、iGaming",
  "CRM": "云计算和客户关系管理（CRM）软件公司，成立于 1999 年。",
  "DASH": "DoorDash",
  "TSM": "台灣積體電路製造股份有限公司（TSMC），成立於 1987 年，是全球最大的純晶圓代工廠，專注於半導體製造",
  "TER": "，专注于自动化测试设备（ATE）的设计、开发和制造。"
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
  const [note, setNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState(false);
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);
  const [globalNote, setGlobalNote] = useState(""); // 全局备注状态
  const [globalNoteLoading, setGlobalNoteLoading] = useState(false); // 全局备注加载状态
  const [globalNoteSaving, setGlobalNoteSaving] = useState(false); // 全局备注保存状态
  const [globalNoteSaveSuccess, setGlobalNoteSaveSuccess] = useState(false); // 全局备注保存成功状态
  const [isGlobalNoteExpanded, setIsGlobalNoteExpanded] = useState(false); // 全局备注展开状态

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

  const loadNote = useCallback(async (symbol: string) => {
    setNoteLoading(true);
    try {
      const noteData = await fetchNote(symbol);
      setNote(noteData.note);
    } catch (err) {
      console.error("Error fetching note:", err);
      setNote("");
    } finally {
      setNoteLoading(false);
    }
  }, []);

  const saveNoteHandler = useCallback(async (symbol: string, note: string) => {
    setNoteSaving(true);
    setNoteSaveSuccess(false);
    try {
      await saveNote(symbol, note);
      setNoteSaveSuccess(true);
      // 3秒后隐藏成功提示
      setTimeout(() => setNoteSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setNoteSaving(false);
    }
  }, []);

  const loadGlobalNote = useCallback(async () => {
    setGlobalNoteLoading(true);
    try {
      const noteData = await fetchNote("GLOBAL"); // 使用特殊标识符GLOBAL表示全局备注
      setGlobalNote(noteData.note);
    } catch (err) {
      console.error("Error fetching global note:", err);
      setGlobalNote("");
    } finally {
      setGlobalNoteLoading(false);
    }
  }, []);

  const saveGlobalNoteHandler = useCallback(async (note: string) => {
    setGlobalNoteSaving(true);
    setGlobalNoteSaveSuccess(false);
    try {
      await saveNote("GLOBAL", note); // 使用特殊标识符GLOBAL表示全局备注
      setGlobalNoteSaveSuccess(true);
      // 3秒后隐藏成功提示
      setTimeout(() => setGlobalNoteSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving global note:", err);
    } finally {
      setGlobalNoteSaving(false);
    }
  }, []);

  useEffect(() => {
    loadTrades();
    fetchPreviousClose(symbol);
    loadNote(symbol);
    loadGlobalNote(); // 加载全局备注
  }, [loadTrades, fetchPreviousClose, loadNote, loadGlobalNote, symbol]);

  const handleSearch = () => {
    loadTrades();
    fetchPreviousClose(symbol);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  const handleSaveNote = () => {
    saveNoteHandler(symbol, note);
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("Selected symbol:", e.target.value);
    setSymbol(e.target.value);
  };

  const toggleNoteExpand = () => {
    setIsNoteExpanded(!isNoteExpanded);
  };

  const handleGlobalNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGlobalNote(e.target.value);
  };

  const handleSaveGlobalNote = () => {
    saveGlobalNoteHandler(globalNote);
  };

  const toggleGlobalNoteExpand = () => {
    setIsGlobalNoteExpanded(!isGlobalNoteExpanded);
  };

  return (
    <div className="font-sans p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold text-gray-800">{symbol} 交易数据展示</h1>
  {/* 全局备注区域 */}
  <div className="lg:w-1/3">
    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 h-fit">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">全局备注</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleGlobalNoteExpand}
            className="text-purple-700 hover:text-purple-900 focus:outline-none"
          >
            {isGlobalNoteExpanded ? "收起" : "展开"}
          </button>
        </div>
      </div>
      
      {isGlobalNoteExpanded && (
        <>
          {globalNoteLoading ? (
            <p className="mt-2">加载备注中...</p>
          ) : (
            <div className="mt-2">
              <textarea
                value={globalNote}
                onChange={handleGlobalNoteChange}
                rows={6}
                className="w-full p-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="添加全局备注..."
              />
              <div className="mt-2 flex justify-end">
                {globalNoteSaveSuccess && (
                  <span className="mr-2 py-2 px-3 bg-green-100 text-green-800 rounded">
                    备注保存成功！
                  </span>
                )}
                <button
                  onClick={handleSaveGlobalNote}
                  disabled={globalNoteSaving}
                  className={`px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    globalNoteSaving 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-purple-500 hover:bg-purple-600 text-white"
                  }`}
                >
                  {globalNoteSaving ? "保存中..." : "保存备注"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
</div>
      
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
              
              {/* 显示和编辑备注 */}
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">备注</h2>
                  <button 
                    onClick={toggleNoteExpand}
                    className="text-yellow-700 hover:text-yellow-900 focus:outline-none"
                  >
                    {isNoteExpanded ? "收起" : "展开"}
                  </button>
                </div>
                
                {isNoteExpanded && (
                  <>
                    {noteLoading ? (
                      <p className="mt-2">加载备注中...</p>
                    ) : (
                      <div className="mt-2">
                        <textarea
                          value={note}
                          onChange={handleNoteChange}
                          rows={3}
                          className="w-full p-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          placeholder="为这个股票添加备注..."
                        />
                        <div className="mt-2 flex justify-end">
                          {noteSaveSuccess && (
                            <span className="mr-2 py-2 px-3 bg-green-100 text-green-800 rounded">
                              备注保存成功！
                            </span>
                          )}
                          <button
                            onClick={handleSaveNote}
                            disabled={noteSaving}
                            className={`px-4 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                              noteSaving 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : "bg-yellow-500 hover:bg-yellow-600 text-white"
                            }`}
                          >
                            {noteSaving ? "保存中..." : "保存备注"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
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