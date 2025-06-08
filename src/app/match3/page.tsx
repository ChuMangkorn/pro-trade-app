'use client';
import dynamic from 'next/dynamic';

const Match3Game = dynamic(() => import('@/game/Match3Game'), { ssr: false });

export default function Match3Page() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <Match3Game />
    </div>
  );
}
