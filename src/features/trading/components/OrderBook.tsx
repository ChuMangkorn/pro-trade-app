'use client';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface OrderBookProps {
  symbol: string;
}

interface Order {
  price: number;
  quantity: number;
  total: number;
}

const PrecisionButton: React.FC<{ value: number; current: number; onClick: (value: number) => void }> = ({ value, current, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`w-8 h-6 text-xs rounded-sm ${current === value ? 'bg-white/10' : 'bg-transparent hover:bg-white/5'}`}
  >
    {value.toString().split('.')[1]?.length > 1 ? value.toFixed(2) : value}
  </button>
);


const OrderBook: React.FC<OrderBookProps> = ({ symbol }) => {
  const { data, isLoading } = useSharedBinanceWebSocket();
  const precisionOptions = [0.01, 0.1, 1, 10];
  const [precision, setPrecision] = useState<number>(precisionOptions[0]);

  const [priceDirection, setPriceDirection] = useState<'up' | 'down'>('up');
  const prevPriceRef = useRef<number | null>(null);

  const baseCurrency = useMemo(() => symbol.replace(/USDT|BTC|ETH|BNB$/, ''), [symbol]);
  const quoteCurrency = useMemo(() => symbol.match(/USDT|BTC|ETH|BNB$/)?.[0] || '', [symbol]);

  useEffect(() => {
    if (data?.price) {
      const currentPrice = parseFloat(data.price);
      if (prevPriceRef.current !== null) {
        if (currentPrice > prevPriceRef.current) {
          setPriceDirection('up');
        } else if (currentPrice < prevPriceRef.current) {
          setPriceDirection('down');
        }
      }
      prevPriceRef.current = currentPrice;
    }
  }, [data?.price]);

  // --- START: คำนวณข้อมูลโดยยึดตาม Amount ของแต่ละฝั่ง ---
  const { asks, bids, maxAskQuantity, maxBidQuantity } = useMemo(() => {
    if (!data?.asks || !data?.bids) {
      return { asks: [], bids: [], maxAskQuantity: 0, maxBidQuantity: 0 };
    }
    const aggregateOrders = (orders: [string, string][]): Map<number, number> => {
      const grouped = new Map<number, number>();
      for (const [priceStr, quantityStr] of orders) {
        const price = parseFloat(priceStr);
        const quantity = parseFloat(quantityStr);
        const groupKey = Math.floor(price / precision) * precision;
        const currentQty = grouped.get(groupKey) || 0;
        grouped.set(groupKey, currentQty + quantity);
      }
      return grouped;
    };

    const formatOrders = (groupedOrders: Map<number, number>, isBids: boolean): Order[] => {
      let cumulativeTotal = 0;
      const sortedOrders = Array.from(groupedOrders.entries())
        .sort(([priceA], [priceB]) => isBids ? priceB - priceA : priceA - priceB)
        .map(([price, quantity]) => {
          cumulativeTotal += price * quantity;
          return { price, quantity, total: cumulativeTotal };
        });
      return sortedOrders;
    };

    const aggregatedAsksMap = aggregateOrders(data.asks);
    const aggregatedBidsMap = aggregateOrders(data.bids);
    
    const fullFormattedBids = formatOrders(aggregatedBidsMap, true);
    const fullFormattedAsks = formatOrders(aggregatedAsksMap, false);

    const maxAskQty = Math.max(...Array.from(aggregatedAsksMap.values()), 0);
    const maxBidQty = Math.max(...Array.from(aggregatedBidsMap.values()), 0);

    const visibleBids = fullFormattedBids.slice(0, 17);
    const visibleAsks = fullFormattedAsks.slice(0, 17);
    
    return {
      asks: visibleAsks,
      bids: visibleBids,
      maxAskQuantity: maxAskQty,
      maxBidQuantity: maxBidQty,
    };
  }, [data?.asks, data?.bids, precision]);
  // --- END: คำนวณข้อมูล ---


  const renderOrderRow = (order: Order, isAsk: boolean) => {
    // --- START: คำนวณความกว้างของแถบสีตาม Amount ---
    let depthPercentage = 0;
    if (isAsk) {
      depthPercentage = maxAskQuantity > 0 ? (order.quantity / maxAskQuantity) * 100 : 0;
    } else {
      depthPercentage = maxBidQuantity > 0 ? (order.quantity / maxBidQuantity) * 100 : 0;
    }
    // --- END: คำนวณความกว้างของแถบสี ---
    
    return (
      <div
        key={order.price}
        className="relative grid grid-cols-3 gap-4 items-center px-2 text-xs hover:bg-[var(--color-binance-hover)] cursor-pointer flex-grow"
      >
        <div
          className="absolute inset-y-0 h-full"
          style={{
            width: `${depthPercentage}%`,
            backgroundColor: isAsk
              ? 'var(--color-binance-sell-transparent)'
              : 'var(--color-binance-buy-transparent)',
            right: 0,
          }}
        />
        <div className={`relative z-10 font-mono ${isAsk ? 'text-red-500' : 'text-green-500'}`}>
          {order.price.toFixed(precision.toString().split('.')[1]?.length || 0)}
        </div>
        <div className="relative z-10 text-right font-mono">
          {order.quantity.toFixed(4)}
        </div>
        <div className="relative z-10 text-right font-mono text-muted-foreground">
          {order.total.toFixed(2)}
        </div>
      </div>
    );
  };

  if (isLoading && asks.length === 0 && bids.length === 0) return <SkeletonLoader className="w-full h-full bg-muted" />;

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex-shrink-0 p-2 flex justify-between items-center border-b border-border">
        <h2 className="font-medium text-sm text-foreground">Order Book</h2>
        <div className="flex items-center space-x-1 border border-border rounded-sm p-0.5">
          {precisionOptions.map(p => (<PrecisionButton key={p} value={p} current={precision} onClick={setPrecision} />))}
        </div>
      </div>
      <div className="flex-shrink-0 grid grid-cols-3 gap-4 py-1.5 px-2 text-muted-foreground font-light">
        <span>Price({quoteCurrency})</span>
        <span className="text-right">Amount({baseCurrency})</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col h-full">
          {[...asks].reverse().map(order => renderOrderRow(order, true))}
        </div>
      </div>
      
      <div className="flex-shrink-0 py-1.5 my-1 border-y border-border">
        {data?.price ? (
            <div className={`text-lg font-semibold px-2 ${priceDirection === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {parseFloat(data.price).toFixed(precision.toString().split('.')[1]?.length || 0)}
            </div>
            )
          : <SkeletonLoader className="w-20 h-5 mx-2" />}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex flex-col h-full">
          {bids.map(order => renderOrderRow(order, false))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;