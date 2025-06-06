'use client';
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import { TradeData as WebSocketTradeData } from '@/hooks/useBinanceWebSocket';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface ProcessedTrade {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

// Create a new component for the trade row to manage its own flash state
const TradeRow: React.FC<{ trade: ProcessedTrade, isNew: boolean }> = ({ trade, isNew }) => {
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    if (isNew) {
      // Apply flash class based on trade direction
      setFlashClass(trade.isBuyerMaker ? 'flash-sell' : 'flash-buy');

      // Remove the class after the animation duration
      const timer = setTimeout(() => {
        setFlashClass('');
      }, 700); // Match CSS animation duration

      return () => clearTimeout(timer);
    }
  }, [isNew, trade.isBuyerMaker]);

  return (
    <div className={`grid grid-cols-3 gap-4 px-2 py-0.5 font-mono ${flashClass}`}>
      <div className={trade.isBuyerMaker ? 'text-red-500' : 'text-green-500'}>
        {trade.price.toFixed(2)}
      </div>
      <div className="text-right text-foreground">
        {trade.quantity.toFixed(4)}
      </div>
      <div className="text-right text-muted-foreground">
        {new Date(trade.time).toLocaleTimeString('en-GB')}
      </div>
    </div>
  );
};


const RecentTrades: React.FC = () => {
  const { data, isLoading } = useSharedBinanceWebSocket();
  const latestTradeIdRef = useRef<number | null>(null);

  const trades: ProcessedTrade[] = useMemo(() => {
    if (!data?.recentTrades) return [];
    return data.recentTrades.map((trade: WebSocketTradeData) => ({
      id: trade.t,
      price: parseFloat(trade.p),
      quantity: parseFloat(trade.q),
      time: trade.T,
      isBuyerMaker: trade.m,
    })).slice(0, 30); // Limit to latest 30 trades
  }, [data?.recentTrades]);

  useEffect(() => {
    if (trades.length > 0) {
      latestTradeIdRef.current = trades[0].id;
    }
  }, [trades]);

  if (isLoading && trades.length === 0) {
    return (<div className="p-2 space-y-1 bg-muted rounded-md h-full"><SkeletonLoader className="w-full h-4" /><SkeletonLoader className="w-2/3 h-4" /><SkeletonLoader className="w-full h-4" /><SkeletonLoader className="w-1/2 h-4" /></div>);
  }

  return (
    <div className="h-full flex flex-col text-xs bg-muted">
      <div className="flex-shrink-0 p-2 border-b border-border">
        <h2 className="font-medium text-sm text-foreground">Trades</h2>
      </div>

      <div className="flex-shrink-0 grid grid-cols-3 gap-4 py-1 px-2 text-muted-foreground">
        <span>Price(USDT)</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {trades.map((trade, index) => (
          <TradeRow
            key={trade.id}
            trade={trade}
            // A trade is "new" if it's the very first one in the list and its ID is different from the last known "latest" ID
            isNew={index === 0 && latestTradeIdRef.current !== null && trade.id > latestTradeIdRef.current}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;