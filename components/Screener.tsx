import React, { useState, useMemo } from 'react';
import { X, Filter, RefreshCw } from 'lucide-react';
import { MOCK_TICKERS } from '../services/marketData';
import { Ticker } from '../types';

interface ScreenerProps {
  onClose: () => void;
  onSymbolSelect: (symbol: string) => void;
}

export const Screener: React.FC<ScreenerProps> = ({ onClose, onSymbolSelect }) => {
  const [filters, setFilters] = useState({
      sector: 'All',
      minPrice: 0,
      maxPrice: 1000,
      minVol: 0,
      minCap: 0,
  });

  const sectors = ['All', ...Array.from(new Set(MOCK_TICKERS.map(t => t.sector)))];

  const filteredTickers = useMemo(() => {
      return MOCK_TICKERS.filter(t => {
          if (filters.sector !== 'All' && t.sector !== filters.sector) return false;
          if (t.price < filters.minPrice || t.price > filters.maxPrice) return false;
          if (t.volume < filters.minVol) return false;
          if (t.marketCap < filters.minCap) return false;
          return true;
      });
  }, [filters]);

  const resetFilters = () => {
      setFilters({ sector: 'All', minPrice: 0, maxPrice: 1000, minVol: 0, minCap: 0 });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-slate-900 w-full max-w-5xl h-[80vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col">
          
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
             <div className="flex items-center space-x-3">
                <Filter size={20} className="text-blue-500" />
                <h2 className="text-lg font-bold text-white">Stock Screener</h2>
                <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{filteredTickers.length} Matches</span>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
             {/* Sidebar Filters */}
             <div className="w-64 bg-slate-950/50 p-4 border-r border-slate-800 overflow-y-auto space-y-6">
                 <div>
                     <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Sector</label>
                     <select 
                        value={filters.sector}
                        onChange={(e) => setFilters({...filters, sector: e.target.value})}
                        className="w-full bg-slate-800 text-slate-200 text-sm border border-slate-700 rounded p-2 focus:border-blue-500 outline-none"
                     >
                         {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                 </div>

                 <div>
                     <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Price Range ($)</label>
                     <div className="flex space-x-2">
                        <input 
                            type="number" 
                            value={filters.minPrice}
                            onChange={(e) => setFilters({...filters, minPrice: Number(e.target.value)})}
                            className="w-1/2 bg-slate-800 text-slate-200 text-sm border border-slate-700 rounded p-2"
                            placeholder="Min"
                        />
                         <input 
                            type="number" 
                            value={filters.maxPrice}
                            onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
                            className="w-1/2 bg-slate-800 text-slate-200 text-sm border border-slate-700 rounded p-2"
                            placeholder="Max"
                        />
                     </div>
                 </div>

                 <div>
                     <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Min Volume</label>
                     <select 
                        value={filters.minVol}
                        onChange={(e) => setFilters({...filters, minVol: Number(e.target.value)})}
                        className="w-full bg-slate-800 text-slate-200 text-sm border border-slate-700 rounded p-2"
                     >
                         <option value={0}>Any</option>
                         <option value={1000000}>Over 1M</option>
                         <option value={10000000}>Over 10M</option>
                         <option value={50000000}>Over 50M</option>
                     </select>
                 </div>

                 <button onClick={resetFilters} className="flex items-center justify-center space-x-2 w-full py-2 border border-slate-700 rounded text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors">
                     <RefreshCw size={14} />
                     <span>Reset Filters</span>
                 </button>
             </div>

             {/* Results Table */}
             <div className="flex-1 overflow-auto bg-slate-900">
                 <table className="w-full text-left text-sm text-slate-400">
                     <thead className="bg-slate-950 text-slate-500 sticky top-0">
                         <tr>
                             <th className="p-4 font-medium">Symbol</th>
                             <th className="p-4 font-medium">Name</th>
                             <th className="p-4 font-medium">Sector</th>
                             <th className="p-4 font-medium text-right">Price</th>
                             <th className="p-4 font-medium text-right">Change %</th>
                             <th className="p-4 font-medium text-right">Volume</th>
                             <th className="p-4 font-medium text-right">Mkt Cap (B)</th>
                             <th className="p-4 font-medium text-right">P/E</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800">
                         {filteredTickers.map(t => (
                             <tr key={t.symbol} onClick={() => { onSymbolSelect(t.symbol); onClose(); }} className="hover:bg-slate-800/60 cursor-pointer transition-colors group">
                                 <td className="p-4 font-bold text-blue-400 group-hover:text-blue-300">{t.symbol}</td>
                                 <td className="p-4 text-slate-300">{t.name}</td>
                                 <td className="p-4">{t.sector}</td>
                                 <td className="p-4 text-right font-mono text-slate-200">${t.price.toFixed(2)}</td>
                                 <td className={`p-4 text-right font-mono ${t.changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                     {t.changePercent > 0 ? '+' : ''}{t.changePercent.toFixed(2)}%
                                 </td>
                                 <td className="p-4 text-right">{(t.volume / 1000000).toFixed(1)}M</td>
                                 <td className="p-4 text-right">{t.marketCap}</td>
                                 <td className="p-4 text-right">{t.peRatio}</td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
                 {filteredTickers.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-slate-600">
                         <p>No results match your filters.</p>
                     </div>
                 )}
             </div>
          </div>
       </div>
    </div>
  );
};
