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
  const { data, isLoading } = useSharedBinanceWebSocket();
  const [precision] = useState<number>(2);

  const { asks, bids, maxTotal } = useMemo(() => {
    if (!data?.asks || !data?.bids) {
      return { asks: [], bids: [], maxTotal: 0 };
    }

    const formatOrders = (orders: [string, string][]): Order[] => {
      let cumulativeTotal = 0;
      return orders.map(([price, quantity]) => {
        const numPrice = parseFloat(price);
        const numQuantity = parseFloat(quantity);
        cumulativeTotal += numPrice * numQuantity;
        return { price: numPrice, quantity: numQuantity, total: cumulativeTotal };
      });
    };

    const formattedAsks = formatOrders(data.asks).reverse(); // Reverse for top-down display
    const formattedBids = formatOrders(data.bids);

    const maxAskTotal = formattedAsks[0]?.total || 0;
    const maxBidTotal = formattedBids[formattedBids.length - 1]?.total || 0;

    return {
      asks: formattedAsks,
      bids: formattedBids,
      maxTotal: Math.max(maxAskTotal, maxBidTotal)
    };
  }, [data]);

  const renderOrderRow = (order: Order, isAsk: boolean) => {
    const depthPercentage = (order.total / maxTotal) * 100;
    
    return (
      <div key={order.price} className="relative grid grid-cols-3 gap-2 py-0.5 px-2 text-xs hover:bg-[var(--color-binance-hover)] cursor-pointer">
        <div className="absolute inset-y-0 right-0 transition-all duration-150" style={{ 
            width: `${depthPercentage}%`, 
            backgroundColor: isAsk ? 'var(--color-binance-sell-transparent)' : 'var(--color-binance-buy-transparent)'
        }} />
        <div className={`relative z-10 ${isAsk ? 'text-red-500' : 'text-green-500'}`}>{order.price.toFixed(precision)}</div>
        <div className="relative z-10 text-right">{order.quantity.toFixed(4)}</div>
        <div className="relative z-10 text-right text-muted-foreground">{order.total.toFixed(2)}</div>
      </div>
    );
  };
  
  if(isLoading) return <SkeletonLoader className="w-full h-full bg-muted" />;

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="p-2 border-b border-border">
        <h2 className="font-medium text-sm text-foreground">Order Book</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 py-1 px-2 text-muted-foreground">
        <span>Price(USDT)</span>
        <span className="text-right">Amount({symbol.replace('USDT','')})</span>
        <span className="text-right">Total</span>
      </div>
      
      <div className="flex-grow flex flex-col min-h-0">
        {/* Asks (Sell Orders) */}
        <div className="flex flex-col-reverse">
          {asks.slice(-12).map(order => renderOrderRow(order, true))}
        </div>

        {/* Current Price (Spread) */}
        <div className="py-2 my-1 border-y border-border">
          {data?.price ? (
             <div className="text-lg font-semibold text-green-500 px-2">
                <Flashable value={parseFloat(data.price)}>
                  {parseFloat(data.price).toFixed(precision)}
                </Flashable>
             </div>
          ) : <SkeletonLoader className="w-20 h-5 mx-2" />}
        </div>
        
        {/* Bids (Buy Orders) */}
        <div className="flex flex-col">
          {bids.slice(0, 12).map(order => renderOrderRow(order, false))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;