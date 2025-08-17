import { createClient } from '@supabase/supabase-js';

// Supabase project configuration from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate that Supabase environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL and Anon Key must be set in environment variables');
}

// Create a single supabase client for interacting with the database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Service class for interacting with the daily_prices table in Supabase
 */
export class SupabaseService {
  /**
   * Fetch daily prices for a specific symbol
   * @param symbol The stock symbol to fetch prices for
   * @returns Array of daily prices
   */
  static async getDailyPrices(symbol: string) {
    const { data, error } = await supabase
      .from('daily_prices')
      .select('*')
      .eq('symbol', symbol)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching daily prices: ${error.message}`);
    }

    return data;
  }

  /**
   * Fetch daily prices for a specific symbol within a date range
   * @param symbol The stock symbol to fetch prices for
   * @param startDate Start date for the price data
   * @param endDate End date for the price data
   * @returns Array of daily prices within the specified date range
   */
  static async getDailyPricesByDateRange(symbol: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('daily_prices')
      .select('*')
      .eq('symbol', symbol)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching daily prices by date range: ${error.message}`);
    }

    return data;
  }

  /**
   * Insert or update daily prices
   * @param prices Array of price objects to insert or update
   * @returns The inserted or updated records
   */
  static async upsertDailyPrices(prices: any[]) {
    const { data, error } = await supabase
      .from('daily_prices')
      .upsert(prices, {
        onConflict: 'symbol,date'
      })
      .select();

    if (error) {
      throw new Error(`Error upserting daily prices: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete daily prices for a specific symbol
   * @param symbol The stock symbol to delete prices for
   * @returns Deletion result
   */
  static async deleteDailyPrices(symbol: string) {
    const { data, error } = await supabase
      .from('daily_prices')
      .delete()
      .eq('symbol', symbol);

    if (error) {
      throw new Error(`Error deleting daily prices: ${error.message}`);
    }

    return data;
  }

  /**
   * Get note for a specific symbol
   * @param symbol The stock symbol to get note for
   * @returns Symbol note object or null if not found
   */
  static async getSymbolNote(symbol: string) {
    const { data, error } = await supabase
      .from('symbol_notes')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Record not found"
      throw new Error(`Error fetching symbol note: ${error.message}`);
    }

    return data || null;
  }

  /**
   * Upsert (insert or update) note for a specific symbol
   * @param symbol The stock symbol to upsert note for
   * @param note The note content
   * @returns The upserted symbol note object
   */
  static async upsertSymbolNote(symbol: string, note: string) {
    const { data, error } = await supabase
      .from('symbol_notes')
      .upsert({ symbol, note }, {
        onConflict: 'symbol'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error upserting symbol note: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete note for a specific symbol
   * @param symbol The stock symbol to delete note for
   * @returns Deletion result
   */
  static async deleteSymbolNote(symbol: string) {
    const { data, error } = await supabase
      .from('symbol_notes')
      .delete()
      .eq('symbol', symbol);

    if (error) {
      throw new Error(`Error deleting symbol note: ${error.message}`);
    }

    return data;
  }
  
  /**
   * Get all stock symbols with their display order
   * @returns Array of stock symbols ordered by display_order
   */
  static async getStockSymbols() {
    const { data, error } = await supabase
      .from('stock_symbols')
      .select('symbol, display_order')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Error fetching stock symbols: ${error.message}`);
    }

    return data;
  }

  /**
   * Update stock symbols display order
   * @param symbols Array of symbols with their new display order
   * @returns Updated symbols
   */
  static async updateStockSymbolOrder(symbols: { symbol: string; display_order: number }[]) {
    const { data, error } = await supabase
      .from('stock_symbols')
      .upsert(symbols, {
        onConflict: 'symbol'
      })
      .select();

    if (error) {
      throw new Error(`Error updating stock symbol order: ${error.message}`);
    }

    return data;
  }
}