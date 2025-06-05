'use client';
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SymbolSelector from '@/components/common/SymbolSelector';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import Flashable from '@/components/common/Flashable';
import DarkModeToggle from '@/components/common/DarkModeToggle';

const StatItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="text-xs">
    <span className="text-muted-foreground mr-1.5">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
);

const TradeTopBar: React.FC<{ symbol: string }> = ({ symbol }) => {
  const router = useRouter();
  const { data } = useSharedBinanceWebSocket();

  const handleSymbolChange = useCallback((newSymbol: string) => {
    if (newSymbol !== symbol) {
      router.push(`/trade/${newSymbol}`);
    }
  }, [router, symbol]);

  const price = data?.price ? parseFloat(data.price) : 0;
  const priceChangePercent = data?.priceChangePercent ? parseFloat(data.priceChangePercent) : 0;
  const isPositive = priceChangePercent >= 0;

  const formatCompact = (val: string | undefined) => {
    if (!val) return '...';
    return parseFloat(val).toLocaleString(undefined, {
      notation: 'compact',
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-muted border-b border-border h-[50px]">
      <div className="flex items-center h-full px-4">

        {/* Left Section: Symbol & Price */}
        <div className="flex items-center space-x-4 pr-4 border-r border-border">
          <SymbolSelector currentSymbol={symbol} onChange={handleSymbolChange} />
          {data?.price && (
            <Flashable value={price}>
              <div className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {price.toFixed(2)}
              </div>
            </Flashable>
          )}
        </div>

        {/* Center Section: Market Stats */}
        <div className="flex items-center space-x-5 pl-4 flex-grow">
          <StatItem
            label="24h Change"
            value={
              <Flashable value={priceChangePercent}>
                <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                  {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </span>
              </Flashable>
            }
          />
          <StatItem label="24h High" value={data ? parseFloat(data.highPrice).toFixed(2) : '...'} />
          <StatItem label="24h Low" value={data ? parseFloat(data.lowPrice).toFixed(2) : '...'} />
          <StatItem label={`24h Volume (${symbol.replace('USDT', '')})`} value={formatCompact(data?.volume)} />
          <StatItem label={`24h Volume (USDT)`} value={formatCompact(data?.quoteVolume)} />
        </div>

        {/* Right Section */}
        <div className="flex items-center">
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
};

export default TradeTopBar;