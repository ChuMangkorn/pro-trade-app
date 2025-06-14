'use client';
import React, { Suspense, useEffect } from 'react';
import OrderBook from '@/features/trading/components/OrderBook';
import PriceChart from '@/features/trading/components/PriceChart';
import RecentTrades from '@/features/trading/components/RecentTrades';
import TickerList from '@/features/trading/components/TickerList';
import TradeTopBar from '@/components/layout/TradeTopBar';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { BinanceWebSocketProvider, useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import { OrderProvider } from '@/context/OrderContext';
import ActivityPanel from '@/features/trading/components/ActivityPanel';

interface TradingLayoutProps {
  symbol: string;
}

const LoadingFallback = () => (
  <div className="p-4 space-y-2 bg-muted rounded-md h-full">
    <SkeletonLoader className="w-full h-4" />
    <SkeletonLoader className="w-2/3 h-4" />
    <SkeletonLoader className="w-full h-4" />
  </div>
);

const DynamicTitleUpdater: React.FC<{ symbol: string }> = ({ symbol }) => {
  const { data } = useSharedBinanceWebSocket();
  const originalTitle = 'ProTrade | Real-Time Crypto Trading';

  useEffect(() => {
    if (data?.price) {
      const formattedPrice = parseFloat(data.price).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      document.title = `${formattedPrice} | ${symbol.replace('USDT', '/USDT')} | ProTrade`;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [data?.price, symbol, originalTitle]);

  return null;
};


const TradingLayout: React.FC<TradingLayoutProps> = ({ symbol }) => {
  return (
    <OrderProvider>
      <BinanceWebSocketProvider symbol={symbol}>
        <DynamicTitleUpdater symbol={symbol} />
        <div className="h-screen flex flex-col bg-background text-foreground">
          <TradeTopBar symbol={symbol} />
          <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 grid-rows-1 gap-2 p-2 min-h-0">

            <div className="lg:col-span-3 bg-muted rounded-md overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <OrderBook symbol={symbol} />
              </Suspense>
            </div>

            <div className="lg:col-span-7 flex flex-col gap-2">
              <div className="flex-grow min-h-0 bg-muted rounded-md overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                  <PriceChart symbol={symbol} />
                </Suspense>
              </div>
              <div className="h-[280px] flex-shrink-0 bg-muted rounded-md overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                  <ActivityPanel symbol={symbol} />
                </Suspense>
              </div>
            </div>
            <div className="lg:col-span-2 flex flex-col gap-2">
              <div className="flex-1 min-h-0 bg-muted rounded-md overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                  <TickerList activeSymbol={symbol} />
                </Suspense>
              </div>
              <div className="flex-1 min-h-0 bg-muted rounded-md overflow-hidden">
                <Suspense fallback={<LoadingFallback />}>
                  <RecentTrades />
                </Suspense>
              </div>
            </div>

          </main>
        </div>
      </BinanceWebSocketProvider>
    </OrderProvider>
  );
};

export default TradingLayout;