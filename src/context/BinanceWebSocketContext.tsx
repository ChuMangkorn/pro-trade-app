'use client';
import React, { createContext, useContext, ReactNode } from 'react';
import { debounce } from 'lodash';
import { useBinanceWebSocket } from '@/hooks/useBinanceWebSocket';

// Define the shape of the data provided by the context
interface BinanceWebSocketContextValue {
  data: ReturnType<typeof useBinanceWebSocket>['data'];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

// Create the context with a default undefined value
const BinanceWebSocketContext = createContext<BinanceWebSocketContextValue | undefined>(undefined);

// Define props for the provider component
interface BinanceWebSocketProviderProps {
  children: ReactNode;
  symbol: string;
}

// Create the provider component
export const BinanceWebSocketProvider: React.FC<BinanceWebSocketProviderProps> = ({ children, symbol }) => {
  const webSocketData = useBinanceWebSocket(symbol);

  return (
    <BinanceWebSocketContext.Provider value={webSocketData}>
      {children}
    </BinanceWebSocketContext.Provider>
  );
};

// Create a custom hook for easy consumption of the context
export const useSharedBinanceWebSocket = (): BinanceWebSocketContextValue => {
  const context = useContext(BinanceWebSocketContext);
  if (context === undefined) {
    throw new Error('useSharedBinanceWebSocket must be used within a BinanceWebSocketProvider');
  }
  return context;
}; 