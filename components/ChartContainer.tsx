import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  IChartApi, 
  ISeriesApi, 
  Time, 
  CandlestickData, 
  LineData,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  MouseEventParams
} from 'lightweight-charts';
import { Candle, Indicator, Overlay } from '../types';
import { calculateSMA, calculateEMA, calculateRSI, calculateBollingerBands, calculateVWAP, calculateMACD, calculateStochastic } from '../services/marketData';

interface ChartContainerProps {
  data: Candle[];
  symbol: string;
  indicators: Indicator[];
  overlays?: Overlay[];
  theme: 'Dark' | 'Light';
  showKeyLevels?: boolean;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ data, symbol, indicators, overlays = [], theme, showKeyLevels }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  
  // Refs to store series for legend updates
  const seriesMapRef = useRef<Map<ISeriesApi<any>, { id: string, name: string, color: string }>>(new Map());
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  // Layout State for visual separators
  const [separators, setSeparators] = useState<number[]>([]);
  
  // Legend State
  const [legendData, setLegendData] = useState<{
      ohlc: { open: number, high: number, low: number, close: number, change: number } | null,
      indicators: { id: string, name: string, value: string | number, color: string }[]
  }>({ ohlc: null, indicators: [] });

  // Handle Resize
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Chart Logic: Initialization + Series + Layout in one pass to avoid sync issues
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // --- 1. SETUP LAYOUT GEOMETRY ---
    // Identify panes that need their own cell (Volume, RSI, MACD, Stoch)
    const paneIndicators = indicators.filter(i => i.visible && ['RSI', 'MACD', 'Volume', 'Stochastic'].includes(i.type));
    
    // Constants for Layout
    const TOP_MARGIN = 0.04;      // Padding at top of main chart
    const GAP_SIZE = 0.005;       // Tiny gap between cells
    const PANE_MIN_HEIGHT = 0.12; // Minimum height for an indicator pane
    const PANE_IDEAL_HEIGHT = 0.16; // Desired height for an indicator pane
    
    const totalPanes = paneIndicators.length;
    
    // Calculate space
    // If we have many panes, we shrink them slightly, but never below min height
    let paneHeight = PANE_IDEAL_HEIGHT;
    let totalPaneSpace = totalPanes * (paneHeight + GAP_SIZE);
    
    // If panes take too much space, shrink them
    if (totalPaneSpace > 0.6) {
        paneHeight = Math.max(PANE_MIN_HEIGHT, 0.6 / totalPanes);
        totalPaneSpace = totalPanes * (paneHeight + GAP_SIZE);
    }

    const mainChartHeight = 1.0 - totalPaneSpace - 0.02; // 0.02 bottom buffer
    const mainChartBottomPos = TOP_MARGIN + mainChartHeight; 
    // Actually, mainChartBottomPos should be the Y-coord (0-1) where main chart ends.
    // Let's define the grid explicitly.
    
    // Main Chart: Top: 0.04, Bottom: (1.0 - mainChartHeight) -> No, scaleMargins.bottom is margin FROM bottom.
    // So if main chart takes top 60%, bottom margin is 40%.
    const mainChartBottomMargin = 1.0 - mainChartHeight;

    // --- 2. CREATE CHART ---
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme === 'Dark' ? '#0f172a' : '#ffffff' },
        textColor: theme === 'Dark' ? '#94a3b8' : '#333',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: theme === 'Dark' ? '#1e293b' : '#e1e1e1' },
        horzLines: { color: theme === 'Dark' ? '#1e293b' : '#e1e1e1' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: theme === 'Dark' ? '#334155' : '#e2e8f0',
      },
      rightPriceScale: {
        visible: true,
        borderColor: theme === 'Dark' ? '#334155' : '#e2e8f0',
        scaleMargins: {
            top: TOP_MARGIN,
            bottom: mainChartBottomMargin, 
        }
      },
      crosshair: {
          mode: 1 // Magnet
      }
    });

    chartRef.current = chart;
    seriesMapRef.current.clear();
    
    // --- 3. ADD MAIN CANDLE SERIES ---
    // This goes onto the 'right' scale by default, which we just configured.
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e', 
      downColor: '#ef4444', 
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = candleSeries;
    
    if (data.length > 0) {
       candleSeries.setData(data.map(d => ({ ...d, time: d.time as Time })));
    }

    // --- 4. ADD INDICATORS & CONFIGURE PANES ---
    const newSeparators: number[] = [];
    
    // If we have panes, add a separator after main chart
    if (totalPanes > 0) {
        newSeparators.push(mainChartHeight);
    }

    // We track the current "cursor" position for the next pane
    // Start drawing panes right after the main chart
    let currentPaneTop = mainChartHeight + GAP_SIZE;

    indicators.forEach((ind) => {
        if (!ind.visible) return;

        const isPane = ['RSI', 'MACD', 'Volume', 'Stochastic'].includes(ind.type);
        
        if (isPane) {
            // Configure Scale for this Pane
            // top: current cursor
            // bottom: 1.0 - (current + height)
            const paneBottom = currentPaneTop + paneHeight;
            
            chart.priceScale(ind.id).applyOptions({
                scaleMargins: {
                    top: currentPaneTop,
                    bottom: Math.max(0, 1.0 - paneBottom)
                },
                visible: true,
                borderVisible: false, 
            });

            // Add visual separator line at the bottom of this pane (except last one)
            if (newSeparators.length < totalPanes) {
                newSeparators.push(paneBottom);
            }

            // Create Series on this Scale
            const scaleId = ind.id;
            
            if (ind.type === 'MACD') {
               const macdSeries = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1, priceScaleId: scaleId });
               const signalSeries = chart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 1, priceScaleId: scaleId });
               const histSeries = chart.addSeries(HistogramSeries, { priceScaleId: scaleId });
               
               const macdData = calculateMACD(data, ind.fastPeriod, ind.slowPeriod, ind.signalPeriod);
               macdSeries.setData(macdData.macd.map(d => ({ time: d.time as Time, value: d.value })));
               signalSeries.setData(macdData.signal.map(d => ({ time: d.time as Time, value: d.value })));
               histSeries.setData(macdData.histogram.map(d => ({ time: d.time as Time, value: d.value, color: d.color })));

               seriesMapRef.current.set(macdSeries, { id: ind.id, name: 'MACD', color: '#2962FF' });
               seriesMapRef.current.set(signalSeries, { id: ind.id, name: 'Signal', color: '#FF6D00' });
            
            } else if (ind.type === 'RSI') {
               const series = chart.addSeries(LineSeries, { color: ind.color, lineWidth: 1, priceScaleId: scaleId });
               const rsiData = calculateRSI(data, ind.period || 14);
               series.setData(rsiData.map(d => ({ time: d.time as Time, value: d.value })));
               
               // RSI Bands
               const upper = chart.addSeries(LineSeries, { color: 'rgba(255,255,255,0.3)', lineWidth: 1, lineStyle: 2, priceScaleId: scaleId, crosshairMarkerVisible: false, lastValueVisible: false });
               const lower = chart.addSeries(LineSeries, { color: 'rgba(255,255,255,0.3)', lineWidth: 1, lineStyle: 2, priceScaleId: scaleId, crosshairMarkerVisible: false, lastValueVisible: false });
               upper.setData(data.map(d => ({ time: d.time as Time, value: 70 })));
               lower.setData(data.map(d => ({ time: d.time as Time, value: 30 })));
               
               seriesMapRef.current.set(series, { id: ind.id, name: 'RSI', color: ind.color });

            } else if (ind.type === 'Stochastic') {
               const kSeries = chart.addSeries(LineSeries, { color: '#3b82f6', lineWidth: 1, priceScaleId: scaleId });
               const dSeries = chart.addSeries(LineSeries, { color: '#f97316', lineWidth: 1, priceScaleId: scaleId });
               
               const stochData = calculateStochastic(data, ind.kPeriod, ind.dPeriod, ind.slowing);
               kSeries.setData(stochData.map(d => ({ time: d.time as Time, value: d.k })));
               dSeries.setData(stochData.map(d => ({ time: d.time as Time, value: d.d })));
               
               seriesMapRef.current.set(kSeries, { id: ind.id, name: 'Stoch %K', color: '#3b82f6' });
               seriesMapRef.current.set(dSeries, { id: ind.id, name: 'Stoch %D', color: '#f97316' });

            } else if (ind.type === 'Volume') {
              const volSeries = chart.addSeries(HistogramSeries, { 
                  color: '#26a69a', 
                  priceFormat: { type: 'volume' }, 
                  priceScaleId: scaleId 
              });
              const volData = data.map(d => ({
                  time: d.time as Time,
                  value: d.volume,
                  color: d.close >= d.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
              }));
              volSeries.setData(volData);
              seriesMapRef.current.set(volSeries, { id: ind.id, name: 'Volume', color: '#26a69a' });
            }

            // Increment cursor for next pane
            currentPaneTop = paneBottom + GAP_SIZE;

        } else {
            // --- OVERLAY INDICATORS (Main Chart) ---
            const scaleId = 'right'; // Main chart scale
            
            if (ind.type === 'BB') {
                const upper = chart.addSeries(LineSeries, { color: ind.color, lineWidth: 1, lineStyle: 2, priceScaleId: scaleId, lastValueVisible: false });
                const lower = chart.addSeries(LineSeries, { color: ind.color, lineWidth: 1, lineStyle: 2, priceScaleId: scaleId, lastValueVisible: false });
                const basis = chart.addSeries(LineSeries, { color: ind.color, lineWidth: 1, priceScaleId: scaleId });
                
                const bbData = calculateBollingerBands(data, ind.period || 20, ind.stdDev || 2);
                upper.setData(bbData.map(d => ({ time: d.time as Time, value: d.upper })));
                lower.setData(bbData.map(d => ({ time: d.time as Time, value: d.lower })));
                basis.setData(bbData.map(d => ({ time: d.time as Time, value: d.basis })));

                seriesMapRef.current.set(upper, { id: ind.id, name: 'BB Upper', color: ind.color });
                seriesMapRef.current.set(lower, { id: ind.id, name: 'BB Lower', color: ind.color });
                seriesMapRef.current.set(basis, { id: ind.id, name: 'BB Basis', color: ind.color });
            } else {
                // SMA, EMA, VWAP, PineScript
                const series = chart.addSeries(LineSeries, {
                    color: ind.color,
                    lineWidth: (ind.lineWidth || 1) as any,
                    priceScaleId: scaleId,
                });
                
                let indData: {time: number, value: number}[] = [];
                if (ind.type === 'SMA') indData = calculateSMA(data, ind.period || 20);
                else if (ind.type === 'EMA') indData = calculateEMA(data, ind.period || 20);
                else if (ind.type === 'VWAP') indData = calculateVWAP(data);
                
                series.setData(indData.map(d => ({ time: d.time as Time, value: d.value })));
                seriesMapRef.current.set(series, { id: ind.id, name: `${ind.name}`, color: ind.color });
            }
        }
    });

    setSeparators(newSeparators);

    // --- 5. ADD KEY LEVELS (Overlays) ---
    if (showKeyLevels) {
        const maPeriods = [20, 50, 200];
        const maColors: Record<number, string> = { 20: '#22c55e', 50: '#eab308', 200: '#3b82f6' };
        maPeriods.forEach(period => {
             const series = chart.addSeries(LineSeries, {
                 color: maColors[period],
                 lineWidth: 1,
                 priceScaleId: 'right', // Main chart
                 crosshairMarkerVisible: true
             });
             const maData = calculateSMA(data, period);
             series.setData(maData.map(d => ({ time: d.time as Time, value: d.value })));
             seriesMapRef.current.set(series, { id: `ma-${period}`, name: `MA (${period})`, color: maColors[period] });
        });
    }

    // --- 6. ADD COMPARISON OVERLAYS ---
    overlays.forEach(overlay => {
        const series = chart.addSeries(LineSeries, {
            color: overlay.color,
            lineWidth: 2 as any,
            priceScaleId: 'right',
        });
        series.setData(overlay.data.map(d => ({ time: d.time as Time, value: d.close })));
        seriesMapRef.current.set(series, { id: overlay.id, name: overlay.symbol, color: overlay.color });
    });

    // --- 7. CROSSHAIR & EVENTS ---
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
        if (!param.time || !param.seriesData) {
            setLegendData(prev => ({ ...prev, ohlc: null }));
            return;
        }

        const candleData = param.seriesData.get(candleSeries) as CandlestickData;
        let ohlc = null;
        if (candleData) {
            const change = candleData.close - candleData.open;
            ohlc = {
                open: candleData.open,
                high: candleData.high,
                low: candleData.low,
                close: candleData.close,
                change: change
            };
        }

        const indicatorValues: { id: string, name: string, value: string | number, color: string }[] = [];
        param.seriesData.forEach((val, series) => {
             const meta = seriesMapRef.current.get(series as ISeriesApi<any>);
             if (meta) {
                 let displayValue: string | number = '';
                 if (typeof val === 'object' && 'value' in val) {
                     displayValue = (val as any).value.toFixed(2);
                 } else if (typeof val === 'object' && 'close' in val) { 
                     displayValue = (val as any).close.toFixed(2);
                 }
                 
                 indicatorValues.push({
                     id: meta.id,
                     name: meta.name,
                     value: displayValue,
                     color: meta.color
                 });
             }
        });

        setLegendData({ ohlc, indicators: indicatorValues });
    });

    return () => {
      chart.remove();
    };
  }, [data, indicators, overlays, showKeyLevels, theme]); 

  // --- RENDER ---
  const renderLegend = () => {
      const ohlc = legendData.ohlc || (data.length > 0 ? {
          open: data[data.length-1].open,
          high: data[data.length-1].high,
          low: data[data.length-1].low,
          close: data[data.length-1].close,
          change: data[data.length-1].close - data[data.length-1].open 
      } : null);

      if (!ohlc) return null;

      const changeColor = ohlc.change >= 0 ? 'text-green-500' : 'text-red-500';

      return (
          <div className="absolute top-0 left-0 z-10 pointer-events-none select-none text-xs font-mono w-full p-2">
              <div className="flex flex-wrap items-center gap-x-4 bg-slate-900/60 backdrop-blur-sm p-1.5 rounded border border-white/5 inline-flex">
                  <div className="flex items-center gap-2 mr-2">
                     <span className="font-bold text-lg text-slate-100 tracking-tight">{symbol}</span>
                     <span className="text-slate-400">1H</span>
                  </div>
                  
                  <div className="flex gap-3 text-slate-300">
                      <span>O <span className={changeColor}>{ohlc.open.toFixed(2)}</span></span>
                      <span>H <span className={changeColor}>{ohlc.high.toFixed(2)}</span></span>
                      <span>L <span className={changeColor}>{ohlc.low.toFixed(2)}</span></span>
                      <span>C <span className={changeColor}>{ohlc.close.toFixed(2)}</span></span>
                      <span className={changeColor}>{ohlc.change >= 0 ? '+' : ''}{ohlc.change.toFixed(2)} ({((ohlc.change/ohlc.open)*100).toFixed(2)}%)</span>
                  </div>
              </div>
              
              <div className="flex flex-col gap-1 mt-2">
                  {legendData.indicators.map((ind, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-900/40 px-2 py-0.5 rounded w-fit backdrop-blur-sm">
                          <span className="font-bold" style={{ color: ind.color }}>{ind.name}</span>
                          <span className="text-slate-200 font-mono">{ind.value}</span>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  return (
    <div className="w-full h-full relative group bg-slate-900">
      <div ref={chartContainerRef} className="w-full h-full" />
      
      {/* Visual Separators (Grid Lines) */}
      {separators.map((pos, idx) => (
          <div 
            key={idx}
            className="absolute left-0 w-full border-t-2 border-slate-800 z-0"
            style={{ top: `${pos * 100}%` }}
          >
             {/* Optional: Label for the pane below? */}
          </div>
      ))}

      {renderLegend()}

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 pointer-events-none opacity-[0.03] select-none z-0">
           <div className="text-8xl font-black text-slate-200 tracking-tighter">GEMINI</div>
      </div>
      
      {/* Market Status */}
      <div className="absolute top-2 right-16 flex items-center gap-1.5 px-2 py-1 bg-slate-800/80 rounded border border-slate-700 text-[10px] text-slate-400 z-20">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           Market Open
      </div>
    </div>
  );
};