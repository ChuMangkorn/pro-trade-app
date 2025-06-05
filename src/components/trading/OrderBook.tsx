'use client';
import React, { useMemo, useState } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import Flashable from '@/components/common/Flashable';

interface OrderBookProps {
  symbol: string;
}

interface Order {
  price: number;
  quantity: number;
  total: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol }) => {
  const { data, isLoading, error, isConnected } = useSharedBinanceWebSocket();
  const [grouping, setGrouping] = useState<number>(0.01);
  const [precision, setPrecision] = useState<number>(2);

  const { asks, bids, maxTotal } = useMemo(() => {
    if (!data?.asks || !data?.bids) {
      return {
        asks: [],
        bids: [],
        maxTotal: 0
      };
    }

    const formatOrders = (orders: [string, string][], isAsk: boolean) => {
      const groupedOrders = new Map<number, Order>();
      
      orders.forEach(([price, quantity]) => {
        const numPrice = parseFloat(price);
        const numQuantity = parseFloat(quantity);
        if (numQuantity <= 0) return;

        const roundedPrice = Math.round(numPrice / grouping) * grouping;
        const existing = groupedOrders.get(roundedPrice);
        
        if (existing) {
          existing.quantity += numQuantity;
          existing.total = existing.quantity * roundedPrice;
        } else {
          groupedOrders.set(roundedPrice, {
            price: roundedPrice,
            quantity: numQuantity,
            total: numQuantity * roundedPrice
          });
        }
      });

      return Array.from(groupedOrders.values())
        .sort((a, b) => isAsk ? a.price - b.price : b.price - a.price)
        .slice(0, 8);
    };

    const formattedAsks = formatOrders(data.asks, true);
    const formattedBids = formatOrders(data.bids, false);

    const maxTotal = Math.max(
      ...formattedAsks.map(order => order.total),
      ...formattedBids.map(order => order.total)
    );

    return {
      asks: formattedAsks,
      bids: formattedBids,
      maxTotal
    };
  }, [data, grouping]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <SkeletonLoader className="w-32 h-5" />
        </div>
        <div className="flex-1 p-3 space-y-2">
          <SkeletonLoader className="w-full h-5" />
          <SkeletonLoader className="w-full h-5" />
          <SkeletonLoader className="w-full h-5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-800">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-medium text-sm">Order Book</h2>
        </div>
        <div className="flex-1 p-3 text-red-500 text-sm">
          {error}
        </div>
      </div>
    );
  }

  const renderOrder = (order: Order, isAsk: boolean) => {
    const totalPercentage = (order.total / maxTotal) * 100;
    const formattedPrice = order.price.toFixed(precision);
    const formattedQuantity = order.quantity.toFixed(4);
    const formattedTotal = order.total.toFixed(2);

    return (
      <div
        key={order.price}
        className="relative flex items-center justify-between py-0.5 px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
      >
        <div
          className={`absolute inset-y-0 right-0 ${
            isAsk ? 'bg-red-900/10' : 'bg-green-900/10'
          }`}
          style={{ width: `${totalPercentage}%`, transition: 'width 150ms ease-in-out' }}
        />
        <div className="relative flex-1">
          <Flashable value={order.price}>
            <span className={isAsk ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}>
              {formattedPrice}
            </span>
          </Flashable>
        </div>
        <div className="relative w-20 text-right">
          <Flashable value={order.quantity}>
            <span className="text-gray-600 dark:text-gray-300">
              {formattedQuantity}
            </span>
          </Flashable>
        </div>
        <div className="relative w-20 text-right">
          <Flashable value={order.total}>
            <span className="text-gray-600 dark:text-gray-300">
              {formattedTotal}
            </span>
          </Flashable>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="font-medium text-sm">Order Book</h2>
          <div className="flex space-x-1">
            <button
              onClick={() => setGrouping(0.01)}
              className={`px-1.5 py-0.5 text-xs rounded ${
                grouping === 0.01
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              0.01
            </button>
            <button
              onClick={() => setGrouping(0.1)}
              className={`px-1.5 py-0.5 text-xs rounded ${
                grouping === 0.1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              0.1
            </button>
            <button
              onClick={() => setGrouping(1)}
              className={`px-1.5 py-0.5 text-xs rounded ${
                grouping === 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              1
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {symbol.replace('USDT', '/USDT')}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setPrecision(2)}
              className={`px-1.5 py-0.5 text-xs rounded ${
                precision === 2
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              2
            </button>
            <button
              onClick={() => setPrecision(4)}
              className={`px-1.5 py-0.5 text-xs rounded ${
                precision === 4
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              4
            </button>
            <button
              onClick={() => setPrecision(8)}
              className={`px-1.5 py-0.5 text-xs rounded ${
                precision === 8
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              8
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between py-1 px-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">Price</div>
          <div className="w-20 text-right">Amount</div>
          <div className="w-20 text-right">Total</div>
        </div>

        {/* Asks (แดง) ด้านบน */}
        <div className="flex flex-col-reverse">
          {asks.map(order => renderOrder(order, true))}
        </div>

        {/* Spread */}
        {asks.length > 0 && bids.length > 0 && (
          <div className="py-1 px-2 text-xs text-gray-500 dark:text-gray-400 border-y border-gray-200 dark:border-gray-700">
            Spread: {((asks[0].price - bids[0].price) / asks[0].price * 100).toFixed(2)}%
          </div>
        )}

        {/* Bids (เขียว) ด้านล่าง */}
        <div className="flex flex-col">
          {bids.map(order => renderOrder(order, false))}
        </div>
      </div>

      {!isConnected && (
        <div className="p-1.5 text-yellow-500 text-xs bg-yellow-50 dark:bg-yellow-900/20">
          Reconnecting...
        </div>
      )}
    </div>
  );
};

export default OrderBook;
