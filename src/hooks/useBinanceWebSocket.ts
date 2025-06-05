'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

interface BinanceWebSocketData {
  price: string;
  priceChangePercent: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
  bids: [string, string][];
  asks: [string, string][];
  trades: Array<{
    t: number;  // trade ID
    p: string;  // price
    q: string;  // quantity
    T: number;  // timestamp
    m: boolean; // is buyer maker
  }>;
}

interface UseBinanceWebSocketReturn {
  data: BinanceWebSocketData | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

const fetchInitialData = async (symbol: string): Promise<Partial<BinanceWebSocketData>> => {
  try {
    const [tickerRes, depthRes] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
      fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=20`)
    ]);

    const [tickerData, depthData] = await Promise.all([
      tickerRes.json(),
      depthRes.json()
    ]);

    return {
      price: tickerData.lastPrice,
      priceChangePercent: tickerData.priceChangePercent,
      volume: tickerData.volume,
      quoteVolume: tickerData.quoteVolume,
      highPrice: tickerData.highPrice,
      lowPrice: tickerData.lowPrice,
      bids: depthData.bids,
      asks: depthData.asks,
      trades: []
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    throw error;
  }
};

export const useBinanceWebSocket = (symbol: string): UseBinanceWebSocketReturn => {
  const [data, setData] = useState<BinanceWebSocketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // Fetch initial data
      const initialData = await fetchInitialData(symbol);
      setData(initialData as BinanceWebSocketData);
      setIsLoading(false);

      const lowerSymbol = symbol.toLowerCase();
      const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${lowerSymbol}@ticker/${lowerSymbol}@depth20@100ms/${lowerSymbol}@trade`);

      ws.onopen = () => {
        console.log(`[WS:${symbol}] WebSocket connected`);
        setIsConnected(true);
        setError(null);
        setReconnectAttempt(0);
      };

      ws.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          const { stream, data: message } = parsedData;

          if (stream.endsWith('@ticker')) {
            setData(prev => prev ? { ...prev, price: message.c, priceChangePercent: message.P, volume: message.v, quoteVolume: message.q, highPrice: message.h, lowPrice: message.l } : null);
          } else if (stream.endsWith('@depth20@100ms')) {
            setData(prev => prev ? { ...prev, bids: message.bids || prev.bids, asks: message.asks || prev.asks } : null);
          } else if (stream.endsWith('@trade')) {
            setData(prev => {
              if (!prev || (prev.trades && prev.trades.find(t => t.t === message.t))) return prev;
              return { ...prev, trades: [{ t: message.t, p: message.p, q: message.q, T: message.T, m: message.m }, ...prev.trades.slice(0, 49)] };
            });
          }
        } catch (err) {
          console.error(`[WS:${symbol}] Error parsing message:`, err, 'Raw data:', event.data);
          setError('Failed to parse WebSocket message');
        }
      };

      ws.onerror = (event: Event) => {
        console.error(`[WS:${symbol}] WebSocket error event:`, event);
        setError('WebSocket connection error occurred. See console for details.');
        setIsConnected(false);
      };

      ws.onclose = (event: CloseEvent) => {
        console.log(`[WS:${symbol}] WebSocket closed. Code: ${event.code}, Reason: '${event.reason}', Was Clean: ${event.wasClean}`);
        setIsConnected(false);
        if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSED && reconnectAttempt < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
            connect();
          }, delay);
        } else {
          setError('Failed to reconnect after multiple attempts');
        }
      };

      wsRef.current = ws;

      return () => {
        if (wsRef.current) {
          wsRef.current.onclose = null;
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    } catch (err: unknown) {
      console.error(`[WS:${symbol}] Error in connect/setup phase:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to initialize connection: ${errorMessage}`);
      setIsLoading(false);
    }
  }, [symbol, reconnectAttempt]);

  useEffect(() => {
    let cleanup: (() => void) | void;
    const init = async () => {
      cleanup = await connect();
    };
    init();

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
    };
  }, [connect, symbol]);

  return { data, isLoading, error, isConnected };
};
