'use client';
import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SymbolSelector from '@/components/ui/SymbolSelector';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import DarkModeToggle from '@/components/ui/DarkModeToggle';
import SymbolSearchModal from '@/components/ui/SymbolSearchModal';

const StatItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="text-xs px-3">
    <span className="text-muted-foreground mr-1.5">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
);

const TradeTopBar: React.FC<{ symbol: string }> = ({ symbol }) => {
  const router = useRouter();
  const { data } = useSharedBinanceWebSocket();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSymbolChange = useCallback((newSymbol: string) => {
    if (newSymbol && newSymbol !== symbol) {
      router.push(`/trade/${newSymbol}`);
    }
    setIsModalOpen(false);
  }, [router, symbol]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsModalOpen(true);
      }
      if (event.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- START: MODIFIED SECTION ---
  // เราจะใช้แค่ isPositive24h ในการตัดสินสีทั้งหมด เพื่อให้สอดคล้องกัน
  const price = data?.price ? parseFloat(data.price) : 0;
  const priceChangePercent = data?.priceChangePercent ? parseFloat(data.priceChangePercent) : 0;
  const isPositive24h = priceChangePercent >= 0;

  const formatCompact = (val: string | undefined) => {
    if (!val) return '...';
    return parseFloat(val).toLocaleString(undefined, { notation: 'compact', maximumFractionDigits: 2 });
  };

  return (
    <>
      <div className="bg-muted border-b border-border h-[50px] flex-shrink-0">
        <div className="flex items-center h-full px-4">
          <div className="flex items-center space-x-4 pr-4 border-r border-border">
            <SymbolSelector currentSymbol={symbol} onClick={() => setIsModalOpen(true)} />

            {/* ทำให้สีของราคาหลักใช้เงื่อนไขเดียวกับ 24h Change */}
            {data?.price && (
              <div className={`text-lg font-semibold ${isPositive24h ? 'text-green-500' : 'text-red-500'}`}>
                {price.toFixed(2)}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 pl-4 flex-grow">
            <StatItem
              label="24h Change"
              value={
                <span className={isPositive24h ? 'text-green-500' : 'text-red-500'}>
                  {isPositive24h ? '+' : ''}{priceChangePercent.toFixed(2)}%
                </span>
              }
            />
            {/* ... StatItem อื่นๆ เหมือนเดิม ... */}
            <StatItem label="24h High" value={data ? parseFloat(data.highPrice).toFixed(2) : '...'} />
            <StatItem label="24h Low" value={data ? parseFloat(data.lowPrice).toFixed(2) : '...'} />
            <StatItem label={`24h Volume (${symbol.replace('USDT', '')})`} value={formatCompact(data?.volume)} />
            <StatItem label={`24h Volume (USDT)`} value={formatCompact(data?.quoteVolume)} />
          </div>

          <div className="flex items-center">
            <DarkModeToggle />
          </div>
        </div>
      </div>

      <SymbolSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeSymbol={symbol}
      />
    </>
  );
};
// --- END: MODIFIED SECTION ---

export default TradeTopBar;