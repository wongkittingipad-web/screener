import React from 'react';
import { Search, Activity, Filter, Layers, PlusCircle, Save, LayoutDashboard } from 'lucide-react';

interface TopBarProps {
  symbol: string;
  onScreenerClick: () => void;
  onAddOverlay: () => void;
  onIndicatorClick: () => void;
  onToggleKeyLevels: () => void;
  showKeyLevels: boolean;
  onSaveLayout: () => void;
  activeIndicatorsCount: number;
  onDashboardClick: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    symbol, 
    onScreenerClick, 
    onAddOverlay, 
    onIndicatorClick,
    onToggleKeyLevels,
    showKeyLevels,
    onSaveLayout,
    activeIndicatorsCount,
    onDashboardClick
}) => {
  return (
    <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-blue-500 font-bold text-lg hidden lg:flex">
          <Activity size={24} />
          <span>TradeGemini</span>
        </div>
        
        <div className="h-6 w-px bg-slate-700 hidden lg:block" />

        <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 cursor-pointer hover:border-slate-600 group">
          <Search size={14} className="text-slate-400 group-hover:text-slate-200" />
          <span className="text-sm font-semibold text-slate-200">{symbol}</span>
        </div>

        <div className="hidden md:flex space-x-1">
             {['1m', '5m', '15m', '1H', '4H', 'D'].map(tf => (
                 <button key={tf} className={`px-3 py-1 text-sm font-medium rounded hover:bg-slate-800 ${tf === '1H' ? 'text-blue-400 bg-slate-800/50' : 'text-slate-400'}`}>
                     {tf}
                 </button>
             ))}
        </div>
      </div>

      {/* Center Action Buttons (Buy/Sell) */}
      <div className="hidden md:flex items-center space-x-2">
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-1.5 rounded text-sm shadow-lg transition-colors">
              Buy
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-1.5 rounded text-sm shadow-lg transition-colors">
              Sell
          </button>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <button 
            onClick={onDashboardClick}
            className="hidden xl:flex items-center space-x-2 text-slate-400 hover:text-indigo-400 px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
        >
             <LayoutDashboard size={18} />
        </button>

        <button 
            onClick={onAddOverlay}
            className="hidden lg:flex items-center space-x-1 text-slate-400 hover:text-blue-400 px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
            title="Compare Symbol"
        >
            <PlusCircle size={18} />
        </button>

        <button 
             onClick={onIndicatorClick}
             className="flex items-center space-x-1 text-slate-400 hover:text-white px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
        >
            <Layers size={18} />
            <span className="text-sm font-medium hidden lg:inline">Indicators {activeIndicatorsCount > 0 && `(${activeIndicatorsCount})`}</span>
        </button>

        <button 
            onClick={onToggleKeyLevels}
            className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${showKeyLevels ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
            MA Levels
        </button>

        <div className="h-4 w-px bg-slate-700" />

        <button 
          onClick={onScreenerClick}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-md text-sm font-medium border border-slate-700 transition-all">
          <Filter size={16} />
          <span className="hidden lg:inline">Screener</span>
        </button>

        <button onClick={onSaveLayout} className="p-2 text-slate-400 hover:text-green-400 rounded-full hover:bg-slate-800" title="Save Layout">
            <Save size={20} />
        </button>
        
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer">
            JP
        </div>
      </div>
    </div>
  );
};