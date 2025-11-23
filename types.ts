export interface Candle {
  time: number; // Unix timestamp in seconds for Lightweight Charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  volume: number;
  marketCap: number; // In billions
  peRatio: number;
}

export enum ChartType {
  CANDLE = 'Candle',
  AREA = 'Area',
  LINE = 'Line',
}

export interface Watchlist {
  id: string;
  name: string;
  symbols: string[];
}

export interface Indicator {
  id: string;
  type: 'SMA' | 'EMA' | 'RSI' | 'BB' | 'VWAP' | 'PineScript' | 'MACD' | 'Volume' | 'Stochastic';
  name: string;
  period?: number;
  stdDev?: number; // For BB
  fastPeriod?: number; // For MACD
  slowPeriod?: number; // For MACD
  signalPeriod?: number; // For MACD
  kPeriod?: number; // For Stoch
  dPeriod?: number; // For Stoch
  slowing?: number; // For Stoch
  color: string;
  lineWidth?: number;
  pineCode?: string; // Stored script
  visible: boolean;
  paneIndex?: number; // For stacking order
}

export interface Layout {
  id: string;
  name: string;
  indicators: Indicator[];
  timeframe: string;
}

export interface Overlay {
  id: string;
  symbol: string;
  data: Candle[];
  color: string;
}

export interface GamePlan {
  symbol: string;
  setup: string; // "Bull Flag", "Support Bounce", etc.
  entry: number;
  stopLoss: number;
  target: number;
  maxLoss: number; // Dollar amount
  notes: string;
  updatedAt: number;
  // Calculated (not necessarily stored, but good for type safety in UI)
  riskReward?: number;
  positionSize?: number;
}

export interface AnalysisResult {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  score: number;
  summary: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
}

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  time: string;
}