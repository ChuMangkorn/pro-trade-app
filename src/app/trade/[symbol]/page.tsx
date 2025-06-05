import React from 'react';
import TradingLayout from '@/components/layout/TradingLayout';

interface PageProps {
  params: {
    symbol: string;
  };
}

export default function TradeSymbolPage({ params }: PageProps) {
  // params.symbol will be BTCUSDT, ETHUSDT, etc.
  return <TradingLayout symbol={params.symbol} />;
}
