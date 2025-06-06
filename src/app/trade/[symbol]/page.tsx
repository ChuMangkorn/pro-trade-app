import React from 'react';
import TradingLayout from '@/components/layout/TradingLayout';

export async function generateStaticParams() {
  // This helps Next.js with type inference and can pre-build this page
  return [{ symbol: 'BTCUSDT' }];
}

type PageProps = {
  params: { symbol: string };
};

// 📍 FIX: เพิ่ม 'async' เข้าไปหน้า function
// การแก้ไขนี้จำเป็นสำหรับ Next.js เวอร์ชันใหม่
export default async function TradeSymbolPage({ params }: PageProps) {
  return <TradingLayout symbol={params.symbol} />;
}