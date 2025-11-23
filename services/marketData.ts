import { Candle, Ticker } from '../types';

// Helper to generate a random walk candle
export const generateNextCandle = (prev: Candle, volatility: number = 0.002): Candle => {
  const change = prev.close * (Math.random() - 0.5) * volatility * 2;
  const close = prev.close + change;
  const high = Math.max(prev.close, close) * (1 + Math.random() * volatility);
  const low = Math.min(prev.close, close) * (1 - Math.random() * volatility);
  const open = prev.close; // Gapless for simplicity

  return {
    time: prev.time + 60, // Add 1 minute
    open,
    high,
    low,
    close,
    volume: Math.floor(Math.random() * 10000) + 1000,
  };
};

export const generateInitialData = (count: number = 1000, startPrice: number = 150): Candle[] => {
  let time = Math.floor(Date.now() / 1000) - count * 60;
  const data: Candle[] = [];
  let currentPrice = startPrice;

  for (let i = 0; i < count; i++) {
    const volatility = 0.005; // 0.5% volatility
    const change = currentPrice * (Math.random() - 0.5) * volatility;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (Math.random() * currentPrice * 0.002);
    const low = Math.min(open, close) - (Math.random() * currentPrice * 0.002);
    
    data.push({
      time,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 50000) + 5000,
    });
    
    currentPrice = close;
    time += 60;
  }
  return data;
};

// Indicator Calculations
export const calculateSMA = (data: Candle[] | { time: number; value: number }[], period: number): { time: number; value: number }[] => {
  const smaData = [];
  // Handle both Candle objects and simple value objects
  const getValue = (item: any) => item.close !== undefined ? item.close : item.value;

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + getValue(val), 0);
    smaData.push({
      time: data[i].time,
      value: sum / period,
    });
  }
  return smaData;
};

export const calculateEMA = (data: Candle[], period: number): { time: number; value: number }[] => {
  const k = 2 / (period + 1);
  const emaData = [];
  if (data.length === 0) return [];
  
  let ema = data[0].close; 

  // Fast forward to period
  for (let i = 0; i < data.length; i++) {
      ema = data[i].close * k + ema * (1 - k);
      if (i >= period - 1) {
          emaData.push({ time: data[i].time, value: ema });
      }
  }
  return emaData;
};

export const calculateRSI = (data: Candle[], period: number = 14): { time: number; value: number }[] => {
  if (data.length <= period) return [];
  const rsiData = [];
  let gains = 0;
  let losses = 0;

  // Initial calculation
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    let gain = change > 0 ? change : 0;
    let loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

    rsiData.push({ time: data[i].time, value: rsi });
  }
  return rsiData;
};

export const calculateBollingerBands = (data: Candle[], period: number = 20, stdDevMultiplier: number = 2) => {
    const bands = [];
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const mean = slice.reduce((sum, item) => sum + item.close, 0) / period;
        
        const squaredDiffs = slice.map(item => Math.pow(item.close - mean, 2));
        const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / period;
        const stdDev = Math.sqrt(variance);

        bands.push({
            time: data[i].time,
            upper: mean + (stdDev * stdDevMultiplier),
            lower: mean - (stdDev * stdDevMultiplier),
            basis: mean
        });
    }
    return bands;
};

export const calculateVWAP = (data: Candle[]) => {
    const vwapData = [];
    let cumTPV = 0;
    let cumVol = 0;
    
    // In a real app, VWAP resets daily. Here we just run it continuously for the dataset
    for (const candle of data) {
        const typicalPrice = (candle.high + candle.low + candle.close) / 3;
        cumTPV += typicalPrice * candle.volume;
        cumVol += candle.volume;
        
        vwapData.push({
            time: candle.time,
            value: cumTPV / cumVol
        });
    }
    return vwapData;
};

