import { NextResponse } from 'next/server';
import { SupabaseService } from '../services/supabaseService';

export async function GET() {
  try {
    const symbols = await SupabaseService.getStockSymbols();
    console.log('Symbols:', symbols);
    return NextResponse.json(symbols);
  } catch (error: any) {
    console.error('Error fetching stock symbols:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock symbols' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const symbols = await request.json();
    
    // Validate input
    if (!Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Invalid input: expected an array of symbols with display_order' },
        { status: 400 }
      );
    }
    
    // Check that each item has the required properties
    for (const item of symbols) {
      if (typeof item.symbol !== 'string' || typeof item.display_order !== 'number') {
        return NextResponse.json(
          { error: 'Invalid input: each item must have a string symbol and numeric display_order' },
          { status: 400 }
        );
      }
    }
    
    const updatedSymbols = await SupabaseService.updateStockSymbolOrder(symbols);
    return NextResponse.json(updatedSymbols);
  } catch (error: any) {
    console.error('Error updating stock symbol order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update stock symbol order' },
      { status: 500 }
    );
  }
}