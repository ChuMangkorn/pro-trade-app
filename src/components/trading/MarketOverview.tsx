'use client';
import React, { useMemo } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import SkeletonLoader from '@/components/common/SkeletonLoader';

interface MarketOverviewProps {
  symbol: string;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ symbol = 'BTCUSDT' }) => {
  const { data, isLoading, error, isConnected } = useSharedBinanceWebSocket();

  const marketData = useMemo(() => {
    if (!data) return null;

    const priceChangePercent = parseFloat(data.priceChangePercent);
    const isPositive = priceChangePercent >= 0;
    const formattedSymbol = symbol.replace('USDT', '/USDT');
    const formattedVolume = parseFloat(data.volume).toLocaleString();
    const formattedQuoteVolume = parseFloat(data.quoteVolume).toLocaleString();

    return {
      formattedSymbol,
      price: parseFloat(data.price).toFixed(2),
      priceChangePercent: priceChangePercent.toFixed(2),
      isPositive,
      volume: formattedVolume,
      quoteVolume: formattedQuoteVolume,
      highPrice: parseFloat(data.highPrice).toFixed(2),
      lowPrice: parseFloat(data.lowPrice).toFixed(2)
    };
  }, [data, symbol]);

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4">
        <SkeletonLoader className="w-24 h-6" />
        <SkeletonLoader className="w-32 h-6" />
        <SkeletonLoader className="w-24 h-6" />
        <SkeletonLoader className="w-32 h-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (!marketData) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="flex items-center space-x-2">
        <span className="font-bold">{marketData.formattedSymbol}</span>
        <span className={`font-medium ${marketData.isPositive ? 'text-green-500' : 'text-red-500'}`}>
          ${marketData.price}
        </span>
        <span className={`text-sm ${marketData.isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {marketData.isPositive ? '+' : ''}{marketData.priceChangePercent}%
        </span>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <span>24h High:</span>
          <span className="text-green-500">${marketData.highPrice}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>24h Low:</span>
          <span className="text-red-500">${marketData.lowPrice}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>Vol:</span>
          <span>{marketData.volume}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>Quote Vol:</span>
          <span>${marketData.quoteVolume}</span>
        </div>
      </div>

      {!isConnected && (
        <div className="text-[var(--color-binance-yellow)] text-sm">
          Reconnecting...
        </div>
      )}
    </div>
  );
};

export default MarketOverview;
