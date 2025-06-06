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

// 📍 1. สร้างตัวแปรสำหรับเก็บ Cache และเวลาที่ดึงข้อมูลล่าสุด
// การประกาศนอกฟังก์ชัน GET ทำให้ตัวแปรยังคงอยู่ข้าม requests (ใน server instance เดียวกัน)
let cachedSymbols: string[] = [];
let lastFetchTimestamp: number = 0;
const CACHE_DURATION_MS = 1 * 60 * 60 * 1000; // 1 ชั่วโมง

export async function GET() {
  const now = Date.now();

  // 📍 2. ตรวจสอบ Cache ก่อน: ถ้ามีข้อมูลและยังไม่หมดอายุ ให้ส่งข้อมูลจาก Cache กลับไปทันที
  if (cachedSymbols.length > 0 && (now - lastFetchTimestamp < CACHE_DURATION_MS)) {
    console.log('[API /api/symbols] Returning symbols from CACHE.');
    return NextResponse.json(cachedSymbols);
  }

  console.log('[API /api/symbols] Cache empty or expired. Fetching from Binance...');
  try {
    const response = await fetch('https://api.binance.com/api/v3/exchangeInfo', {
      // cache: 'no-store' เพื่อให้แน่ใจว่าเราควบคุมการ cache เอง
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
    
    // 📍 3. อัปเดต Cache ด้วยข้อมูลใหม่
    cachedSymbols = tradingSymbols;
    lastFetchTimestamp = now;

    console.log(`[API /api/symbols] Fetched and cached ${tradingSymbols.length} symbols.`);
    return NextResponse.json(tradingSymbols);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[API /api/symbols] Error:', errorMessage);
    
    // หากเกิด Error แต่เรายังมี Cache เก่าอยู่ ให้ส่ง Cache เก่ากลับไปก่อน ดีกว่าไม่มีข้อมูลเลย
    if (cachedSymbols.length > 0) {
      console.warn('[API /api/symbols] Fetch failed. Returning stale (old) cache.');
      return NextResponse.json(cachedSymbols);
    }
    
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}