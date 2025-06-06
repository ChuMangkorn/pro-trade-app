import { UTCTimestamp } from 'lightweight-charts';

export interface ChartKlineData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const getTimeframeMilliseconds = (tf: string): number | null => {
  const value = parseInt(tf.replace(/[a-zA-Z]/g, ''));
  if (isNaN(value)) return null;
  const unit = tf.slice(-1).toUpperCase();
  switch (unit) {
    case 'M':
      return value * 60 * 1000;
    case 'H':
      return value * 3600 * 1000;
    case 'D':
      return value * 86400000;
    case 'W':
      return value * 7 * 86400000;
    default:
      return null;
  }
};

export const calculateSMA = (
  data: ChartKlineData[],
  period: number
): { time: UTCTimestamp; value: number }[] => {
  if (!data || data.length < period) return [];
  const smaData: { time: UTCTimestamp; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    smaData.push({ time: data[i].time, value: sum / period });
  }
  return smaData;
};
