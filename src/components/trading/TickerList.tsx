'use client';
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTickerStream, MiniTicker } from '@/hooks/useTickerStream';
import SkeletonLoader from '@/components/common/SkeletonLoader';

const TickerItem: React.FC<{
  pair: string;
  ticker: MiniTicker | undefined;
  isSelected: boolean;
  onSelect: (pair: string) => void;
}> = React.memo(({ pair, ticker, isSelected, onSelect }) => {
  const priceChangePercent = useMemo(() => {
    if (!ticker) return 0;
    const openPrice = parseFloat(ticker.o);
    const closePrice = parseFloat(ticker.c);
    return openPrice > 0 ? ((closePrice - openPrice) / openPrice) * 100 : 0;
  }, [ticker]);

  const isPositive = priceChangePercent >= 0;

  return (
    <button
      onClick={() => onSelect(pair)}
      className={`grid grid-cols-3 w-full p-2 text-xs transition-colors ${
        isSelected ? 'bg-white/10' : 'hover:bg-[var(--color-binance-hover)]'
      }`}
    >
      <div className="text-left font-medium text-foreground">
        {pair.replace('USDT', '')}
        <span className="text-muted-foreground">/USDT</span>
      </div>
      <div className={`text-right font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {ticker ? parseFloat(ticker.c).toFixed(2) : <SkeletonLoader className="w-10 h-3 inline-block"/>}
      </div>
      <div className={`text-right font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {ticker ? `${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%` : <SkeletonLoader className="w-10 h-3 inline-block"/>}
      </div>
    </button>
  );
});
TickerItem.displayName = 'TickerItem';

const TickerList: React.FC<{ activeSymbol: string }> = ({ activeSymbol }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  const popularPairs = [
    'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 
    'XRPUSDT', 'DOTUSDT', 'UNIUSDT', 'LTCUSDT', 'LINKUSDT',
    'SOLUSDT', 'MATICUSDT', 'AVAXUSDT', 'SHIBUSDT', 'TRXUSDT'
  ];
  
  const { tickers } = useTickerStream(popularPairs);

  const handlePairSelect = (pair: string) => {
    if (pair !== activeSymbol) {
      router.push(`/trade/${pair}`);
    }
  };
  
  const filteredPairs = popularPairs.filter(p => 
    p.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col text-foreground">
      <div className="p-2">
        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500"
        />
      </div>
      
      <div className="grid grid-cols-3 px-2 pb-1 text-xs text-muted-foreground">
        <div className="text-left">Pair</div>
        <div className="text-right">Price</div>
        <div className="text-right">Change</div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {filteredPairs.map((pair) => (
          <TickerItem
            key={pair}
            pair={pair}
            ticker={tickers[pair]}
            isSelected={pair === activeSymbol}
            onSelect={handlePairSelect}
          />
        ))}
        {filteredPairs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No markets found.
          </div>
        )}
      </div>
    </div>
  );
};

export default TickerList;