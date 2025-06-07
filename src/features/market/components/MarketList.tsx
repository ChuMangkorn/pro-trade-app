
'use client';
import React, { useEffect, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { marketListAtom, hasMoreAtom } from '@/atoms/marketAtoms';

export const MarketList = () => {
  const [markets, setMarkets] = useAtom(marketListAtom);
  const [hasMore, setHasMore] = useAtom(hasMoreAtom);
  const loader = useRef(null);

  const fetchMarkets = useCallback(async () => {
    const res = await fetch(`/api/markets?offset=${markets.length}`);
    const data = await res.json();
    setMarkets(prev => [...prev, ...data]);
    if (data.length === 0) setHasMore(false);
  }, [markets]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore) {
        fetchMarkets();
      }
    }, { threshold: 1 });

    if (loader.current) observer.observe(loader.current);
    return () => {
      if (loader.current) observer.disconnect();
    };
  }, [fetchMarkets, hasMore]);

  return (
    <div className="space-y-2 overflow-auto max-h-[80vh]">
      {markets.map(m => (
        <div key={m.symbol} className="flex justify-between items-center px-4 py-2 border-b">
          <span>{m.symbol}</span>
          <span className="text-green-500">{parseFloat(m.price.toString()).toFixed(4)}</span>
          <span className={m.change >= 0 ? 'text-green-500' : 'text-red-500'}>
            {m.change >= 0 ? '+' : ''}{m.change.toFixed(2)}%
          </span>
          <span>{formatVolume(m.volume)}</span>
        </div>
      ))}
      {hasMore && <div ref={loader} className="py-4 text-center text-muted-foreground">Loading more...</div>}
    </div>
  );
};

const formatVolume = (v: number) =>
  v > 1_000_000 ? (v / 1_000_000).toFixed(2) + 'M' :
  v > 1_000 ? (v / 1_000).toFixed(2) + 'K' : v.toString();
