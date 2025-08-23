export interface Trade {
  date: string;
  fund: string;
  direction: string;
  shares: number;
  etf_percent: number;
  close?: number;
  symbol?: string; 
}

export interface FundWeight {
  fund: string;
  weight: number;
}

export interface StockSymbol {
  symbol: string;
  display_order: number;
}

interface TradesResponse {
  symbol: string;
  date_from: string;
  date_to: string;
  trades: Trade[];
}

interface FundOwnershipResponse {
  symbol: string;
  data: {
    date: string;
    ownership: FundWeight[];
  }[];
}

/**
 * Fetch all stock symbols
 * @returns Array of stock symbols with display order
 */
export async function fetchStockSymbols(): Promise<StockSymbol[]> {
  const response = await fetch('/api/symbols');
  if (!response.ok) {
    throw new Error(`Failed to fetch stock symbols: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Update stock symbols display order
 * @param symbols Array of stock symbols with new display order
 * @returns Updated stock symbols
 */
export async function updateStockSymbolOrder(symbols: StockSymbol[]): Promise<StockSymbol[]> {
  const response = await fetch('/api/symbols', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(symbols),
  });

  if (!response.ok) {
    throw new Error(`Failed to update stock symbol order: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch trades data with caching support
 * @param symbol Stock symbol
 * @param date_from Start date (optional)
 * @param date_to End date (optional)
 * @returns Trades data with close prices
 */
export async function fetchTrades(
  symbol: string = "TSLA",
  date_from?: string,
  date_to?: string
): Promise<TradesResponse> {
  console.log(`Fetching trades for ${symbol}`);
  let url = `/api/trades?symbol=${symbol}`;
  
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch fund weights for a specific symbol
 * @param symbol Stock symbol
 * @returns Fund weights data
 */
export async function fetchFundWeights(symbol: string): Promise<FundWeight[]> {
  const response = await fetch(`/api/weight?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch fund weights: ${response.status} ${response.statusText}`);
  }
  
  const data: FundOwnershipResponse = await response.json();
  
  // 获取最新的数据（通常是数组中的第一个元素）
  if (data.data && data.data.length > 0) {
    return data.data[0].ownership;
  }
  
  return [];
}

/**
 * Fetch note for a specific symbol
 * @param symbol Stock symbol
 * @returns Note for the symbol
 */
export async function fetchNote(symbol: string): Promise<{ symbol: string; note: string }> {
  const response = await fetch(`/api/notes?symbol=${symbol}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch note: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Save note for a specific symbol
 * @param symbol Stock symbol
 * @param note Note content to save
 * @returns Saved note
 */
export async function saveNote(symbol: string, note: string): Promise<{ symbol: string; note: string }> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ symbol, note }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save note: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Delete note for a specific symbol
 * @param symbol Stock symbol
 * @returns Deletion result
 */
export async function deleteNote(symbol: string): Promise<{ message: string }> {
  const response = await fetch(`/api/notes?symbol=${symbol}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete note: ${response.status} ${response.statusText}`);
  }
  return response.json();
}