export const calculateMACD = (data: Candle[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
    const emaFast = calculateEMA(data, fastPeriod);
    const emaSlow = calculateEMA(data, slowPeriod);
    
    // Synchronize arrays by time
    const macdLine: {time: number, value: number}[] = [];
    
    // Map for quick lookup
    const slowMap = new Map(emaSlow.map(i => [i.time, i.value]));

    for(const fast of emaFast) {
        const slowVal = slowMap.get(fast.time);
        if (slowVal !== undefined) {
            macdLine.push({
                time: fast.time,
                value: fast.value - slowVal
            });
        }
    }

    // Calculate Signal Line (EMA of MACD Line)
    const k = 2 / (signalPeriod + 1);
    const signalData: {time: number, value: number}[] = [];
    if(macdLine.length >= signalPeriod) {
        let ema = macdLine[0].value;
        for(let i=0; i<macdLine.length; i++) {
            ema = macdLine[i].value * k + ema * (1-k);
             if(i >= signalPeriod - 1) {
                signalData.push({ time: macdLine[i].time, value: ema });
             }
        }
    }

    // Calculate Histogram
    const histogram: {time: number, value: number, color: string}[] = [];
    const signalMap = new Map(signalData.map(s => [s.time, s.value]));

    for(const macd of macdLine) {
        const sig = signalMap.get(macd.time);
        if (sig !== undefined) {
             const histVal = macd.value - sig;
             histogram.push({
                 time: macd.time,
                 value: histVal,
                 color: histVal >= 0 ? '#26a69a' : '#ef5350'
             });
        }
    }

    return { macd: macdLine, signal: signalData, histogram };
};

export const calculateStochastic = (data: Candle[], kPeriod: number = 14, dPeriod: number = 3, slowing: number = 3) => {
    const stochData: { time: number, k: number, d: number }[] = [];
    
    for (let i = kPeriod - 1; i < data.length; i++) {
        // High/Low over period
        const periodData = data.slice(i - kPeriod + 1, i + 1);
        const highestHigh = Math.max(...periodData.map(c => c.high));
        const lowestLow = Math.min(...periodData.map(c => c.low));
        const currentClose = data[i].close;

        const rawK = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
        
        stochData.push({
            time: data[i].time,
            k: isNaN(rawK) ? 50 : rawK, // handle flat market
            d: 0 // placeholder
        });
    }

    // Apply Slowing (SMA to %K)
    const slowedK: {time: number, value: number}[] = [];
    if (slowing > 1) {
        for (let i = slowing - 1; i < stochData.length; i++) {
            const sum = stochData.slice(i - slowing + 1, i + 1).reduce((acc, val) => acc + val.k, 0);
            slowedK.push({ time: stochData[i].time, value: sum / slowing });
        }
    } else {
        slowedK.push(...stochData.map(s => ({ time: s.time, value: s.k })));
    }

    // Calculate %D (SMA of %K)
    const finalData: { time: number, k: number, d: number }[] = [];
    for (let i = dPeriod - 1; i < slowedK.length; i++) {
        const sumD = slowedK.slice(i - dPeriod + 1, i + 1).reduce((acc, val) => acc + val.value, 0);
        finalData.push({
            time: slowedK[i].time,
            k: slowedK[i].value,
            d: sumD / dPeriod
        });
    }

    return finalData;
};

// Simulated Tickers Extended
export const MOCK_TICKERS: Ticker[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 1.23, changePercent: 0.75, sector: 'Technology', volume: 50000000, marketCap: 2800, peRatio: 28 },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 320.12, change: -2.10, changePercent: -0.65, sector: 'Technology', volume: 25000000, marketCap: 2400, peRatio: 32 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 138.50, change: 0.90, changePercent: 0.65, sector: 'Technology', volume: 20000000, marketCap: 1700, peRatio: 24 },
  { symbol: 'AMZN', name: 'Amazon.com', price: 128.33, change: 0.45, changePercent: 0.35, sector: 'Consumer Cyclical', volume: 35000000, marketCap: 1300, peRatio: 40 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 245.67, change: -5.43, changePercent: -2.15, sector: 'Consumer Cyclical', volume: 100000000, marketCap: 750, peRatio: 60 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 460.10, change: 12.30, changePercent: 2.75, sector: 'Technology', volume: 45000000, marketCap: 1100, peRatio: 90 },
  { symbol: 'JPM', name: 'JPMorgan Chase', price: 145.20, change: -0.50, changePercent: -0.34, sector: 'Financial', volume: 9000000, marketCap: 420, peRatio: 10 },
  { symbol: 'V', name: 'Visa Inc.', price: 240.10, change: 1.10, changePercent: 0.46, sector: 'Financial', volume: 6000000, marketCap: 480, peRatio: 28 },
  { symbol: 'WMT', name: 'Walmart Inc.', price: 160.50, change: 0.20, changePercent: 0.12, sector: 'Consumer Defensive', volume: 5000000, marketCap: 430, peRatio: 22 },
  { symbol: 'PG', name: 'Procter & Gamble', price: 152.00, change: -0.10, changePercent: -0.05, sector: 'Consumer Defensive', volume: 4000000, marketCap: 360, peRatio: 24 },
  { symbol: 'XOM', name: 'Exxon Mobil', price: 110.20, change: 1.50, changePercent: 1.35, sector: 'Energy', volume: 12000000, marketCap: 440, peRatio: 8 },
  { symbol: 'CVX', name: 'Chevron Corp', price: 160.80, change: 0.80, changePercent: 0.50, sector: 'Energy', volume: 8000000, marketCap: 300, peRatio: 9 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', price: 155.50, change: 0.30, changePercent: 0.19, sector: 'Healthcare', volume: 7000000, marketCap: 400, peRatio: 16 },
  { symbol: 'PFE', name: 'Pfizer Inc.', price: 33.20, change: -0.20, changePercent: -0.60, sector: 'Healthcare', volume: 20000000, marketCap: 190, peRatio: 12 },
];