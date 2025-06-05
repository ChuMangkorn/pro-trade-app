import { NextRequest, NextResponse } from 'next/server';

// Helper function to map our timeframe notation to Binance's interval notation
function mapInterval(interval: string): string {
  const mapping: { [key: string]: string } = {
    '1': '1m',
    '5': '5m',
    '15': '15m',
    '30': '30m',
    '60': '1h', // 1 hour
    '240': '4h', // 4 hours
    'D': '1d', // 1 day
    'W': '1w', // 1 week
    'M': '1M', // 1 month (Note: Binance might use '1M' for 1 Month)
  };
  return mapping[interval] || interval; // Fallback to the original if no mapping found
}

// Define the structure of a single kline from Binance API
type BinanceKline = [number, string, string, string, string, string, number, string, number, string, string, string];

// Define a type for Binance API error responses
interface BinanceError {
  msg: string;
  code: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit') || '500';

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Symbol and interval are required' }, { status: 400 });
  }

  const mappedInterval = mapInterval(interval);

  try {
    const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;
    
    const response = await fetch(binanceUrl);
    if (!response.ok) {
      const errorData: BinanceError = await response.json();
      console.error('Binance API Error:', errorData);
      return NextResponse.json({ error: `Failed to fetch data from Binance: ${errorData.msg || response.statusText}` }, { status: response.status });
    }

    const data: BinanceKline[] = await response.json();

    const formattedData = data.map(kline => ({
      time: kline[0] / 1000,
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));

    return NextResponse.json(formattedData);
  } catch (error: unknown) {
    console.error('Error fetching klines:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
