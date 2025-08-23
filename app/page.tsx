"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchTrades, fetchFundWeights, type Trade, type FundWeight, fetchNote, saveNote, fetchStockSymbols, updateStockSymbolOrder } from "./client-services/tradeService";

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [fundWeights, setFundWeights] = useState<FundWeight[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundWeightsLoading, setFundWeightsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbol, setSymbol] = useState(""); // 默认symbol将从数据库中获取
  const [year, setYear] = useState<string>("all");
  const [previousClose, setPreviousClose] = useState<number | null>(null);
  const [prevCloseDate, setPrevCloseDate] = useState<string | null>(null);
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
  const [stockSymbols, setStockSymbols] = useState<string[]>([]); // 可拖拽排序的股票代码列表
  const [stockDescriptions, setStockDescriptions] = useState<Record<string, string>>({}); // 股票描述信息
  const [draggedSymbol, setDraggedSymbol] = useState<string | null>(null);
  const [isSymbolListOpen, setIsSymbolListOpen] = useState(false); // 控制股票列表是否展开
  const [symbolsSaving, setSymbolsSaving] = useState(false); // 保存股票顺序的状态
  
  // 添加 refs
  const noteDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const globalNoteDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const symbolDropdownRef = useRef<HTMLDivElement>(null);

  const loadTrades = useCallback(async () => {
    // 如果symbol为空，不执行任何操作
    if (!symbol) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // 根据选择的年份设置日期范围
      let dateFrom = "";
      let dateTo = "";
      
      if (year !== "all") {
        dateFrom = `${year}-01-01`;
        dateTo = `${year}-12-31`;
      }
      
      console.log("Fetching trades for symbol:", symbol, "from:", dateFrom, "to:", dateTo);
      const data = await fetchTrades(symbol, dateFrom, dateTo);
      setTrades(data.trades);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setTrades([]); // 确保在错误情况下清空交易数据
      console.error("Error fetching trades for symbol:", symbol, err);
    } finally {
      setLoading(false);
    }
  }, [symbol, year]);

  const loadFundWeights = useCallback(async (symbol: string) => {
    // 如果symbol为空，不执行任何操作
    if (!symbol) return;
    
    try {
      setFundWeightsLoading(true);
      const weights = await fetchFundWeights(symbol);
      setFundWeights(weights);
    } catch (err) {
      console.error("Error fetching fund weights for symbol:", symbol, err);
      setFundWeights([]);
    } finally {
      setFundWeightsLoading(false);
    }
  }, []);

  const fetchPreviousClose = useCallback(async (symbol: string) => {
    // 如果symbol为空，不执行任何操作
    if (!symbol) return;
    
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
        setPrevCloseDate(data?.date || null);
      } else {
        setPreviousClose(null);
        setPrevCloseDate(null);
      }
    } catch (err) {
      console.error("Error fetching previous close:", err);
      setPreviousClose(null);
      setPrevCloseDate(null);
    } finally {
      setPrevCloseLoading(false);
    }
  }, []);

  const loadNote = useCallback(async (symbol: string) => {
    // 如果symbol为空，不执行任何操作
    if (!symbol) return;
    
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
    // 如果symbol为空，不执行任何操作
    if (!symbol) return;
    
    setNoteSaving(true);
    setNoteSaveSuccess(false);
    try {
      await saveNote(symbol, note);
      setNoteSaveSuccess(true);
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
    loadFundWeights(symbol); // 加载基金持仓权重
  }, [loadTrades, fetchPreviousClose, loadNote, loadGlobalNote, loadFundWeights, symbol, year]);

  // 处理点击下拉列表外部区域的逻辑
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(event.target as Node)) {
        setIsSymbolListOpen(false);
      }
    };

    if (isSymbolListOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSymbolListOpen]);

  // Load stock symbol order and descriptions from database on component mount
  useEffect(() => {
    const loadStockData = async () => {
      try {
        // 获取股票符号和描述信息
        const symbolsData = await fetchStockSymbols();
        
        if (symbolsData && symbolsData.length > 0) {
          // Sort symbols based on display_order
          const orderedSymbols = symbolsData
            .sort((a, b) => a.display_order - b.display_order)
            .map(item => item.symbol);
          
          setStockSymbols(orderedSymbols);
          
          // 设置默认symbol为display_order为0的股票
          const defaultSymbol = symbolsData.find(item => item.display_order === 0)?.symbol || orderedSymbols[0];
          setSymbol(defaultSymbol);
          
          // 获取描述信息（如果有的话）
          // 这里假设描述信息存储在另一个表或通过API获取
          // 暂时使用硬编码的描述，实际项目中应该从数据库获取
          const descriptions: Record<string, string> = {
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
          
          setStockDescriptions(descriptions);
        }
      } catch (err) {
        console.error("Error loading stock data:", err);
      }
    };

    loadStockData();
  }, []);

  const handleSymbolChange = (newSymbol: string) => {
    console.log("Selected symbol:", newSymbol);
    setSymbol(newSymbol);
    // 切换股票时将年份重置为所有年份
    setYear("all");
    // 选择股票后关闭列表
    setIsSymbolListOpen(false);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(e.target.value);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNote = e.target.value;
    setNote(newNote);
    
    // 清除之前的定时器
    if (noteDebounceRef.current) {
      clearTimeout(noteDebounceRef.current);
    }
    
    // 设置新的防抖定时器
    noteDebounceRef.current = setTimeout(() => {
      saveNoteHandler(symbol, newNote);
    }, 1000); // 1秒后自动保存
  };

  const toggleNoteExpand = () => {
    setIsNoteExpanded(!isNoteExpanded);
  };

  const handleGlobalNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newGlobalNote = e.target.value;
    setGlobalNote(newGlobalNote);
    
    // 清除之前的定时器
    if (globalNoteDebounceRef.current) {
      clearTimeout(globalNoteDebounceRef.current);
    }
    
    // 设置新的防抖定时器
    globalNoteDebounceRef.current = setTimeout(() => {
      saveGlobalNoteHandler(newGlobalNote);
    }, 1000); // 1秒后自动保存
  };

  const toggleGlobalNoteExpand = () => {
    setIsGlobalNoteExpanded(!isGlobalNoteExpanded);
  };

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, symbol: string) => {
    setDraggedSymbol(symbol);
    e.dataTransfer.effectAllowed = "move";
  };

  // 拖拽进入另一个元素
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, targetSymbol: string) => {
    e.preventDefault();
    if (!draggedSymbol || draggedSymbol === targetSymbol) return;
    
    // 更新股票顺序
    const newSymbols = [...stockSymbols];
    const draggedIndex = newSymbols.indexOf(draggedSymbol);
    const targetIndex = newSymbols.indexOf(targetSymbol);
    
    // 从原位置移除
    newSymbols.splice(draggedIndex, 1);
    // 插入到新位置
    newSymbols.splice(targetIndex, 0, draggedSymbol);
    
    setStockSymbols(newSymbols);
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedSymbol(null);
    // Save the new order to the database
    saveSymbolOrder();
  };

  // Save symbol order to database
  const saveSymbolOrder = async () => {
    setSymbolsSaving(true);
    try {
      const symbolsWithOrder = stockSymbols.map((symbol, index) => ({
        symbol,
        display_order: index
      }));
      
      await updateStockSymbolOrder(symbolsWithOrder);
    } catch (err) {
      console.error("Error saving symbol order:", err);
    } finally {
      setSymbolsSaving(false);
    }
  };

  // 切换股票列表展开/收起状态
  const toggleSymbolList = () => {
    setIsSymbolListOpen(!isSymbolListOpen);
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
                {(globalNoteSaving || globalNoteSaveSuccess) && (
                  <span className="py-2 px-3 bg-green-100 text-green-800 rounded">
                    {globalNoteSaving ? "保存中..." : "备注已自动保存"}
                  </span>
                )}
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
          <div className="w-32" ref={symbolDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">股票代码:</label>
            <div className="relative">
              {/* 显示当前选中的股票 */}
              <div 
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer flex justify-between items-center"
                onClick={toggleSymbolList}
              >
                <span>{symbol}</span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${isSymbolListOpen ? 'rotate-180' : ''}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* 可拖拽排序的股票列表（下拉形式） */}
              {isSymbolListOpen && (
                <div className="absolute z-10 mt-1 border border-gray-300 rounded shadow-lg bg-white w-full max-h-60 overflow-y-auto">
                  {stockSymbols.map((stockSymbol) => (
                    <div
                      key={stockSymbol}
                      draggable
                      onDragStart={(e) => handleDragStart(e, stockSymbol)}
                      onDragEnter={(e) => handleDragEnter(e, stockSymbol)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => handleSymbolChange(stockSymbol)}
                      className={`p-2 cursor-pointer ${
                        draggedSymbol === stockSymbol 
                          ? "bg-blue-100 opacity-50" 
                          : symbol === stockSymbol
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100"
                      }`}
                    >
                      <span className="font-medium">{stockSymbol}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {symbolsSaving && (
              <div className="text-xs text-gray-500 mt-1">保存中...</div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年份:</label>
            <select
              value={year}
              onChange={handleYearChange}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">所有年份</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
          </div>
          
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
              <span>最近收盘价 ({prevCloseDate}): {previousClose.toFixed(2)}</span>
            ) : (
              <span>无法获取最近收盘价</span>
            )}
          </div>
        </div>
        
        {/* 基金持仓分布移到下一行 */}
        <div className="mt-2">
          {fundWeightsLoading ? (
            <span className="text-gray-700">基金持仓数据加载中...</span>
          ) : fundWeights.length > 0 ? (
            <div className="text-gray-700">
              <span className="font-semibold">基金持仓分布:</span>
              <span className="ml-2">
                {fundWeights.map((fundWeight, index) => (
                  <span key={index}>
                    {fundWeight.fund}: {fundWeight.weight.toFixed(2)}%
                    {index < fundWeights.length - 1 && ", "}
                  </span>
                ))}
              </span>
            </div>
          ) : (
            <span className="text-gray-700">暂无基金持仓数据</span>
          )}
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
                  {stockDescriptions[symbol] || "暂无描述信息"}
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
                          {(noteSaving || noteSaveSuccess) && (
                            <span className="py-2 px-3 bg-green-100 text-green-800 rounded">
                              {noteSaving ? "保存中..." : "备注已自动保存"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {trades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>该年份没有交易数据</p>
                </div>
              ) : (
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
                          <td className="py-3 px-4 border-b border-gray-300">{trade.shares?.toLocaleString() || ""}</td>
                          <td className="py-3 px-4 border-b border-gray-300">{trade.etf_percent !== undefined ? trade.etf_percent.toFixed(2) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
          )}
        </>
      )}
    </div>
  );
}
