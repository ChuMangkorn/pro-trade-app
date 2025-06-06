import { NextRequest, NextResponse } from 'next/server';

/**
 * Maps frontend-friendly interval strings to Binance API interval strings.
 */
function mapInterval(interval: string): string {
  const mapping: { [key: string]: string } = {
    '1m': '1m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
    '1M': '1M',
  };
  return mapping[interval] || interval; // Fallback for any other value
}

type BinanceKline = [number, string, string, string, string, string, number, string, number, string, string, string];

/**
 * Handles GET requests to fetch kline data. This is a robust version with timeout and error handling.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');

  // For now, to ensure stability, we will treat '1s' requests as '1m' to prevent errors.
  // The logic for 1s aggregation can be re-added later once the main functionality is stable.
  const effectiveInterval = interval === '1s' ? '1m' : interval;

  if (!symbol || !effectiveInterval) {
    return NextResponse.json({ error: 'Symbol and interval are required' }, { status: 400 });
  }

  const mappedInterval = mapInterval(effectiveInterval);
  const limit = '1000';
  const binanceUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${mappedInterval}&limit=${limit}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

  try {
    const response = await fetch(binanceUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to read the error body from Binance
      const errorBodyText = await response.text();
      let errorMsg = `Binance API request failed with status ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBodyText);
        errorMsg = errorJson.msg || errorMsg;
      } catch (e) {
        // If the body isn't JSON, use the text as part of the error
        console.error("Binance returned a non-JSON error body:", errorBodyText);
      }
      throw new Error(errorMsg);
    }

    const klines: BinanceKline[] = await response.json();
    
    const formattedData = klines.map(k => ({
      time: k[0] / 1000,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    return NextResponse.json(formattedData);

  } catch (error: unknown) {
    clearTimeout(timeoutId);
    let errorMessage = 'An unknown server error occurred';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request to Binance API timed out after 10 seconds.';
        statusCode = 504; // Gateway Timeout
      } else {
        errorMessage = error.message;
      }
    }
    
    console.error(`[API /api/klines] FINAL ERROR HANDLER: ${errorMessage}`);
    // ALWAYS return a JSON response
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}