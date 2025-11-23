import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { Watchlist } from './components/Watchlist';
import { ChartContainer } from './components/ChartContainer';
import { RightPanel } from './components/RightPanel';
import { Screener } from './components/Screener';
import { IndicatorDialog } from './components/IndicatorDialog';
import { Dashboard } from './components/Dashboard';
import { DrawingToolbar } from './components/DrawingToolbar';
import { generateInitialData, MOCK_TICKERS } from './services/marketData';
import { Candle, Indicator, Overlay, Watchlist as WatchlistType, Layout } from './types';

const App: React.FC = () => {
  const [activeSymbol, setActiveSymbol] = useState('AAPL');
  const [marketData, setMarketData] = useState<Candle[]>([]);
  
  // Default Indicators matching the screenshot density + Volume
  const [indicators, setIndicators] = useState<Indicator[]>([
      { id: 'vol-1', type: 'Volume', name: 'Volume', color: '#26a69a', visible: true },
      { id: 'rsi-1', type: 'RSI', name: 'RSI', period: 14, color: '#f97316', visible: true },
      { id: 'stoch-1', type: 'Stochastic', name: 'Stoch', kPeriod: 14, dPeriod: 3, slowing: 3, color: '#3b82f6', visible: true }
  ]);
  
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [showScreener, setShowScreener] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showIndicatorDialog, setShowIndicatorDialog] = useState(false);
  const [showKeyLevels, setShowKeyLevels] = useState(true); // Enabled by default as per screenshot appearance
  
  // Watchlists
  const [watchlists, setWatchlists] = useState<WatchlistType[]>([
      { id: '1', name: 'My First List', symbols: ['AAPL', 'MSFT', 'NVDA', 'TSLA'] },
      { id: '2', name: 'Crypto & High Beta', symbols: ['COIN', 'MSTR', 'AMD'] }
  ]);
  const [activeWatchlistId, setActiveWatchlistId] = useState('1');

  // Layouts
  const [savedLayouts, setSavedLayouts] = useState<Layout[]>([]);

  // Initialize Data
  useEffect(() => {
    const initialData = generateInitialData(1000, 175);
    setMarketData(initialData);
  }, [activeSymbol]);

  // Simulate Live Ticks
  useEffect(() => {
    const interval = setInterval(() => {
        setMarketData(prev => {
            if (prev.length === 0) return prev;
            const lastCandle = prev[prev.length - 1];
            
            const volatility = lastCandle.close * 0.0005;
            const move = (Math.random() - 0.5) * volatility;
            const newClose = lastCandle.close + move;
            
            const updatedCandle = {
                ...lastCandle,
                close: newClose,
                high: Math.max(lastCandle.high, newClose),
                low: Math.min(lastCandle.low, newClose),
            };

            const newData = [...prev];
            newData[newData.length - 1] = updatedCandle;
            return newData;
        });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const handleSymbolChange = (sym: string) => {
      setActiveSymbol(sym);
      const ticker = MOCK_TICKERS.find(t => t.symbol === sym);
      const startPrice = ticker ? ticker.price : 100;
      setMarketData(generateInitialData(1000, startPrice));
      setOverlays([]); 
  };

  const handleAddOverlay = () => {
      const symbol = overlays.length % 2 === 0 ? 'SPY' : 'QQQ';
      if (overlays.find(o => o.symbol === symbol)) return;

      const data = generateInitialData(1000, symbol === 'SPY' ? 440 : 370);
      const newOverlay: Overlay = {
          id: symbol,
          symbol,
          data,
          color: symbol === 'SPY' ? '#facc15' : '#ec4899', 
      };
      setOverlays(prev => [...prev, newOverlay]);
  };

  const handleSaveLayout = () => {
      const newLayout: Layout = {
          id: Math.random().toString(36),
          name: `Layout ${savedLayouts.length + 1}`,
          indicators: [...indicators],
          timeframe: '1H'
      };
      setSavedLayouts([...savedLayouts, newLayout]);
      alert('Layout saved!');
  };

  // Watchlist Management
  const handleCreateWatchlist = (name: string) => {
      const newList: WatchlistType = { id: Math.random().toString(), name, symbols: [] };
      setWatchlists([...watchlists, newList]);
      setActiveWatchlistId(newList.id);
  };
  
  const handleDeleteWatchlist = (id: string) => {
      if (watchlists.length <= 1) return;
      const filtered = watchlists.filter(w => w.id !== id);
      setWatchlists(filtered);
      if (activeWatchlistId === id) setActiveWatchlistId(filtered[0].id);
  };

  const handleRemoveSymbolFromList = (listId: string, symbol: string) => {
      setWatchlists(prev => prev.map(w => {
          if (w.id === listId) {
              return { ...w, symbols: w.symbols.filter(s => s !== symbol) };
          }
          return w;
      }));
  };

  const handleAddSymbolToList = (listId: string, symbol: string) => {
      setWatchlists(prev => prev.map(w => {
          if (w.id === listId && !w.symbols.includes(symbol)) {
              return { ...w, symbols: [...w.symbols, symbol] };
          }
          return w;
      }));
  };

  // Indicator Management
  const handleRemoveIndicator = (id: string) => {
      setIndicators(indicators.filter(i => i.id !== id));
  };

  const handleToggleIndicator = (id: string) => {
      setIndicators(indicators.map(i => i.id === id ? { ...i, visible: !i.visible } : i));
  };

  const handleMoveIndicator = (id: string, direction: 'up' | 'down') => {
      const idx = indicators.findIndex(i => i.id === id);
      if (idx === -1) return;
      if (direction === 'up' && idx === 0) return;
      if (direction === 'down' && idx === indicators.length - 1) return;
      
      const newIndicators = [...indicators];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      
      [newIndicators[idx], newIndicators[swapIdx]] = [newIndicators[swapIdx], newIndicators[idx]];
      setIndicators(newIndicators);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-900 text-slate-200 overflow-hidden">
      <TopBar 
        symbol={activeSymbol} 
        onScreenerClick={() => setShowScreener(true)}
        onAddOverlay={handleAddOverlay}
        onIndicatorClick={() => setShowIndicatorDialog(true)}
        onToggleKeyLevels={() => setShowKeyLevels(!showKeyLevels)}
        showKeyLevels={showKeyLevels}
        onSaveLayout={handleSaveLayout}
        activeIndicatorsCount={indicators.filter(i => i.visible).length}
        onDashboardClick={() => setShowDashboard(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Watchlist Sidebar */}
        <div className="w-72 hidden lg:block shrink-0 border-r border-slate-800">
            <Watchlist 
                tickers={MOCK_TICKERS} 
                selectedSymbol={activeSymbol} 
                onSelect={handleSymbolChange}
                watchlists={watchlists}
                activeWatchlistId={activeWatchlistId}
                onWatchlistChange={setActiveWatchlistId}
                onCreateWatchlist={handleCreateWatchlist}
                onDeleteWatchlist={handleDeleteWatchlist}
                onRemoveSymbol={handleRemoveSymbolFromList}
                onAddSymbol={handleAddSymbolToList}
            />
        </div>

        <DrawingToolbar />

        {/* Main Chart Area */}
        <div className="flex-1 relative bg-slate-900">
            <ChartContainer 
                data={marketData} 
                symbol={activeSymbol} 
                indicators={indicators} 
                overlays={overlays}
                theme="Dark" 
                showKeyLevels={showKeyLevels}
            />
        </div>

        {/* Right Panel: Data & Game Plan */}
        <div className="hidden xl:block">
            <RightPanel symbol={activeSymbol} data={marketData} />
        </div>
      </div>

      {showScreener && (
          <Screener 
            onClose={() => setShowScreener(false)} 
            onSymbolSelect={handleSymbolChange}
          />
      )}

      {showDashboard && (
          <Dashboard 
            onClose={() => setShowDashboard(false)}
            onSymbolSelect={handleSymbolChange}
          />
      )}

      {showIndicatorDialog && (
          <IndicatorDialog 
            onClose={() => setShowIndicatorDialog(false)}
            onAdd={(ind) => setIndicators([...indicators, ind])}
            indicators={indicators}
            onRemove={handleRemoveIndicator}
            onToggle={handleToggleIndicator}
            onMove={handleMoveIndicator}
          />
      )}
    </div>
  );
};

export default App;