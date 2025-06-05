'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
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

// Define a type for the k-line data we expect from our API
interface KlineData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState('60'); // Default to 1h (mapped to '1h' for API)
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [historicalData, setHistoricalData] = useState<KlineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [isChartReady, setIsChartReady] = useState(false); // New state for chart readiness

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const isDark = useIsDarkMode();

  // Memoized options getters
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
      mode: 1, // Magnet mode for crosshair
    },
    rightPriceScale: {
      borderColor: isDarkTheme ? '#363A45' : '#C5C5C5',
    },
    timeScale: {
      borderColor: isDarkTheme ? '#363A45' : '#C5C5C5',
      timeVisible: true,
      secondsVisible: false,
    },
    // Handle resize gracefully
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

  const getVolumeSeriesOptions = useCallback((isDarkTheme: boolean): DeepPartial<HistogramSeriesOptions> => ({
    priceFormat: {
      type: 'volume',
    },
    priceScaleId: 'volume_scale', // Use a separate price scale for volume
    // We will set color per bar, so a single color is not needed here.
    // However, we can define a default that won't be used if data provides color.
    color: '#26a69a', 
  }), []);

  const getLineSeriesOptions = useCallback((isDarkTheme: boolean): DeepPartial<LineStyleOptions & SeriesOptionsCommon> => ({
    color: isDarkTheme ? '#2962FF' : '#2196F3',
    lineWidth: 2,
  }), []);

  // Effect for chart creation and destruction (runs when symbol changes)
  useEffect(() => {
    if (!chartContainerRef.current || !symbol) {
      setIsChartReady(false);
      return;
    }

    console.log(`[ChartFX] Creating chart for symbol: ${symbol}`);
    setIsChartReady(false); // Mark as not ready before creating/re-creating
    if (chartRef.current) {
      console.log('[ChartFX] Removing previous chart instance.');
      chartRef.current.remove();
      chartRef.current = null;
    }
    if (seriesRef.current) { // Clear series ref if chart is re-created
      seriesRef.current = null;
    }
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current = null;
    }

    const chartOptions = getChartOptions(isDark); // Get options with current isDark state
    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;
    console.log('[ChartFX] Chart object created:', chartRef.current);

    // Add volume series with its own price scale
    const volumeSeries = chart.addHistogramSeries(getVolumeSeriesOptions(isDark));
    volumeSeriesRef.current = volumeSeries;
    
    // Configure the price scale for the volume series to sit at the bottom
    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: {
        top: 0.8, // 80% of the chart height for the main price scale
        bottom: 0,
      },
      // Hide the price labels for the volume scale
      visible: false,
    });

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        console.log(`[ChartFX Resize] Resizing chart to ${width}x${height}`);
        if (width > 0 && height > 0) {
          chartRef.current.resize(width, height);
        } else {
          console.warn('[ChartFX Resize] Container has zero width or height. Not resizing.');
        }
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    setIsChartReady(true);
    console.log('[ChartFX] Chart is now ready.');

    return () => {
      console.log(`[ChartFX] Cleaning up chart for symbol: ${symbol}`);
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      setIsChartReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]); // Only re-create chart if symbol changes. Initial theme is set via getChartOptions(isDark).

  // Effect to apply theme options when isDark changes (and chart is ready)
  useEffect(() => {
    if (!isChartReady || !chartRef.current) return;
    console.log(`[ChartFX] Applying theme. Dark mode: ${isDark}`);
    chartRef.current.applyOptions(getChartOptions(isDark));

    if (seriesRef.current) {
      const currentSeriesType = seriesRef.current.seriesType();
      let optionsToApply: DeepPartial<SeriesOptionsMap[typeof currentSeriesType]>;
      if (currentSeriesType === 'Candlestick') optionsToApply = getCandlestickSeriesOptions(isDark);
      else if (currentSeriesType === 'Line') optionsToApply = getLineSeriesOptions(isDark);
      else return;
      seriesRef.current.applyOptions(optionsToApply);
    }

    if (volumeSeriesRef.current) {
      // The volume series does not have dark/light specific options in our case, but if it did, they would be applied here.
      // e.g., volumeSeriesRef.current.applyOptions(getVolumeSeriesOptions(isDark));
    }
  }, [isDark, isChartReady, getChartOptions, getCandlestickSeriesOptions, getLineSeriesOptions, getVolumeSeriesOptions]);

  // Effect for fetching historical data
  useEffect(() => {
    if (!symbol || !timeframe) return;
    console.log(`[ChartFX] Fetching data for ${symbol}, timeframe ${timeframe}`);
    setIsLoading(true); setChartError(null); setHistoricalData([]);
    fetch(`/api/klines?symbol=${symbol}&interval=${timeframe}&limit=500`)
      .then(res => {
        if (!res.ok) throw res.json().then(err => new Error(err.error || `API Error: ${res.statusText}`));
        return res.json();
      })
      .then((data: KlineData[]) => setHistoricalData(data.sort((a, b) => a.time - b.time)))
      .catch(err => {
        console.error('[ChartFX] Error fetching historical data:', err);
        setChartError(err.message);
      })
      .finally(() => setIsLoading(false));
  }, [symbol, timeframe]);

  // Effect for creating or updating series
  useEffect(() => {
    if (!isChartReady || !chartRef.current) {
      console.log('[ChartFX Series] Chart not ready.');
      return;
    }
    console.log(`[ChartFX Series] Processing. Data: ${historicalData.length}, Type: ${chartType}, Dark: ${isDark}`);

    if (!historicalData || historicalData.length === 0) {
      if (seriesRef.current) {
        console.log('[ChartFX Series] No data, removing existing series.');
        chartRef.current.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
      if (volumeSeriesRef.current) {
        console.log('[ChartFX Series] No data, removing existing volume series.');
        chartRef.current.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }
      return;
    }

    const seriesTypeToSet = chartType === 'candle' ? 'Candlestick' : 'Line';
    if (!seriesRef.current || seriesRef.current.seriesType() !== seriesTypeToSet) {
      if (seriesRef.current) {
        console.log('[ChartFX Series] Chart type changed or no series, removing old series.');
        chartRef.current.removeSeries(seriesRef.current);
        seriesRef.current = null;
      }
      console.log('[ChartFX Series] Attempting to add new series. Chart object:', chartRef.current);
      if (chartRef.current) {
        console.log('[ChartFX Series] Type of addCandlestickSeries:', typeof (chartRef.current as any).addCandlestickSeries);
        console.log('[ChartFX Series] Type of addLineSeries:', typeof (chartRef.current as any).addLineSeries);
      }
      let newSeries: ISeriesApi<SeriesType> | null = null;
      if (chartType === 'candle') {
        newSeries = chartRef.current.addCandlestickSeries(getCandlestickSeriesOptions(isDark));
        console.log('[ChartFX Series] Candlestick series created:', newSeries);
      } else if (chartType === 'line') {
        newSeries = chartRef.current.addLineSeries(getLineSeriesOptions(isDark));
        console.log('[ChartFX Series] Line series created:', newSeries);
      }
      seriesRef.current = newSeries;
    }

    if (seriesRef.current) {
      console.log('[ChartFX Series] Updating data for main series.');
      if (seriesRef.current.seriesType() === 'Candlestick') {
        (seriesRef.current as ISeriesApi<'Candlestick'>).setData(historicalData as CandlestickData[]);
      } else if (seriesRef.current.seriesType() === 'Line') {
        (seriesRef.current as ISeriesApi<'Line'>).setData(historicalData.map(d => ({ time: d.time, value: d.close })));
      }
    } else {
      console.log('[ChartFX Series] No main series available to update data.');
    }
    
    if (volumeSeriesRef.current) {
      console.log('[ChartFX Series] Updating data for volume series.');
      const volumeData: HistogramData[] = historicalData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open 
          ? 'rgba(8, 153, 129, 0.5)' // Green with transparency
          : 'rgba(242, 54, 69, 0.5)' // Red with transparency
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [isChartReady, historicalData, chartType, isDark, getCandlestickSeriesOptions, getLineSeriesOptions, getVolumeSeriesOptions]);

  // New effect: Explicitly resize chart when it becomes visible after loading
  useEffect(() => {
    if (isChartReady && !isLoading && !chartError && chartRef.current && chartContainerRef.current) {
      const width = chartContainerRef.current.clientWidth;
      const height = chartContainerRef.current.clientHeight;
      console.log(`[ChartFX Visibility] Chart should be visible. Attempting resize to ${width}x${height}.`);
      if (width > 0 && height > 0) {
        chartRef.current.resize(width, height);
        // It's also good practice to fit content after a resize that might have occurred
        // when the chart had no data or incorrect dimensions, especially if series were set while hidden.
        chartRef.current.timeScale().fitContent();
        console.log('[ChartFX Visibility] Resize and fitContent called.');
      } else {
        console.warn('[ChartFX Visibility] Container has zero dimensions when attempting visibility resize.');
      }
    }
  }, [isChartReady, isLoading, chartError]); // Dependencies ensure this runs when visibility conditions change

  const timeframes = [
    { label: '1M', value: '1' },
    { label: '5M', value: '5' },
    { label: '15M', value: '15' },
    { label: '30M', value: '30' },
    { label: '1H', value: '60' },
    { label: '4H', value: '240' },
    { label: '1D', value: 'D' },
  ];

  const chartVisible = !isLoading && !chartError;
  console.log(`[ChartFX Render] isLoading: ${isLoading}, chartError: ${chartError}, chartVisible (derived): ${chartVisible}`);

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <div className="flex flex-wrap justify-between items-center p-2 border-b border-border">
        <div className="flex space-x-1">
          <button
            onClick={() => setChartType('candle')}
            className={`px-2 py-1 text-xs rounded ${
              chartType === 'candle'
                ? 'bg-blue-500 text-white'
                : 'bg-muted hover:bg-muted-foreground/20 text-foreground'
            }`}
          >
            Candles
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-2 py-1 text-xs rounded ${
              chartType === 'line'
                ? 'bg-blue-500 text-white'
                : 'bg-muted hover:bg-muted-foreground/20 text-foreground'
            }`}
          >
            Line
          </button>
        </div>
        <div className="flex space-x-1 flex-wrap">
          {timeframes.map(tf => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2 py-1 text-xs rounded ${
                timeframe === tf.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-muted hover:bg-muted-foreground/20 text-foreground'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <SkeletonLoader className="w-32 h-8" />
        </div>
      )}
      {chartError && !isLoading && (
        <div className="flex-grow flex items-center justify-center text-red-500">
          <p>Error loading chart data: {chartError}</p>
        </div>
      )}
      <div 
        ref={chartContainerRef} 
        className={`w-full flex-grow ${isLoading || chartError ? 'hidden' : ''}`} 
        style={{ minHeight: '300px' }}
      />
    </div>
  );
};

export default PriceChart;