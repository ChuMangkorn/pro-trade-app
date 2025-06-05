'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useTickerStream, MiniTicker } from '@/hooks/useTickerStream';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface TickerListProps {
  activeSymbol: string;
}

const popularPairs = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 
  'XRPUSDT', 'DOTUSDT', 'UNIUSDT', 'LTCUSDT', 'LINKUSDT'
];

// A memoized component for rendering a single ticker item.
// This prevents re-rendering all items when only one ticker's data changes.
const TickerItem: React.FC<{
  pair: string;
  ticker: MiniTicker | undefined;
  isSelected: boolean;
  onSelect: (pair: string) => void;
}> = React.memo(({ pair, ticker, isSelected, onSelect }) => {
  let priceChangePercent = 0;
  if (ticker) {
    const openPrice = parseFloat(ticker.o);
    const closePrice = parseFloat(ticker.c);
    if (openPrice > 0) {
      priceChangePercent = ((closePrice - openPrice) / openPrice) * 100;
    }
  }
  const isPositive = priceChangePercent >= 0;

  return (
    <button
      onClick={() => onSelect(pair)}
      className={`w-full p-2 rounded text-left transition-colors ${
        isSelected ? 'bg-blue-500/10 dark:bg-blue-500/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className="flex justify-between items-center">
        <span className={`font-medium text-sm ${isSelected ? 'text-blue-600 dark:text-blue-400' : ''}`}>
          {pair.replace('USDT', '/USDT')}
        </span>
        <div className="text-right">
          {ticker ? (
            <>
              <div className="font-mono text-sm">{parseFloat(ticker.c).toFixed(2)}</div>
              <div className={`font-mono text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </div>
            </>
          ) : (
            <SkeletonLoader className="w-16 h-8" />
          )}
        </div>
      </div>
    </button>
  );
});
TickerItem.displayName = 'TickerItem';

const TickerList: React.FC<TickerListProps> = ({ activeSymbol }) => {
  const router = useRouter();
  const { tickers, isConnected } = useTickerStream(popularPairs);

  const handlePairSelect = (pair: string) => {
    if (pair !== activeSymbol) {
      router.push(`/trade/${pair}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground p-2">
      <div className="px-2 py-2">
        <h2 className="font-bold text-lg">Markets</h2>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {popularPairs.map((pair) => (
          <TickerItem
            key={pair}
            pair={pair}
            ticker={tickers[pair]}
            isSelected={pair === activeSymbol}
            onSelect={handlePairSelect}
          />
        ))}
      </div>
       {!isConnected && (
        <div className="p-2 text-center text-xs text-yellow-500">
          Connecting stream...
        </div>
      )}
    </div>
  );
};

export default TickerList; 