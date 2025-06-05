'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  SeriesOptionsMap,
  HistogramData,
  HistogramSeriesOptions,
} from 'lightweight-charts';
import SkeletonLoader from '@/components/common/SkeletonLoader';
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

const PriceChart: React.FC<PriceChartProps> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState('60'); 
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [historicalData, setHistoricalData] = useState<KlineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const isDark = useIsDarkMode();

  const getChartOptions = useCallback((isDarkTheme: boolean): DeepPartial<ChartOptions> => ({
    layout: {
      background: { type: ColorType.Solid, color: isDarkTheme ? '#131722' : '#FFFFFF' },
      textColor: isDarkTheme ? '#D1D4DC' : '#333333',
    },
    grid: {
      vertLines: { color: isDarkTheme ? '#2A2E39' : '#E6E6E6' },
      horzLines: { color: isDarkTheme ? '#2A2E39' : '#E6E6E6' },
    },
    crosshair: {
      mode: 1,
    },
    rightPriceScale: {
      borderColor: isDarkTheme ? '#363A45' : '#C5C5C5',
    },
    timeScale: {
      borderColor: isDarkTheme ? '#363A45' : '#C5C5C5',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: true,
    handleScale: true,
  }), []);

  const getCandlestickSeriesOptions = useCallback((isDarkTheme: boolean): DeepPartial<CandlestickSeriesOptions> => ({
    upColor: isDarkTheme ? '#089981' : '#26a69a',
    downColor: isDarkTheme ? '#F23645' : '#ef5350',
    borderVisible: false,
    wickUpColor: isDarkTheme ? '#089981' : '#26a69a',
    wickDownColor: isDarkTheme ? '#F23645' : '#ef5350',
  }), []);

  const getVolumeSeriesOptions = useCallback((): DeepPartial<HistogramSeriesOptions> => ({
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: 'volume_scale',
    color: '#26a69a', 
  }), []);

  const getLineSeriesOptions = useCallback((isDarkTheme: boolean): DeepPartial<LineStyleOptions & SeriesOptionsCommon> => ({
    color: isDarkTheme ? '#2962FF' : '#2196F3',
    lineWidth: 2,
  }), []);

  useEffect(() => {
    if (!chartContainerRef.current || !symbol) {
      setIsChartReady(false);
      return;
    }

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    seriesRef.current = null;
    volumeSeriesRef.current = null;

    const chartOptions = getChartOptions(isDark);
    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    const volumeSeries = chart.addHistogramSeries(getVolumeSeriesOptions());
    volumeSeriesRef.current = volumeSeries;
    
    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
      visible: false,
    });

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const { clientWidth, clientHeight } = chartContainerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          chartRef.current.resize(clientWidth, clientHeight);
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    setIsChartReady(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      setIsChartReady(false);
    };
  }, [symbol, isDark, getChartOptions, getVolumeSeriesOptions]);

  useEffect(() => {
    if (!isChartReady || !chartRef.current) return;
    chartRef.current.applyOptions(getChartOptions(isDark));

    if (seriesRef.current) {
      const seriesType = seriesRef.current.seriesType();
      if (seriesType === 'Candlestick') {
        seriesRef.current.applyOptions(getCandlestickSeriesOptions(isDark));
      } else if (seriesType === 'Line') {
        seriesRef.current.applyOptions(getLineSeriesOptions(isDark));
      }
    }
  }, [isDark, isChartReady, getChartOptions, getCandlestickSeriesOptions, getLineSeriesOptions]);

  useEffect(() => {
    if (!symbol || !timeframe) return;
    
    setIsLoading(true);
    setChartError(null);
    setHistoricalData([]);

    fetch(`/api/klines?symbol=${symbol}&interval=${timeframe}&limit=500`)
      .then(res => {
        if (!res.ok) {
          return res.json().then((err: ApiError) => {
            throw new Error(err.error || `API Error: ${res.statusText}`);
          });
        }
        return res.json();
      })
      .then((data: KlineData[]) => setHistoricalData(data.sort((a, b) => a.time - b.time)))
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setChartError(err.message);
        } else {
          setChartError('An unknown error occurred');
        }
      })
      .finally(() => setIsLoading(false));
  }, [symbol, timeframe]);
  
  useEffect(() => {
    if (!isChartReady || !chartRef.current || !historicalData.length) return;

    const seriesTypeToSet = chartType === 'candle' ? 'Candlestick' : 'Line';
    if (!seriesRef.current || seriesRef.current.seriesType() !== seriesTypeToSet) {
      if (seriesRef.current) {
        chartRef.current.removeSeries(seriesRef.current);
      }
      if (chartType === 'candle') {
        seriesRef.current = chartRef.current.addCandlestickSeries(getCandlestickSeriesOptions(isDark));
      } else {
        seriesRef.current = chartRef.current.addLineSeries(getLineSeriesOptions(isDark));
      }
    }

    if (seriesRef.current.seriesType() === 'Candlestick') {
      (seriesRef.current as ISeriesApi<'Candlestick'>).setData(historicalData as CandlestickData[]);
    } else {
      (seriesRef.current as ISeriesApi<'Line'>).setData(historicalData.map(d => ({ time: d.time, value: d.close })));
    }

    if (volumeSeriesRef.current) {
      const volumeData: HistogramData[] = historicalData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(8, 153, 129, 0.5)' : 'rgba(242, 54, 69, 0.5)'
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    chartRef.current.timeScale().fitContent();
  }, [isChartReady, historicalData, chartType, isDark, getCandlestickSeriesOptions, getLineSeriesOptions]);

  useEffect(() => {
    if (isChartReady && !isLoading && !chartError && chartRef.current && chartContainerRef.current) {
      const { clientWidth, clientHeight } = chartContainerRef.current;
      if (clientWidth > 0 && clientHeight > 0) {
        chartRef.current.resize(clientWidth, clientHeight);
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [isChartReady, isLoading, chartError]);

  const timeframes = [
    { label: '1M', value: '1' }, { label: '5M', value: '5' }, { label: '15M', value: '15' },
    { label: '30M', value: '30' }, { label: '1H', value: '60' }, { label: '4H', value: '240' },
    { label: '1D', value: 'D' },
  ];

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <div className="flex flex-wrap justify-between items-center p-2 border-b border-border">
        {/* Chart Type and Timeframe selectors */}
        <div className="flex space-x-1">
          <button onClick={() => setChartType('candle')} className={`px-2 py-1 text-xs rounded ${chartType === 'candle' ? 'bg-blue-500 text-white' : 'bg-muted hover:bg-muted-foreground/20 text-foreground'}`}>Candles</button>
          <button onClick={() => setChartType('line')} className={`px-2 py-1 text-xs rounded ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-muted hover:bg-muted-foreground/20 text-foreground'}`}>Line</button>
        </div>
        <div className="flex space-x-1 flex-wrap">
          {timeframes.map(tf => <button key={tf.value} onClick={() => setTimeframe(tf.value)} className={`px-2 py-1 text-xs rounded ${timeframe === tf.value ? 'bg-blue-500 text-white' : 'bg-muted hover:bg-muted-foreground/20 text-foreground'}`}>{tf.label}</button>)}
        </div>
      </div>

      {isLoading && <div className="flex-grow flex items-center justify-center"><SkeletonLoader className="w-32 h-8" /></div>}
      {chartError && !isLoading && <div className="flex-grow flex items-center justify-center text-red-500"><p>Error: {chartError}</p></div>}
      <div ref={chartContainerRef} className={`w-full flex-grow ${isLoading || chartError ? 'hidden' : ''}`} style={{ minHeight: '300px' }} />
    </div>
  );
};

export default PriceChart;
