'use client';
import React, { Suspense } from 'react';
import OrderBook from '@/components/trading/OrderBook';
import PriceChart from '@/components/trading/PriceChart';
import RecentTrades from '@/components/trading/RecentTrades';
import TickerList from '@/components/trading/TickerList';
import TradeTopBar from '@/components/layout/TradeTopBar';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { BinanceWebSocketProvider } from '@/context/BinanceWebSocketContext';
import ActivityPanel from '@/components/trading/ActivityPanel';

interface TradingLayoutProps {
  symbol: string;
}

const LoadingFallback = () => (
  <div className="p-4 space-y-2 bg-muted rounded-md">
    <SkeletonLoader className="w-full h-4" />
    <SkeletonLoader className="w-2/3 h-4" />
    <SkeletonLoader className="w-full h-4" />
    <SkeletonLoader className="w-1/2 h-4" />
  </div>
);

const TradingLayout: React.FC<TradingLayoutProps> = ({ symbol }) => {
  return (
    <BinanceWebSocketProvider symbol={symbol}>
      <div className="min-h-screen bg-background dark">
        <TradeTopBar symbol={symbol} />
        <main className="grid grid-cols-1 lg:grid-cols-12 grid-rows-[auto_1fr] gap-2 p-2 h-[calc(100vh-50px)]">

          {/* Left Sidebar: OrderBook Only */}
          <div className="lg:col-span-3 bg-muted rounded-md overflow-hidden">
            <Suspense fallback={<LoadingFallback />}>
              <OrderBook symbol={symbol} />
            </Suspense>
          </div>

          {/* Main Content (Chart and Activity) */}
          <div className="lg:col-span-7 flex flex-col gap-2">
            <div className="flex-grow min-h-0 bg-muted rounded-md">
              <Suspense fallback={<LoadingFallback />}>
                <PriceChart symbol={symbol} />
              </Suspense>
            </div>
            {/* ADD overflow-hidden HERE */}
            <div className="h-[280px] bg-muted rounded-md overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <ActivityPanel symbol={symbol} />
              </Suspense>
            </div>
          </div>

          {/* Right Sidebar: TickerList and RecentTrades */}
          <div className="lg:col-span-2 flex flex-col gap-2">
            <div className="flex-grow h-1/2 min-h-0 bg-muted rounded-md overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <TickerList activeSymbol={symbol} />
              </Suspense>
            </div>
            {/* ADD overflow-hidden HERE */}
            <div className="flex-grow h-1/2 min-h-0 bg-muted rounded-md overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <RecentTrades symbol={symbol} />
              </Suspense>
            </div>
          </div>

        </main>
      </div>
    </BinanceWebSocketProvider>
  );
};

export default TradingLayout;