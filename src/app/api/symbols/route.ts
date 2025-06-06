import { NextResponse } from 'next/server';

interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
}

interface BinanceExchangeInfo {
  symbols: BinanceSymbol[];
}

// Cache variables to avoid refetching on every request
let cachedSymbols: string[] = [];
let lastFetchTimestamp: number = 0;
const CACHE_DURATION_MS = 1 * 60 * 60 * 1000; // 1 hour

export async function GET() {
  const now = Date.now();

  // Return cached symbols if still fresh
  if (cachedSymbols.length > 0 && (now - lastFetchTimestamp < CACHE_DURATION_MS)) {
    console.log('[API /api/symbols] Returning symbols from CACHE.');
    return NextResponse.json(cachedSymbols);
  }

  console.log('[API /api/symbols] Cache empty or expired. Fetching from Binance...');
  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      // cache: 'no-store' ensures we control caching behavior
      cache: 'no-store', 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from Binance. Status: ${response.status}`);
    }

    const data: BinanceExchangeInfo = await response.json();
    
    const tradingSymbols = data.symbols
      .filter(s => s.status === 'TRADING' && (s.quoteAsset === 'USDT' || s.quoteAsset === 'BTC' || s.quoteAsset === 'ETH' || s.quoteAsset === 'BNB'))
      .map(s => s.symbol)
      .sort();
    
    // Update cache with fresh data
    cachedSymbols = tradingSymbols;
    lastFetchTimestamp = now;

    console.log(`[API /api/symbols] Fetched and cached ${tradingSymbols.length} symbols.`);
    return NextResponse.json(tradingSymbols);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API /api/symbols] Error:', errorMessage);
    
    // If fetching fails but we have cached data, return the stale cache instead of nothing
    if (cachedSymbols.length > 0) {
      console.warn('[API /api/symbols] Fetch failed. Returning stale (old) cache.');
      return NextResponse.json(cachedSymbols);
    }
    
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}