import React from 'react';
import TradingLayout from '@/components/layout/TradingLayout';

// Add this function to help Next.js with type inference for params
export async function generateStaticParams() {
  // We can return a default or popular symbol,
  // or even an empty array if we don't need static generation.
  // This helps fix the type issue during the build.
  return [{ symbol: 'BTCUSDT' }];
}

type PageProps = {
  params: { symbol: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function TradeSymbolPage({ params }: PageProps) {
  // params.symbol will be 'BTCUSDT', 'ETHUSDT', etc.
  return <TradingLayout symbol={params.symbol} />;
}