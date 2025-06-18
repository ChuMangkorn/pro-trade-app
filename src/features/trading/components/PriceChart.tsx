'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';
import { init, dispose, Chart } from 'klinecharts';
import { ChartKlineData } from '@/utils/chart';

// UI สำหรับปุ่มควบคุม (เหมือนเดิม)
interface ChartControlButtonProps { isActive: boolean; onClick: () => void; children: React.ReactNode; }
const ChartControlButton: React.FC<ChartControlButtonProps> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 text-xs rounded-sm transition-colors ${isActive
        ? 'border-b-2 border-[var(--color-binance-yellow)] text-[var(--color-binance-yellow)]'
        : 'text-muted-foreground hover:text-foreground'
      }`}
  >
    {children}
  </button>
);

const PriceChart: React.FC<{ symbol: string }> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [timeframe, setTimeframe] = useState('1h');
  const isDark = useIsDarkMode();
  const { data: wsData } = useSharedBinanceWebSocket();

  // --- Effect 1: สร้างและทำลาย Chart (ทำงานครั้งเดียว) ---
  useEffect(() => {
    if (chartContainerRef.current && !chartInstanceRef.current) {
      const chart = init(chartContainerRef.current);
      chartInstanceRef.current = chart;
    }
    return () => {
      if (chartInstanceRef.current) {
        dispose(chartInstanceRef.current);
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // --- Effect 2: อัปเดต Style และ โหลดข้อมูล ---

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;


    chart.setStyles(isDark ? 'dark' : 'light');
    chart.setStyles({
      candle: {
        bar: {
          upColor: '#0ECB81',
          downColor: '#F6465D',
        },
      }
    });


    fetch(`/api/klines?symbol=${symbol}&interval=${timeframe}&limit=500`)
      .then(res => res.json())
      .then((data: ChartKlineData[]) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const formattedData = data.map(d => ({
            timestamp: d.time * 1000,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
          }));

          chart.clearData();
          chart.applyNewData(formattedData);


          const indicators = chart.getIndicators();


          if (!indicators.some(ind => ind.name === 'MA')) {
            chart.createIndicator('MA');
          }


          if (!indicators.some(ind => ind.name === 'VOL')) {
            chart.createIndicator('VOL');
          }

        }
      });

  }, [symbol, timeframe, isDark]);

  // --- Effect 3: จัดการ Real-time Update จาก @kline_1m (สำหรับสร้างแท่งเทียนใหม่) ---
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || !wsData?.kline) return;

    const kline = wsData.kline;
    chart.updateData({
      timestamp: kline.t,
      open: parseFloat(kline.o),
      high: parseFloat(kline.h),
      low: parseFloat(kline.l),
      close: parseFloat(kline.c),
      volume: parseFloat(kline.v),
    });
  }, [wsData?.kline]);

  // --- START: Effect 4 ใหม่สำหรับอัปเดตราคาล่าสุดแบบทันที ---
  useEffect(() => {
    const chart = chartInstanceRef.current;
    const latestTrade = wsData?.latestTrade;
    if (!chart || !latestTrade) return;
    
    const dataList = chart.getDataList();
    if (dataList.length === 0) return;
    
    const lastBar = dataList[dataList.length - 1];
    const tradePrice = parseFloat(latestTrade.p);

    const updatedBar = {
      ...lastBar,
      close: tradePrice,
      high: Math.max(lastBar.high, tradePrice),
      low: Math.min(lastBar.low, tradePrice),
    };
    
    chart.updateData(updatedBar);

  }, [wsData?.latestTrade]);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center space-x-2 p-1 border-b border-border">
        {['1m', '15m', '1h', '4h', '1d', '1w'].map(tf => (
          <ChartControlButton key={tf} onClick={() => setTimeframe(tf)} isActive={timeframe === tf}>
            {tf.toUpperCase()}
          </ChartControlButton>
        ))}
      </div>
      <div className="flex-grow relative overflow-hidden">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default PriceChart;