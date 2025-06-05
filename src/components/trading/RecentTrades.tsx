'use client';
import React, { useMemo } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import Flashable from '@/components/common/Flashable';

interface RecentTradesProps {
  symbol: string;
}

interface Trade {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

const RecentTrades: React.FC<RecentTradesProps> = ({ symbol }) => {
  const { data, isLoading, error, isConnected } = useSharedBinanceWebSocket();

  const trades = useMemo(() => {
    if (!data?.trades) return [];

    return data.trades.map(trade => ({
      id: trade.t,
      price: parseFloat(trade.p),
      quantity: parseFloat(trade.q),
      time: trade.T,
      isBuyerMaker: trade.m,
    })).slice(0, 50);
  }, [data?.trades]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <SkeletonLoader className="w-full h-8" />
        <SkeletonLoader className="w-full h-8" />
        <SkeletonLoader className="w-full h-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        {error}
      </div>
    );
  }

  const renderTrade = (trade: Trade) => {
    const date = new Date(trade.time);
    const formattedTime = date.toLocaleTimeString();
    const formattedQuantity = trade.quantity.toFixed(4);
    const formattedPrice = trade.price.toFixed(2);

    return (
      <div
        key={`${trade.id}-${trade.time}`}
        className="flex items-center justify-between py-1 px-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        <div className="flex-1">
          <Flashable value={trade.price} flashKey={trade.id}>
            <span className={trade.isBuyerMaker ? 'text-red-500' : 'text-green-500'}>
              {formattedPrice}
            </span>
          </Flashable>
        </div>
        <div className="w-24 text-right">
          <span className="text-gray-600 dark:text-gray-300">
            {formattedQuantity}
          </span>
        </div>
        <div className="w-20 text-right">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {formattedTime}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-bold text-lg">Recent Trades</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {symbol.replace('USDT', '/USDT')}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between py-2 px-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            <div className="flex-1">Price</div>
            <div className="w-24 text-right">Amount</div>
            <div className="w-20 text-right">Time</div>
          </div>
        </div>

        {/* Trades */}
        <div className="flex flex-col">
          {trades.map(renderTrade)}
        </div>
      </div>

      {!isConnected && (
        <div className="p-2 text-yellow-500 text-sm bg-yellow-50 dark:bg-yellow-900/20">
          Reconnecting...
        </div>
      )}
    </div>
  );
};

export default RecentTrades;
