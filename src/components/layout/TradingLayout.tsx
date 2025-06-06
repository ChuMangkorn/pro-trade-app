'use client';
import React, { Suspense, useEffect } from 'react'; // useEffect is required for dynamic title updates
import OrderBook from '@/components/trading/OrderBook';
import PriceChart from '@/components/trading/PriceChart';
import RecentTrades from '@/components/trading/RecentTrades';
import TickerList from '@/components/trading/TickerList';
import TradeTopBar from '@/components/layout/TradeTopBar';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import { BinanceWebSocketProvider, useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext'; // Provides shared WebSocket data
import { OrderProvider } from '@/context/OrderContext';
import ActivityPanel from '@/components/trading/ActivityPanel';

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

// Inner component that updates the title using data from the WebSocket
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

    // Cleanup function: Revert title when component unmounts or symbol changes
    return () => {
      document.title = originalTitle;
    };
  }, [data?.price, symbol, originalTitle]);

  return null; // This component does not render anything
};


const TradingLayout: React.FC<TradingLayoutProps> = ({ symbol }) => {
  return (
    <OrderProvider>
      <BinanceWebSocketProvider symbol={symbol}>
        {/* Render the component that updates the document title */}
        {/* 4. Render the component created above */}
        <DynamicTitleUpdater symbol={symbol} />
        <div className="h-screen flex flex-col bg-background dark text-foreground">
          <TradeTopBar symbol={symbol} />
          <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 grid-rows-1 gap-2 p-2 min-h-0">

            {/* Left Sidebar: OrderBook */}
            <div className="lg:col-span-3 bg-muted rounded-md overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <OrderBook symbol={symbol} />
              </Suspense>
            </div>

            {/* Main Content (Chart and Activity) */}
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

            {/* Right Sidebar: TickerList and RecentTrades */}
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