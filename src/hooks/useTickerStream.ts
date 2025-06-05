'use client';
import { useState, useEffect, useRef } from 'react';

// Structure of a single ticker from the !miniTicker@arr stream
export interface MiniTicker {
  s: string; // Symbol (e.g., "BTCUSDT")
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Total traded base asset volume
  q: string; // Total traded quote asset volume
}

// The hook returns a map for quick lookups: { "BTCUSDT": MiniTicker, ... }
export type TickerData = Record<string, MiniTicker>;

interface UseTickerStreamReturn {
  tickers: TickerData;
  isConnected: boolean;
  error: string | null;
}

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';

export const useTickerStream = (symbols: string[]): UseTickerStreamReturn => {
  const [tickers, setTickers] = useState<TickerData>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // We only care about the symbols passed in. This creates an efficient lookup set.
    const symbolSet = new Set(symbols);

    const connect = () => {
      wsRef.current = new WebSocket(BINANCE_WS_URL);

      wsRef.current.onopen = () => {
        console.log('[TickerStream] WebSocket connected.');
        setIsConnected(true);
        setError(null);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const newTickers: MiniTicker[] = JSON.parse(event.data);
          // Update state only for the tickers we are interested in.
          setTickers(prev => {
            const updated = { ...prev };
            let hasChanged = false;
            for (const ticker of newTickers) {
              if (symbolSet.has(ticker.s)) {
                updated[ticker.s] = ticker;
                hasChanged = true;
              }
            }
            return hasChanged ? updated : prev;
          });
        } catch (err) {
          console.error('[TickerStream] Failed to parse message:', err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('[TickerStream] WebSocket error:', event);
        setError('Ticker stream connection failed.');
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('[TickerStream] WebSocket closed. Reconnecting...');
        setIsConnected(false);
        // Simple immediate reconnect logic. For production, you might want exponential backoff.
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        console.log('[TickerStream] Intentionally closing WebSocket connection.');
        // Nullify handlers to prevent reconnect on intentional close.
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbols]); // The symbols array changing will trigger a re-creation of the symbolSet, but not re-connect.

  return { tickers, isConnected, error };
}; 