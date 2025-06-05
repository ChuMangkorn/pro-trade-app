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
          // console.log(`[WS:${symbol}] Message received:`, parsedData.stream); // Log stream for brevity
          const { stream, data: message } = parsedData;

          if (stream.endsWith('@ticker')) {
            setData(prev => prev ? {
              ...prev,
              price: message.c,
              priceChangePercent: message.P,
              volume: message.v,
              quoteVolume: message.q,
              highPrice: message.h,
              lowPrice: message.l
            } : null);
          } else if (stream.endsWith('@depth20@100ms')) {
            setData(prev => prev ? {
              ...prev,
              bids: message.bids || prev.bids,
              asks: message.asks || prev.asks
            } : null);
          } else if (stream.endsWith('@trade')) {
            setData(prev => {
              if (!prev) return null;

              // Prevent adding a duplicate trade if the stream sends the same one twice
              if (prev.trades && prev.trades.find(t => t.t === message.t)) {
                return prev; // Return previous state, ignoring the duplicate
              }

              return {
                ...prev,
                trades: [
                  {
                    t: message.t,
                    p: message.p,
                    q: message.q,
                    T: message.T,
                    m: message.m
                  },
                  ...(prev.trades || []).slice(0, 49)
                ]
              };
            });
          }
        } catch (err) {
          console.error(`[WS:${symbol}] Error parsing message:`, err, 'Raw data:', event.data);
          setError('Failed to parse WebSocket message');
        }
      };

      ws.onerror = (event: Event) => {
        // The 'event' object for onerror is often not very descriptive.
        // More details usually come from the 'onclose' event that often follows.
        console.error(`[WS:${symbol}] WebSocket error event:`, event);
        setError('WebSocket connection error occurred. See console for details.');
        setIsConnected(false);
      };

      ws.onclose = (event: CloseEvent) => {
        console.log(`[WS:${symbol}] WebSocket closed. Code: ${event.code}, Reason: '${event.reason}', Was Clean: ${event.wasClean}`);
        setIsConnected(false);
        if (wsRef.current && wsRef.current.readyState === WebSocket.CLOSED && reconnectAttempt < 5) { // Ensure it's actually closed before trying to reconnect
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          console.log(`[WS:${symbol}] Attempting to reconnect in ${delay / 1000}s (attempt ${reconnectAttempt + 1}/5)`);
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
        // This cleanup function is called when the component unmounts or the symbol changes.
        // We prevent the automatic reconnect logic by nullifying the onclose handler before closing.
        if (wsRef.current) {
          console.log(`[WS:${symbol}] Intentionally closing WebSocket connection.`);
          wsRef.current.onclose = null;
          wsRef.current.onerror = null;
          wsRef.current.onopen = null;
          wsRef.current.onmessage = null;
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    } catch (err: any) {
      console.error(`[WS:${symbol}] Error in connect/setup phase:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to initialize connection: ${errorMessage}`);
      setIsLoading(false);
      return () => {};
    }
  }, [symbol, reconnectAttempt]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    const initializeConnection = async () => {
      // connect() is async and returns a promise that resolves to the cleanup function
      const potentialCleanup = await connect();
      if (typeof potentialCleanup === 'function') {
        cleanupFn = potentialCleanup;
      }
    };

    initializeConnection();

    return () => {
      if (cleanupFn) {
        cleanupFn();
      }
      // Also ensure wsRef.current is closed if cleanupFn wasn't set for some reason or if direct cleanup is needed
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        console.log(`[WS:${symbol}] useEffect cleanup: Forcing WebSocket close.`);
        wsRef.current.close();
        wsRef.current = null; // Important to nullify after close
      }
    };
  }, [connect, symbol]); // Added symbol to dependencies for explicit wsRef cleanup logging.

  return { data, isLoading, error, isConnected };
};