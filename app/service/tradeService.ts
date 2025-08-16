export interface Trade {
  date: string;
  fund: string;
  direction: string;
  shares: number;
  etf_percent: number;
  close?: number;
}

interface TradesResponse {
  symbol: string;
  date_from: string;
  date_to: string;
  trades: Trade[];
}

export async function fetchTrades(
  symbol: string = "TSLA",
  date_from?: string,
  date_to?: string
): Promise<TradesResponse> {
  let url = `/api/trades?symbol=${symbol}`;
  
  if (date_from) url += `&date_from=${date_from}`;
  if (date_to) url += `&date_to=${date_to}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}