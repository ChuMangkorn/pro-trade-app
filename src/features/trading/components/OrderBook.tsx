'use client';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import Flashable from '@/components/ui/Flashable';

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseCurrency = useMemo(() => symbol.replace(/USDT|BTC|ETH|BNB$/, ''), [symbol]);
  const quoteCurrency = useMemo(() => symbol.match(/USDT|BTC|ETH|BNB$/)?.[0] || '', [symbol]);

  const { asks, bids, maxTotal } = useMemo(() => {
    if (!data?.asks || !data?.bids) {
      return { asks: [], bids: [], maxTotal: 0 };
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
    const formattedBids = formatOrders(aggregatedBidsMap, true);
    // Binance shows asks from highest price at the top down to the best ask near
    // the center. We keep the list in ascending order and rely on flex-col-reverse
    // when rendering to achieve this visual ordering.
    const formattedAsks = formatOrders(aggregatedAsksMap, false);
    const maxAskTotal = formattedAsks[0]?.total || 0;
    const maxBidTotal = formattedBids[formattedBids.length - 1]?.total || 0;

    return {
      asks: formattedAsks,
      bids: formattedBids,
      maxTotal: Math.max(maxAskTotal, maxBidTotal)
    };
  }, [data?.asks, data?.bids, precision]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || maxTotal === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const computedStyle = getComputedStyle(container);
    const buyColor = computedStyle.getPropertyValue('--color-binance-buy-transparent').trim();
    const sellColor = computedStyle.getPropertyValue('--color-binance-sell-transparent').trim();

    const draw = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      if (asks.length > 0) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = asks.length - 1; i >= 0; i--) {
          const x = (asks[i].total / maxTotal) * width;
          const y = (height / 2) - ((asks.length - 1 - i + 1) / (asks.length + 1)) * (height / 2);
          ctx.lineTo(x, y);
        }
        const lastAskX = (asks[0].total / maxTotal) * width;
        ctx.lineTo(lastAskX, 0);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fillStyle = sellColor;
        ctx.fill();
      }

      if (bids.length > 0) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < bids.length; i++) {
          const x = (bids[i].total / maxTotal) * width;
          const y = (height / 2) + ((i + 1) / (bids.length + 1)) * (height / 2);
          ctx.lineTo(x, y);
        }
        const lastBidX = (bids[bids.length - 1].total / maxTotal) * width;
        ctx.lineTo(lastBidX, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = buyColor;
        ctx.fill();
      }
    };

    const observer = new ResizeObserver(draw);
    observer.observe(container);
    draw();
    return () => observer.disconnect();
  }, [asks, bids, maxTotal]);

  const renderOrderRow = (order: Order, isAsk: boolean) => {
    const depthPercentage = maxTotal > 0 ? (order.total / maxTotal) * 100 : 0;
    return (
      <div
        key={order.price}
        className="relative grid grid-cols-3 gap-4 py-[2px] px-2 text-xs hover:bg-[var(--color-binance-hover)] cursor-pointer"
      >
        <div
          className={`absolute inset-y-0 ${isAsk ? 'right-0' : 'left-0'}`}
          style={{
            width: `${depthPercentage}%`,
            backgroundColor: isAsk
              ? 'var(--color-binance-sell-transparent)'
              : 'var(--color-binance-buy-transparent)',
          }}
        />
        <div
          className={`relative z-10 font-mono ${isAsk ? 'text-red-500' : 'text-green-500'}`}
        >
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
    <div ref={containerRef} className="h-full relative">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none" />
      <div className="h-full flex flex-col text-xs relative z-10">
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
        <div className="flex-1 min-h-0 flex flex-col-reverse overflow-y-auto custom-scrollbar">
          <div>{asks.map(order => renderOrderRow(order, true))}</div>
        </div>
        <div className="flex-shrink-0 py-1.5 my-1 border-y border-border">
          {data?.price ? (<div className="text-lg font-semibold text-green-500 px-2"><Flashable value={parseFloat(data.price)}>{parseFloat(data.price).toFixed(precision.toString().split('.')[1]?.length || 0)}</Flashable></div>)
            : <SkeletonLoader className="w-20 h-5 mx-2" />}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {bids.map(order => renderOrderRow(order, false))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;