'use client';
import { useState, useEffect, useRef } from 'react';

interface KlineData {
  t: number;
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
}

export interface TradeData { // Exporting for PriceChart
  E: number; // Event time
  T: number; // Trade time (timestamp in milliseconds)
  s: string; // Symbol
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  m: boolean; // Is the buyer the maker?
  // Other fields like 'b' (buyer order ID), 'a' (seller order ID) exist but might not be needed for chart
}

interface BinanceWebSocketData {
  price: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
  bids: [string, string][];
  asks: [string, string][];
  recentTrades: TradeData[]; // For the "Recent Trades" component
  kline?: KlineData;
  latestTrade?: TradeData; // For 1s chart aggregation
}

interface UseBinanceWebSocketReturn {
  data: BinanceWebSocketData | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

export const useBinanceWebSocket = (symbol: string): UseBinanceWebSocketReturn => {
  const [data, setData] = useState<BinanceWebSocketData | null>(null);
  // ... (isLoading, error, isConnected, wsRef as before)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);


  useEffect(() => {
    let isMounted = true;

    const connect = async () => {
      setIsLoading(true);
      setData(null); // Reset data on new connection/symbol
      setError(null);

      try {
        const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
        if (!tickerRes.ok) throw new Error('Failed to fetch initial ticker data');
        const tickerData = await tickerRes.json();

        if (isMounted) {
          setData({
            price: tickerData.lastPrice,
            priceChangePercent: tickerData.priceChangePercent,
            volume: tickerData.volume,
            quoteVolume: tickerData.quoteVolume,
            highPrice: tickerData.highPrice,
            lowPrice: tickerData.lowPrice,
            bids: [],
            asks: [],
            recentTrades: [], // Initialize recentTrades
            // kline and latestTrade undefined initially
          });
        }
      } catch (e) {
        if (isMounted) setError(e instanceof Error ? e.message : 'Failed to fetch initial data');
      } finally {
        if (isMounted) setIsLoading(false);
      }

      if (wsRef.current) {
        wsRef.current.close();
      }

      const lowerSymbol = symbol.toLowerCase();
      const streams = [
        `${lowerSymbol}@ticker`,        // For price, priceChangePercent, 24h H/L/Vol
        `${lowerSymbol}@depth20@100ms`, // For order book
        `${lowerSymbol}@trade`,         // For recent trades component AND for 1s kline aggregation
        `${lowerSymbol}@kline_1m`       // For 1m kline updates (can be used for other timeframes too)
      ].join('/');

      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;

      ws.onopen = () => { /* ... as before ... */
        if (isMounted) {
          console.log(`[WS:${symbol}] WebSocket connected.`);
          setIsConnected(true);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        const message = JSON.parse(event.data);

        if (message && message.stream) {
          const stream = message.stream;
          const streamData = message.data;

          if (stream.endsWith('@ticker')) {
            setData(prev => prev ? {
              ...prev,
              price: streamData.c,
              priceChangePercent: streamData.P,
              highPrice: streamData.h,
              lowPrice: streamData.l,
              volume: streamData.v,
              quoteVolume: streamData.q,
            } : null);
          } else if (stream.endsWith('@depth20@100ms')) {
            setData(prev => prev ? { ...prev, bids: streamData.bids, asks: streamData.asks } : null);
          } else if (stream.endsWith('@trade')) {
            // For RecentTrades component and also for 1s chart aggregation
            setData(prev => {
              if (!prev) return null;
              const newRecentTrades = [streamData, ...(prev.recentTrades || [])].slice(0, 50);
              return { ...prev, recentTrades: newRecentTrades, latestTrade: streamData as TradeData };
            });
          } else if (stream.endsWith('@kline_1m')) {
            if (streamData && streamData.k) {
              setData(prev => prev ? {
                ...prev,
                kline: {
                  t: streamData.k.t / 1000,
                  o: streamData.k.o,
                  h: streamData.k.h,
                  l: streamData.k.l,
                  c: streamData.k.c,
                  v: streamData.k.v,
                }
              } : null);
            }
          }
        }
      };
      // ... onerror, onclose as before ...
      ws.onerror = (event) => {
        if (isMounted) {
          console.error('[WS] WebSocket error:', event);
          setError('WebSocket connection error');
          setIsConnected(false);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          console.log('[WS] WebSocket closed.');
          setIsConnected(false);
        }
      };
    };

    connect();

    return () => { /* ... cleanup as before ... */
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol]);

  return { data, isLoading, error, isConnected };
};