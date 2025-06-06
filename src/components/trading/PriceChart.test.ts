import { calculateSMA, getTimeframeMilliseconds, ChartKlineData } from '../../utils/chart';

describe('getTimeframeMilliseconds', () => {
  it('returns milliseconds for minute and hour timeframes', () => {
    expect(getTimeframeMilliseconds('1m')).toBe(60 * 1000);
    expect(getTimeframeMilliseconds('15m')).toBe(15 * 60 * 1000);
    expect(getTimeframeMilliseconds('1h')).toBe(60 * 60 * 1000);
    expect(getTimeframeMilliseconds('4h')).toBe(4 * 60 * 60 * 1000);
  });

  it('returns milliseconds for day and week', () => {
    expect(getTimeframeMilliseconds('1d')).toBe(24 * 60 * 60 * 1000);
    expect(getTimeframeMilliseconds('1w')).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns null for invalid input', () => {
    expect(getTimeframeMilliseconds('abc')).toBeNull();
  });
});

describe('calculateSMA', () => {
  const sample: ChartKlineData[] = [
    { time: 1 as any, open: 0, high: 0, low: 0, close: 1, volume: 0 },
    { time: 2 as any, open: 0, high: 0, low: 0, close: 2, volume: 0 },
    { time: 3 as any, open: 0, high: 0, low: 0, close: 3, volume: 0 },
    { time: 4 as any, open: 0, high: 0, low: 0, close: 4, volume: 0 },
  ];

  it('calculates simple moving average with given period', () => {
    const result = calculateSMA(sample, 2);
    expect(result).toEqual([
      { time: 2 as any, value: 1.5 },
      { time: 3 as any, value: 2.5 },
      { time: 4 as any, value: 3.5 },
    ]);
  });

  it('returns empty array if not enough data', () => {
    expect(calculateSMA(sample.slice(0, 1), 2)).toEqual([]);
  });
});
