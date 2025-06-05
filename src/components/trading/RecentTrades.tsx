'use client';
import React, { useMemo } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface Trade {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

const RecentTrades: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { data, isLoading } = useSharedBinanceWebSocket();

  // Memoize the formatted trades to prevent re-calculation on every render
  const trades: Trade[] = useMemo(() => {
    if (!data?.trades) return [];
    return data.trades.map(trade => ({
      id: trade.t,
      price: parseFloat(trade.p),
      quantity: parseFloat(trade.q),
      time: trade.T,
      isBuyerMaker: trade.m,
    })).slice(0, 50); // Limit to latest 50 trades
  }, [data?.trades]);

  // Display a skeleton loader while the initial data is being fetched
  if (isLoading && trades.length === 0) {
    return (
      <div className="p-2 space-y-2 bg-muted rounded-md h-full">
        <SkeletonLoader className="w-full h-4" />
        <SkeletonLoader className="w-2/3 h-4" />
        <SkeletonLoader className="w-full h-4" />
      </div>
    );
  }

  return (
    // Ensure this component is a flex column that fills its parent's height
    <div className="h-full flex flex-col text-xs bg-muted">
      {/* Header Title */}
      <div className="flex-shrink-0 p-2 border-b border-border">
        <h2 className="font-medium text-sm text-foreground">Trades</h2>
      </div>

      {/* Column Headers */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 py-1 px-2 text-muted-foreground">
        <span>Price(USDT)</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>

      {/* Trades List - This will grow and scroll */}
      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {trades.map(trade => (
          <div key={trade.id} className="grid grid-cols-3 gap-4 px-2 py-0.5 font-mono">
            <div className={trade.isBuyerMaker ? 'text-red-500' : 'text-green-500'}>
              {trade.price.toFixed(2)}
            </div>
            <div className="text-right text-foreground">
              {trade.quantity.toFixed(4)}
            </div>
            <div className="text-right text-muted-foreground">
              {new Date(trade.time).toLocaleTimeString('en-GB', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;