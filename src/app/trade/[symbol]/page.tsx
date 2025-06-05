import React from 'react';
import TradingLayout from '@/components/layout/TradingLayout';

export default function TradeSymbolPage({ params }: { params: { symbol: string } }) {
  // params.symbol จะเป็น BTCUSDT, ETHUSDT ฯลฯ
  return <TradingLayout symbol={params.symbol} />;
}
