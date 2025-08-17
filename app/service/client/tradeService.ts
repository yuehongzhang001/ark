
export interface Trade {
  date: string;
  fund: string;
  direction: string;
  shares: number;
  etf_percent: number;
  close?: number;
  symbol?: string; 
}

interface TradesResponse {
  symbol: string;
  date_from: string;
  date_to: string;
  trades: Trade[];
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