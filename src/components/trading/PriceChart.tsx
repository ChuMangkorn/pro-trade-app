'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext';
import {
  createChart, IChartApi, ISeriesApi,
  CandlestickData, UTCTimestamp, ColorType, SeriesType,
  DeepPartial, LineStyleOptions, SeriesOptionsCommon,
  CandlestickSeriesOptions, ChartOptions, HistogramData, HistogramSeriesOptions,
  Time, PriceLineOptions, IPriceLine, LineStyle,
} from 'lightweight-charts';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

// --- Interfaces, Helpers, and Components ---
interface ChartKlineData { time: UTCTimestamp; open: number; high: number; low: number; close: number; volume: number; }
interface ChartControlButtonProps { isActive: boolean; onClick: () => void; children: React.ReactNode; }

const ChartControlButton: React.FC<ChartControlButtonProps> = ({ isActive, onClick, children }) => (
  <button onClick={onClick} className={`px-2 py-1 text-xs rounded-sm transition-colors ${isActive ? 'bg-white/10 text-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
    {children}
  </button>
);

const getTimeframeMilliseconds = (tf: string): number | null => {
  const value = parseInt(tf.replace(/[a-zA-Z]/g, ''));
  if (isNaN(value)) {
    if (tf.toUpperCase() === '1D') return 86400000;
    if (tf.toUpperCase() === '1W') return 604800000;
    return null;
  }
  const unit = tf.slice(-1).toUpperCase();
  switch (unit) {
    case 'M': return value * 60 * 1000;
    case 'H': return value * 3600 * 1000;
    default: return null;
  }
};

// 📍 1. ฟังก์ชันสำหรับคำนวณ SMA
const calculateSMA = (data: ChartKlineData[], period: number): { time: UTCTimestamp; value: number }[] => {
  if (!data || data.length < period) return [];
  let smaData: { time: UTCTimestamp; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    smaData.push({ time: data[i].time, value: sum / period });
  }
  return smaData;
};


const PriceChart: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [historicalData, setHistoricalData] = useState<ChartKlineData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // 📍 2. เพิ่ม State และ Ref สำหรับ SMA
  const [smaPeriod, setSmaPeriod] = useState(20);
  const [smaData, setSmaData] = useState<{ time: UTCTimestamp; value: number }[]>([]);
  const smaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lastBarRef = useRef<ChartKlineData | null>(null);
  const currentPriceLineRef = useRef<IPriceLine | null>(null);

  const isDark = useIsDarkMode();
  const { data: wsData } = useSharedBinanceWebSocket();

  const timeframes = [{ label: '1m', value: '1m' }, { label: '15m', value: '15m' }, { label: '1H', value: '1h' }, { label: '4H', value: '4h' }, { label: '1D', value: '1d' }, { label: '1W', value: '1w' }];
  const chartOptions = useCallback((isDarkTheme: boolean): DeepPartial<ChartOptions> => ({ layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: isDarkTheme ? '#D1D4DC' : '#333333' }, grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } }, rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' }, timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true }, crosshair: { mode: 1 }, handleScroll: true, handleScale: true }), []);
  const candlestickSeriesOptions = useCallback((): DeepPartial<CandlestickSeriesOptions> => ({ upColor: '#0ECB81', downColor: '#F6465D', borderVisible: false, wickUpColor: '#0ECB81', wickDownColor: '#F6465D' }), []);
  const lineSeriesOptions = useCallback((): DeepPartial<LineStyleOptions & SeriesOptionsCommon> => ({ color: '#387ED9', lineWidth: 2 }), []);
  const volumeSeriesOptions = useCallback((): DeepPartial<HistogramSeriesOptions> => ({ priceFormat: { type: 'volume' }, priceScaleId: 'volume_scale' }), []);

  // --- useEffect Hooks ---

  // Effect 1: Chart Creation
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, chartOptions(isDark));
    chartRef.current = chart;
    const handleResize = () => { if (chartRef.current) chartRef.current.resize(chartContainerRef.current!.clientWidth, chartContainerRef.current!.clientHeight) };
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; } };
  }, [symbol]);

  // Effect 2: Theme & TimeScale Update
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions(chartOptions(isDark));
    chartRef.current.timeScale().applyOptions({ secondsVisible: timeframe.includes('m') || timeframe.toUpperCase().includes('H'), rightOffset: 7 });
  }, [isDark, timeframe, chartOptions]);

  // Effect 3: Data Fetching
  useEffect(() => {
    if (!symbol || !timeframe) return;
    setIsLoading(true); setChartError(null);
    fetch(`/api/klines?symbol=${symbol}&interval=${timeframe}&limit=500`)
      .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
      .then((data: ChartKlineData[]) => {
        const sortedData = data.sort((a, b) => a.time - b.time);
        setHistoricalData(sortedData);
        // 📍 3. คำนวณ SMA ทันทีที่ได้ข้อมูล
        setSmaData(calculateSMA(sortedData, smaPeriod));
      })
      .catch((err) => setChartError(err.message || 'Failed to load chart data'))
      .finally(() => setIsLoading(false));
  }, [symbol, timeframe, smaPeriod]); // เพิ่ม smaPeriod เป็น dependency

  // Effect 4: Series Management and Data Application
  useEffect(() => {
    if (!chartRef.current || isLoading) return;

    // Price Series
    if (!seriesRef.current || seriesRef.current.seriesType() !== (chartType === 'candle' ? 'Candlestick' : 'Line')) {
      if (seriesRef.current) chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = chartType === 'candle' ? chartRef.current.addCandlestickSeries(candlestickSeriesOptions()) : chartRef.current.addLineSeries(lineSeriesOptions());
      currentPriceLineRef.current = null;
    }
    // Volume Series
    if (!volumeSeriesRef.current) {
      volumeSeriesRef.current = chartRef.current.addHistogramSeries(volumeSeriesOptions());
      try { chartRef.current.priceScale('volume_scale').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 }, visible: false }); } catch (e) { }
    }
    // 📍 4. จัดการ SMA Series
    if (!smaSeriesRef.current) {
      smaSeriesRef.current = chartRef.current.addLineSeries({ color: 'rgba(240, 185, 11, 0.9)', lineWidth: 1, crosshairMarkerVisible: false, priceLineVisible: false, lastValueVisible: false });
    }

    if (!chartError && historicalData.length > 0) {
      seriesRef.current.setData(chartType === 'candle' ? historicalData : historicalData.map(d => ({ time: d.time, value: d.close })) as any);
      volumeSeriesRef.current.setData(historicalData.map(d => ({ time: d.time as Time, value: d.volume, color: d.close >= d.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)' })));
      smaSeriesRef.current.setData(smaData);
      lastBarRef.current = historicalData[historicalData.length - 1];
    } else {
      if (seriesRef.current) seriesRef.current.setData([]);
      if (volumeSeriesRef.current) volumeSeriesRef.current.setData([]);
      if (smaSeriesRef.current) smaSeriesRef.current.setData([]);
      lastBarRef.current = null;
    }
  }, [historicalData, isLoading, chartError, chartType, smaData, candlestickSeriesOptions, lineSeriesOptions, volumeSeriesOptions]);

  // Effect 5: WebSocket Real-time Updates
  useEffect(() => {
    if (!wsData || !seriesRef.current || !volumeSeriesRef.current || !smaSeriesRef.current || isLoading) return;

    // Update Price Line
    const currentPrice = parseFloat(wsData.price);
    if (currentPrice) {
      const priceLineOptions: PriceLineOptions = { price: currentPrice, color: isDark ? '#A0A0A0' : '#888', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: '', lineVisible: true, axisLabelColor: isDark ? '#1E2026' : '#F0F0F0', axisLabelTextColor: isDark ? '#D1D4DC' : '#333333' };
      if (!currentPriceLineRef.current) { currentPriceLineRef.current = seriesRef.current.createPriceLine(priceLineOptions); } else { currentPriceLineRef.current.applyOptions(priceLineOptions); }
    }

    // Aggregate Kline Data
    if (!wsData.kline) return;
    const kline1m = wsData.kline;
    const klineDataPoint: ChartKlineData = { time: kline1m.t as UTCTimestamp, open: parseFloat(kline1m.o), high: parseFloat(kline1m.h), low: parseFloat(kline1m.l), close: parseFloat(kline1m.c), volume: parseFloat(kline1m.v) };
    const currentLastBar = lastBarRef.current;
    if (!currentLastBar) return;
    const intervalMs = getTimeframeMilliseconds(timeframe);
    if (!intervalMs) return;

    let barToUpdate: ChartKlineData;
    if (klineDataPoint.time * 1000 >= currentLastBar.time * 1000 && klineDataPoint.time * 1000 < currentLastBar.time * 1000 + intervalMs) {
      barToUpdate = { ...currentLastBar, high: Math.max(currentLastBar.high, klineDataPoint.high), low: Math.min(currentLastBar.low, klineDataPoint.low), close: klineDataPoint.close, volume: currentLastBar.volume + klineDataPoint.volume };
    } else if (klineDataPoint.time * 1000 >= currentLastBar.time * 1000 + intervalMs) {
      barToUpdate = { time: (currentLastBar.time * 1000 + intervalMs) / 1000 as UTCTimestamp, open: klineDataPoint.open, high: klineDataPoint.high, low: klineDataPoint.low, close: klineDataPoint.close, volume: klineDataPoint.volume };
    } else { return; }

    seriesRef.current.update(chartType === 'candle' ? barToUpdate : { time: barToUpdate.time, value: barToUpdate.close });
    volumeSeriesRef.current.update({ time: barToUpdate.time as Time, value: barToUpdate.volume, color: barToUpdate.close >= barToUpdate.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)' });
    lastBarRef.current = barToUpdate;

    // 📍 5. คำนวณและอัปเดต SMA แบบ Real-time
    const tempHistory = [...historicalData.filter(d => d.time !== barToUpdate.time), barToUpdate];
    const newSmaPoint = calculateSMA(tempHistory, smaPeriod).pop();
    if (newSmaPoint) {
      smaSeriesRef.current.update(newSmaPoint);
    }

  }, [wsData, isLoading, timeframe, historicalData, smaPeriod, isDark]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-2 p-1 border-b border-border">
        {timeframes.map(tf => (<ChartControlButton key={tf.value} onClick={() => setTimeframe(tf.value)} isActive={timeframe === tf.value}>{tf.label}</ChartControlButton>))}
        <div className="flex items-center space-x-1 border-l border-border pl-2">
          <ChartControlButton onClick={() => setChartType('candle')} isActive={chartType === 'candle'}>Candles</ChartControlButton>
          <ChartControlButton onClick={() => setChartType('line')} isActive={chartType === 'line'}>Line</ChartControlButton>
        </div>
        {/* 📍 6. เพิ่ม UI สำหรับตั้งค่า SMA */}
        <div className="flex items-center space-x-2 border-l border-border pl-2">
          <label htmlFor="sma-period" className="text-xs text-muted-foreground">SMA:</label>
          <input id="sma-period" type="number" value={smaPeriod} onChange={(e) => setSmaPeriod(Math.max(2, parseInt(e.target.value) || 2))} className="w-14 p-1 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-yellow-500" />
        </div>
      </div>
      <div className="flex-grow relative overflow-hidden">
        {(isLoading && historicalData.length === 0) ? (<div className="absolute inset-0 flex items-center justify-center text-muted-foreground z-10">Loading Chart...</div>)
          : chartError && (<div className="absolute inset-0 flex items-center justify-center text-red-500 z-10">{`Error: ${chartError}`}</div>)}
        <div ref={chartContainerRef} className={`w-full h-full ${isLoading || chartError ? 'invisible' : ''}`} />
      </div>
    </div>
  );
};

export default PriceChart;