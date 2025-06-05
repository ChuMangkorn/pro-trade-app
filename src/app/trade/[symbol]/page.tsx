import React from 'react';
import TradingLayout from '@/components/layout/TradingLayout';

// Define a more explicit type for the page props
type PageProps = {
  params: { symbol: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function TradeSymbolPage({ params }: PageProps) {
  // params.symbol will be 'BTCUSDT', 'ETHUSDT', etc.
  return <TradingLayout symbol={params.symbol} />;
}