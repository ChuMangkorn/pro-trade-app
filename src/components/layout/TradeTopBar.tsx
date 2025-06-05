'use client';
import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SymbolSelector from '@/components/common/SymbolSelector';
import MarketOverview from '@/components/trading/MarketOverview';
import DarkModeToggle from '@/components/common/DarkModeToggle';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import Flashable from '@/components/common/Flashable';

interface TradeTopBarProps {
  symbol: string;
}

const TradeTopBar: React.FC<TradeTopBarProps> = ({ symbol }) => {
  const router = useRouter();
  const { data, isConnected } = useSharedBinanceWebSocket();

  const handleSymbolChange = useCallback((newSymbol: string) => {
    if (newSymbol !== symbol) {
      router.push(`/trade/${newSymbol}`);
    }
  }, [router, symbol]);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <SymbolSelector currentSymbol={symbol} onChange={handleSymbolChange} />
            {data && (
              <div className="flex items-center space-x-4">
                <Flashable value={data.price}>
                  <div className="text-lg font-semibold">
                    ${parseFloat(data.price).toFixed(2)}
                  </div>
                </Flashable>
                <Flashable value={data.priceChangePercent}>
                  <div className={`text-sm ${parseFloat(data.priceChangePercent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {parseFloat(data.priceChangePercent) >= 0 ? '+' : ''}
                    {parseFloat(data.priceChangePercent).toFixed(2)}%
                  </div>
                </Flashable>
              </div>
            )}
          </div>

          {/* Center Section */}
          <div className="flex-1 flex justify-center">
            <MarketOverview symbol={symbol} />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {!isConnected && (
              <div className="text-yellow-500 text-sm">
                Reconnecting...
              </div>
            )}
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeTopBar; 