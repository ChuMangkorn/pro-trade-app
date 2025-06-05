'use client';
import { useState, useEffect, useRef } from 'react';

// --- Interfaces for our data structures ---
interface KlineData {
  t: number; // Kline start time (ms)
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  c: string; // Close price
}

interface TradeData {
    t: number; // trade ID
    p: string; // price
    q: string; // quantity
    T: number; // timestamp
    m: boolean; // is buyer maker
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
  trades: TradeData[];
  kline?: KlineData;
}

interface UseBinanceWebSocketReturn {
  data: BinanceWebSocketData | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

// --- The Hook ---
export const useBinanceWebSocket = (symbol: string): UseBinanceWebSocketReturn => {
  const [data, setData] = useState<BinanceWebSocketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const connect = async () => {
      setIsLoading(true);
      setData(null);
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
            trades: [],
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
        `${lowerSymbol}@ticker`,
        `${lowerSymbol}@depth20@100ms`,
        `${lowerSymbol}@trade`,
        `${lowerSymbol}@kline_1m`
      ].join('/');

      // **** THIS IS THE CORRECTED LINE ****
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
            console.log(`[WS:${symbol}] WebSocket connected.`);
            setIsConnected(true);
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;

        const message = JSON.parse(event.data);
        
        // Add a check to ensure message.stream exists
        if (message && message.stream) {
            const stream = message.stream;
            const streamData = message.data;

            if (stream.endsWith('@ticker')) {
            setData(prev => prev ? { ...prev, price: streamData.c, priceChangePercent: streamData.P } : null);
            } else if (stream.endsWith('@depth20@100ms')) {
            setData(prev => prev ? { ...prev, bids: streamData.bids, asks: streamData.asks } : null);
            } else if (stream.endsWith('@trade')) {
            setData(prev => prev ? { ...prev, trades: [streamData, ...prev.trades].slice(0, 50) } : null);
            } else if (stream.endsWith('@kline_1m')) {
            setData(prev => prev ? { ...prev, kline: { t: streamData.k.t / 1000, o: streamData.k.o, h: streamData.k.h, l: streamData.k.l, c: streamData.k.c } } : null);
            }
        }
      };

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

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

  return { data, isLoading, error, isConnected };
};