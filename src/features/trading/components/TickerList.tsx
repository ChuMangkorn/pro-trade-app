'use client';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTickerStream, MiniTicker } from '@/hooks/useTickerStream';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { FixedSizeList as List } from 'react-window';

// --- Helper Components ---
const FavoriteStar: React.FC<{ isFavorite: boolean; onClick: (e: React.MouseEvent) => void; }> = ({ isFavorite, onClick }) => (
  <button
    onClick={onClick}
    className="w-5 h-5 flex items-center justify-center text-[var(--color-binance-yellow)] hover:opacity-80 transition-opacity"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={isFavorite ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  </button>
);

interface TickerItemProps {
  pair: string;
  ticker: MiniTicker | undefined;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (pair: string) => void;
  onToggleFavorite: (pair: string) => void;
}

const TickerItem: React.FC<TickerItemProps> = React.memo(({ pair, ticker, isSelected, isFavorite, onSelect, onToggleFavorite }) => {
  const priceChangePercent = useMemo(() => { if (!ticker) return 0; const openPrice = parseFloat(ticker.o); const closePrice = parseFloat(ticker.c); if (openPrice === 0) return 0; return ((closePrice - openPrice) / openPrice) * 100; }, [ticker]);
  const isPositive = priceChangePercent >= 0;
  const handleToggleFavorite = (e: React.MouseEvent) => { e.stopPropagation(); onToggleFavorite(pair); };

  // Function to format large volume numbers
  const formatVolume = (volume: string | undefined) => {
    if (!volume) return <SkeletonLoader className="w-12 h-3 inline-block" />;
    const volNum = parseFloat(volume);
    if (volNum > 1_000_000) {
      return `${(volNum / 1_000_000).toFixed(2)}M`;
    }
    if (volNum > 1_000) {
      return `${(volNum / 1_000).toFixed(2)}K`;
    }
    return volNum.toFixed(2);
  };

  return (
    <div onClick={() => onSelect(pair)} className={`grid grid-cols-[30px_1fr_1fr_1fr_1fr] gap-3 items-center w-full p-2 text-xs transition-colors cursor-pointer ${isSelected ? 'bg-white/10' : 'hover:bg-[var(--color-binance-hover)]'}`}>
      <FavoriteStar isFavorite={isFavorite} onClick={handleToggleFavorite} />
      <div className="text-left font-medium text-foreground truncate">{pair.replace(/USDT|BTC|ETH|BNB$/, '')}
        <span className="text-muted-foreground">/{pair.match(/USDT|BTC|ETH|BNB$/)?.[0]}</span>
      </div>
      <div className={`text-right font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{ticker ? parseFloat(ticker.c).toFixed(4) : <SkeletonLoader className="w-10 h-3 inline-block" />}</div>
      <div className={`text-right font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>{ticker ? `${isPositive ? '+' : ''}${priceChangePercent.toFixed(2)}%` : <SkeletonLoader className="w-10 h-3 inline-block" />}</div>
      <div className="text-right font-mono text-muted-foreground">{formatVolume(ticker?.v)}</div>
    </div>
  );
});
TickerItem.displayName = 'TickerItem';

const QuoteAssetTab: React.FC<{
  asset: string | React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ asset, isActive, onClick }) => {
  const isStar = asset === '⭐️';
  const label = isStar ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill={isActive ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ) : (
    asset
  );

  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium transition-colors outline-none ${
        isActive
          ? 'border-b-2 border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
};

const TickerList: React.FC<{ activeSymbol: string }> = ({ activeSymbol }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [allSymbols, setAllSymbols] = useState<string[]>([]);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(true);
  const [errorSymbols, setErrorSymbols] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('USDT');
  const quoteAssets = ['⭐️', 'USDT', 'BTC', 'ETH', 'BNB'];
  const [favorites, setFavorites] = useState<Set<string>>(() => { if (typeof window === 'undefined') return new Set(); const saved = localStorage.getItem('tickerFavorites'); return saved ? new Set(JSON.parse(saved)) : new Set(); });

  const listContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // Ref for search input
  const [listHeight, setListHeight] = useState(0);

  // Auto-focus the search input when the component is visible
  useEffect(() => {
    if (!isLoadingSymbols && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isLoadingSymbols]);

  useEffect(() => {
    if (listContainerRef.current) {
      const observer = new ResizeObserver(entries => entries[0] && setListHeight(entries[0].contentRect.height));
      observer.observe(listContainerRef.current);
      return () => observer.disconnect();
    }
  }, [isLoadingSymbols]);

  useEffect(() => { if (typeof window !== 'undefined') localStorage.setItem('tickerFavorites', JSON.stringify(Array.from(favorites))); }, [favorites]);
  const toggleFavorite = useCallback((pair: string) => { setFavorites(prev => { const newFavs = new Set(prev); if (newFavs.has(pair)) newFavs.delete(pair); else newFavs.add(pair); return newFavs; }); }, []);

  useEffect(() => {
    const fetchSymbols = async () => { setIsLoadingSymbols(true); setErrorSymbols(null); try { const response = await fetch('/api/symbols'); if (!response.ok) throw new Error('Failed to fetch symbols'); setAllSymbols(await response.json()); } catch (err) { setErrorSymbols(err instanceof Error ? err.message : 'Unknown error'); } finally { setIsLoadingSymbols(false); } };
    fetchSymbols();
  }, []);

  const { tickers } = useTickerStream(allSymbols);
  const handlePairSelect = (pair: string) => { if (pair !== activeSymbol) router.push(`/trade/${pair}`); };

  const filteredPairs = useMemo(() => {
    let pairsToShow: string[] = [];
    if (activeTab === '⭐️') { pairsToShow = Array.from(favorites).sort(); }
    else { pairsToShow = allSymbols.filter(p => p.endsWith(activeTab)); }
    if (searchTerm) { return pairsToShow.filter(p => p.toLowerCase().includes(searchTerm.toLowerCase())); }
    return pairsToShow;
  }, [allSymbols, searchTerm, activeTab, favorites]);

  const Row = useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
    const pair = filteredPairs[index];
    if (!pair) return null;
    return (<div style={style}><TickerItem pair={pair} ticker={tickers[pair]} isSelected={pair === activeSymbol} isFavorite={favorites.has(pair)} onSelect={handlePairSelect} onToggleFavorite={toggleFavorite} /></div>);
  }, [filteredPairs, tickers, activeSymbol, favorites, handlePairSelect, toggleFavorite]);

  const renderContent = () => {
    if (isLoadingSymbols) return <div className="p-4 text-center text-muted-foreground">Loading Markets...</div>;
    if (errorSymbols) return <div className="p-4 text-center text-red-500">Error: {errorSymbols}</div>;
    if (allSymbols.length === 0) return <div className="p-4 text-center text-muted-foreground">Could not load any markets.</div>;
    if (filteredPairs.length === 0) {
      if (activeTab === '⭐️') return <div className="p-4 text-center text-muted-foreground">Click the star icon to add a market to your favorites.</div>;
      return <div className="p-4 text-center text-muted-foreground">No markets found.</div>;
    }
    return (<div ref={listContainerRef} className="flex-1 w-full h-full min-h-0">{listHeight > 0 && (<List height={listHeight} itemCount={filteredPairs.length} itemSize={36} width="100%" className="custom-scrollbar">{Row}</List>)}</div>);
  };

  return (
    <div className="h-full flex flex-col text-foreground bg-muted p-1">
      <div className="flex-shrink-0 flex items-center border-b border-border">
        {quoteAssets.map(asset => (<QuoteAssetTab key={asset.toString()} asset={asset} isActive={activeTab === asset} onClick={() => setActiveTab(asset.toString())} />))}
      </div>
      <div className="p-2">
        <input
          ref={searchInputRef}
          type="text"
          placeholder={`Search in ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-1.5 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--color-binance-yellow)]"
        />
      </div>
      <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] gap-3 px-2 pb-1 text-xs text-muted-foreground">
        <div></div>
        <div className="text-left">Pair</div>
        <div className="text-right">Price</div>
        <div className="text-right">Change</div>
        <div className="text-right">Volume</div>
      </div>
      {renderContent()}
    </div>
  );
};

export default TickerList;