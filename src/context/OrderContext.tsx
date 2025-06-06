// src/context/OrderContext.tsx
'use client';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
} from 'react';

// Define the structure of an order/trade
export interface Order {
  id: number;
  time: string;
  symbol: string;
  type: 'Limit' | 'Market' | 'Stop-limit';
  side: 'Buy' | 'Sell';
  price: number;
  amount: number;
  total: number;
}

// Define the shape of the context value
interface OrderContextValue {
  openOrders: Order[];
  tradeHistory: Order[];
  placeOrder: (order: Omit<Order, 'id' | 'time'>) => void;
  cancelOrder: (orderId: number) => void;
}

// Create the context
const OrderContext = createContext<OrderContextValue | undefined>(undefined);

// Define props for the provider
interface OrderProviderProps {
  children: ReactNode;
}

// Create the provider component
export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Order[]>([]);
  const [orderIdCounter, setOrderIdCounter] = useState(1);
  const fillTimer = useRef<NodeJS.Timeout | null>(null);

  const placeOrder = useCallback((newOrderData: Omit<Order, 'id' | 'time'>) => {
    const newOrder: Order = {
      ...newOrderData,
      id: orderIdCounter,
      time: new Date().toLocaleString('en-GB'),
    };
    
    setOrderIdCounter(prev => prev + 1);
    setOpenOrders(prev => [newOrder, ...prev]);

    // Simulate order fill after a delay (e.g., 3-5 seconds)
    fillTimer.current = setTimeout(() => {
      setOpenOrders(prev => prev.filter(o => o.id !== newOrder.id));
      setTradeHistory(prev => [{...newOrder, type: 'Limit'}, ...prev]); // Assume it filled as a limit order for history
    }, 3000 + Math.random() * 2000);

  }, [orderIdCounter]);

  useEffect(() => {
    return () => {
      if (fillTimer.current) {
        clearTimeout(fillTimer.current);
      }
    };
  }, []);

  const cancelOrder = useCallback((orderId: number) => {
    setOpenOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const value = { openOrders, tradeHistory, placeOrder, cancelOrder };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook for easy consumption
export const useOrders = (): OrderContextValue => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};