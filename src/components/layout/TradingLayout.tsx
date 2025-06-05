'use client';
import React, { Suspense } from 'react';
import OrderBook from '@/components/trading/OrderBook';
import PriceChart from '@/components/trading/PriceChart';
import TradePanel from '@/components/trading/TradePanel';
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
  <div className="p-4 space-y-4">
    <SkeletonLoader className="w-full h-8" />
    <SkeletonLoader className="w-full h-8" />
    <SkeletonLoader className="w-full h-8" />
  </div>
);

const TradingLayout: React.FC<TradingLayoutProps> = ({ symbol }) => {
  return (
    <BinanceWebSocketProvider symbol={symbol}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <TradeTopBar symbol={symbol} />
        <div className="container mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-80px)]">
            {/* Left Sidebar - Ticker List */}
            <div className="lg:col-span-2 overflow-y-auto">
              <Suspense fallback={<LoadingFallback />}>
                <TickerList activeSymbol={symbol} />
              </Suspense>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded shadow">
                <Suspense fallback={<LoadingFallback />}>
                  <PriceChart symbol={symbol} />
                </Suspense>
              </div>
              <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded shadow">
                <Suspense fallback={<LoadingFallback />}>
                  <ActivityPanel symbol={symbol} />
                </Suspense>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-y-auto">
              <div className="flex-1 min-h-0">
                <Suspense fallback={<LoadingFallback />}>
                  <OrderBook symbol={symbol} />
                </Suspense>
              </div>
              <div className="flex-1 min-h-0">
                <Suspense fallback={<LoadingFallback />}>
                  <RecentTrades symbol={symbol} />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BinanceWebSocketProvider>
  );
};

export default TradingLayout;
