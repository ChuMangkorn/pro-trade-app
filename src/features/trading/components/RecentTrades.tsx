'use client';
import React, { useMemo } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import { TradeData as WebSocketTradeData } from '@/hooks/useBinanceWebSocket';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

interface ProcessedTrade {
  id: number;
  price: number;
  quantity: number;
  time: number;
  isBuyerMaker: boolean;
}

// ทำให้ TradeRow เป็นคอมโพเนนต์ที่แสดงผลข้อมูลอย่างเดียว
const TradeRow: React.FC<{ trade: ProcessedTrade }> = ({ trade }) => {
  const isSell = trade.isBuyerMaker;
  const priceColorClass = isSell ? 'text-red-500' : 'text-green-500';

  return (
    // --- START: MODIFIED LINE ---
    // ปรับลดช่องว่างจาก gap-4 เป็น gap-3
    <div className="grid grid-cols-3 gap-3 px-2 py-0.5 font-mono">
      {/* --- END: MODIFIED LINE --- */}
      <div className={priceColorClass}>
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

  const trades: ProcessedTrade[] = useMemo(() => {
    if (!data?.recentTrades) return [];
    return data.recentTrades.map((trade: WebSocketTradeData) => ({
      id: trade.t,
      price: parseFloat(trade.p),
      quantity: parseFloat(trade.q),
      time: trade.T,
      isBuyerMaker: trade.m,
    })).slice(0, 30);
  }, [data?.recentTrades]);


  if (isLoading && trades.length === 0) {
    return (<div className="p-2 space-y-1 bg-muted rounded-md h-full"><SkeletonLoader className="w-full h-4" /><SkeletonLoader className="w-2/3 h-4" /><SkeletonLoader className="w-full h-4" /><SkeletonLoader className="w-1/2 h-4" /></div>);
  }

  return (
    <div className="h-full flex flex-col text-xs bg-muted">
      <div className="flex-shrink-0 p-2 border-b border-border">
        <h2 className="font-medium text-sm text-foreground">Trades</h2>
      </div>

      {/* --- START: MODIFIED LINE --- */}
      {/* ปรับลดช่องว่างจาก gap-4 เป็น gap-3 ที่หัวตารางด้วย */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-3 py-1 px-2 text-muted-foreground">
        {/* --- END: MODIFIED LINE --- */}
        <span>Price(USDT)</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-grow min-h-0 overflow-y-auto custom-scrollbar pr-1">
        {trades.map((trade) => (
          <TradeRow
            key={trade.id}
            trade={trade}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;