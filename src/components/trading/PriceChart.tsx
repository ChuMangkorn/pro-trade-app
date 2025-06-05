'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSharedBinanceWebSocket } from '@/context/BinanceWebSocketContext'; // Import the context hook
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  UTCTimestamp,
  ColorType,
  SeriesType,
  DeepPartial,
  LineStyleOptions,
  SeriesOptionsCommon,
  CandlestickSeriesOptions,
  ChartOptions,
  HistogramData,
  HistogramSeriesOptions,
} from 'lightweight-charts';
import { useIsDarkMode } from '@/hooks/useIsDarkMode';

interface PriceChartProps {
  symbol: string;
}

interface KlineData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ApiError {
  error: string;
}

const ChartControlButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 text-xs rounded-sm transition-colors ${isActive
      ? 'bg-white/10 text-foreground'
      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      }`}
  >
    {children}
  </button>
);



const PriceChart: React.FC<{ symbol: string }> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [historicalData, setHistoricalData] = useState<KlineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const isDark = useIsDarkMode();
  const { data: wsData } = useSharedBinanceWebSocket(); // Get real-time data from context


  const timeframes = [
    { label: '1s', value: '1s' }, { label: '1m', value: '1m' }, { label: '15m', value: '15m' }, { label: '1H', value: '1h' },
    { label: '4H', value: '4h' }, { label: '1D', value: '1d' }, { label: '1W', value: '1w' }, { label: '1M', value: '1M' }
  ];

  const getChartOptions = useCallback((isDarkTheme: boolean): DeepPartial<ChartOptions> => ({
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: isDarkTheme ? '#D1D4DC' : '#333333',
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
    },
    rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
    timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
    crosshair: { mode: 1 },
    handleScroll: true,
    handleScale: true,
  }), []);

  const getCandlestickSeriesOptions = useCallback((): DeepPartial<CandlestickSeriesOptions> => ({
    upColor: '#0ECB81', downColor: '#F6465D', borderVisible: false, wickUpColor: '#0ECB81', wickDownColor: '#F6465D',
  }), []);

  const getLineSeriesOptions = useCallback((): DeepPartial<LineStyleOptions & SeriesOptionsCommon> => ({
    color: '#387ED9', lineWidth: 2,
  }), []);

  const getVolumeSeriesOptions = useCallback((): DeepPartial<HistogramSeriesOptions> => ({
    priceFormat: { type: 'volume' }, priceScaleId: 'volume_scale',
  }), []);

  // Effect to CREATE and DESTROY chart instance - RUNS ONLY ONCE
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, getChartOptions(isDark));
    chartRef.current = chart;
    const volumeSeries = chart.addHistogramSeries(getVolumeSeriesOptions());
    volumeSeriesRef.current = volumeSeries;
    chart.priceScale('volume_scale').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 }, visible: false });
    const handleResize = () => chartRef.current?.resize(chartContainerRef.current!.clientWidth, chartContainerRef.current!.clientHeight);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Effect to apply THEME changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions(getChartOptions(isDark));
  }, [isDark, getChartOptions]);

  // Effect to apply TIMEFRAME changes to the time scale
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().applyOptions({
      secondsVisible: timeframe.endsWith('s')
    })
  }, [timeframe]);

  // Effect for fetching DATA
  useEffect(() => {
    if (!symbol || !timeframe) return;
    setIsLoading(true); setChartError(null);
    fetch(`/api/klines?symbol=${symbol}&interval=${timeframe}&limit=500`)
      .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
      .then((data: KlineData[]) => setHistoricalData(data.sort((a, b) => a.time - b.time)))
      .catch((err: ApiError) => setChartError(err.error || 'Failed to load chart data.'))
      .finally(() => setIsLoading(false));
  }, [symbol, timeframe]);

  // Effect for updating series DATA and TYPE
  useEffect(() => {
    if (!chartRef.current || historicalData.length === 0) return;
    const seriesTypeToSet = chartType === 'candle' ? 'Candlestick' : 'Line';
    if (!seriesRef.current || seriesRef.current.seriesType() !== seriesTypeToSet) {
      if (seriesRef.current) chartRef.current.removeSeries(seriesRef.current);
      if (chartType === 'candle') {
        seriesRef.current = chartRef.current.addCandlestickSeries(getCandlestickSeriesOptions());
      } else {
        seriesRef.current = chartRef.current.addLineSeries(getLineSeriesOptions());
      }
    }
    if (seriesRef.current.seriesType() === 'Candlestick') {
      (seriesRef.current as ISeriesApi<'Candlestick'>).setData(historicalData as CandlestickData[]);
    } else {
      (seriesRef.current as ISeriesApi<'Line'>).setData(historicalData.map(d => ({ time: d.time, value: d.close })));
    }
    if (volumeSeriesRef.current) {
      const volumeData: HistogramData[] = historicalData.map(d => ({
        time: d.time, value: d.volume, color: d.close >= d.open ? 'rgba(14, 203, 129, 0.4)' : 'rgba(246, 70, 93, 0.4)'
      }));
      volumeSeriesRef.current.setData(volumeData);
    }
    chartRef.current.timeScale().fitContent();
  }, [historicalData, chartType, getCandlestickSeriesOptions, getLineSeriesOptions]);

  useEffect(() => {
    const kline = wsData?.kline;
    if (kline && seriesRef.current && seriesRef.current.seriesType() === 'Candlestick') {
      const candleStickSeries = seriesRef.current as ISeriesApi<'Candlestick'>;
      candleStickSeries.update({
        time: kline.t as UTCTimestamp,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c)
      });
    }
  }, [wsData?.kline]); // Dependency on the kline data from WebSocket

  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center space-x-4 p-1 border-b border-border">
        <div className="flex items-center space-x-1">
          {timeframes.map(tf => (
            <ChartControlButton key={tf.value} onClick={() => setTimeframe(tf.value)} isActive={timeframe === tf.value}>
              {tf.label}
            </ChartControlButton>
          ))}
        </div>
        <div className="flex items-center space-x-1 border-l border-border pl-2">
          <ChartControlButton onClick={() => setChartType('candle')} isActive={chartType === 'candle'}>Candles</ChartControlButton>
          <ChartControlButton onClick={() => setChartType('line')} isActive={chartType === 'line'}>Line</ChartControlButton>
        </div>
      </div>
      <div className="flex-grow relative">
        {(isLoading || chartError) && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            {isLoading ? 'Loading Chart...' : `Error: ${chartError}`}
          </div>
        )}
        <div ref={chartContainerRef} className={`w-full h-full ${isLoading || chartError ? 'invisible' : ''}`} />
      </div>
    </div>
  );
};

export default PriceChart;