import React, { useState } from 'react';
import { Ticker, Watchlist as WatchlistType } from '../types';
import { TrendingUp, TrendingDown, Plus, MoreHorizontal, Trash2, List, ArrowUpDown, ChevronDown, ChevronRight } from 'lucide-react';

interface WatchlistProps {
  tickers: Ticker[];
  onSelect: (symbol: string) => void;
  selectedSymbol: string;
  watchlists: WatchlistType[];
  activeWatchlistId: string;
  onWatchlistChange: (id: string) => void;
  onCreateWatchlist: (name: string) => void;
  onDeleteWatchlist: (id: string) => void;
  onRemoveSymbol: (listId: string, symbol: string) => void;
  onAddSymbol: (listId: string, symbol: string) => void;
}

export const Watchlist: React.FC<WatchlistProps> = ({ 
  tickers, 
  onSelect, 
  selectedSymbol, 
  watchlists, 
  activeWatchlistId,
  onWatchlistChange,
  onCreateWatchlist,
  onDeleteWatchlist,
  onRemoveSymbol,
  onAddSymbol
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showListMenu, setShowListMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'Symbol' | 'Price' | 'Change'>('Symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, symbol: string } | null>(null);

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0];
  
  // Filter and Sort Logic
  const displayTickers = tickers
    .filter(t => activeWatchlist.symbols.includes(t.symbol))
    .sort((a, b) => {
        let valA: any = a[sortBy === 'Symbol' ? 'symbol' : sortBy === 'Price' ? 'price' : 'changePercent'];
        let valB: any = b[sortBy === 'Symbol' ? 'symbol' : sortBy === 'Price' ? 'price' : 'changePercent'];
        
        if (sortBy === 'Symbol') {
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortDir === 'asc' ? valA - valB : valB - valA;
    });

  const handleCreate = () => {
    if (newListName.trim()) {
      onCreateWatchlist(newListName);
      setNewListName('');
      setIsCreating(false);
    }
  };

  const toggleSort = (field: 'Symbol' | 'Price' | 'Change') => {
      if (sortBy === field) {
          setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
      } else {
          setSortBy(field);
          setSortDir('asc');
      }
  };

  const handleContextMenu = (e: React.MouseEvent, symbol: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, symbol });
  };

  const handleMoveSymbol = (targetListId: string) => {
      if (contextMenu) {
          onRemoveSymbol(activeWatchlistId, contextMenu.symbol);
          onAddSymbol(targetListId, contextMenu.symbol);
          setContextMenu(null);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800" onClick={() => setContextMenu(null)}>
      {/* Header with List Selector */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-slate-800 rounded px-2 py-1 -ml-2 transition-colors" onClick={() => setShowListMenu(!showListMenu)}>
                <span className="font-bold uppercase tracking-wider text-sm text-slate-200">{activeWatchlist.name}</span>
                <ChevronDown size={14} className="text-slate-500" />
            </div>
            <button className="text-slate-400 hover:text-white bg-slate-800 p-1 rounded" title="Add Symbol to List">
                <Plus size={16} />
            </button>
        </div>

        {/* Dropdown Menu */}
        {showListMenu && (
            <div className="absolute z-50 mt-1 bg-slate-800 rounded-md border border-slate-700 shadow-xl w-60">
                {watchlists.map(w => (
                    <div key={w.id} className="flex justify-between items-center text-sm p-2 hover:bg-slate-700 cursor-pointer first:rounded-t last:rounded-b">
                        <span onClick={() => { onWatchlistChange(w.id); setShowListMenu(false); }} className={w.id === activeWatchlistId ? 'text-blue-400 font-bold' : 'text-slate-300'}>
                            {w.name} <span className="text-slate-500 text-xs ml-1">({w.symbols.length})</span>
                        </span>
                        {watchlists.length > 1 && (
                            <Trash2 size={12} className="text-slate-500 hover:text-red-400" onClick={(e) => { e.stopPropagation(); onDeleteWatchlist(w.id); }} />
                        )}
                    </div>
                ))}
                
                {isCreating ? (
                    <div className="p-2 border-t border-slate-700">
                        <input 
                            autoFocus
                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs w-full text-white mb-1"
                            value={newListName}
                            onChange={e => setNewListName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="List Name"
                        />
                        <button onClick={handleCreate} className="text-xs bg-blue-600 text-white w-full rounded py-1">Create</button>
                    </div>
                ) : (
                    <div onClick={() => setIsCreating(true)} className="p-2 border-t border-slate-700 text-xs text-blue-400 hover:bg-slate-700 cursor-pointer rounded-b flex items-center gap-2">
                        <Plus size={12}/> Create New List
                    </div>
                )}
            </div>
        )}

        {/* Sort Controls */}
        <div className="flex gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
             <button onClick={() => toggleSort('Symbol')} className={`hover:text-slate-300 ${sortBy === 'Symbol' ? 'text-blue-400' : ''}`}>Sym</button>
             <button onClick={() => toggleSort('Price')} className={`hover:text-slate-300 ml-auto ${sortBy === 'Price' ? 'text-blue-400' : ''}`}>Price</button>
             <button onClick={() => toggleSort('Change')} className={`hover:text-slate-300 w-12 text-right ${sortBy === 'Change' ? 'text-blue-400' : ''}`}>%</button>
        </div>
      </div>

      {/* Ticker List */}
      <div className="flex-1 overflow-y-auto" onContextMenu={(e) => e.preventDefault()}>
        {displayTickers.map((ticker) => (
          <div
            key={ticker.symbol}
            onClick={() => onSelect(ticker.symbol)}
            onContextMenu={(e) => handleContextMenu(e, ticker.symbol)}
            className={`px-3 py-2 border-b border-slate-800/50 cursor-pointer hover:bg-slate-800 transition-colors group relative ${
              selectedSymbol === ticker.symbol ? 'bg-slate-800 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'
            }`}
          >
            <div className="flex justify-between items-center mb-0.5">
              <span className="font-bold text-sm text-slate-200">{ticker.symbol}</span>
              <span className={`text-sm font-mono ${ticker.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {ticker.price.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
               <span className="text-xs text-slate-500 truncate max-w-[100px]">{ticker.name}</span>
               <div className={`text-xs flex items-center ${ticker.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(ticker.changePercent).toFixed(2)}%
               </div>
            </div>
          </div>
        ))}
        {displayTickers.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-500 mt-10">
                <div className="mb-2">List is empty</div>
                <button className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">Add Symbols</button>
            </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
          <div 
            className="fixed z-50 bg-slate-800 border border-slate-700 rounded shadow-xl text-sm w-40"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
              <div className="p-2 border-b border-slate-700 text-xs text-slate-500 px-3">
                  {contextMenu.symbol}
              </div>
              <div 
                className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-slate-300 flex items-center gap-2"
                onClick={() => { onRemoveSymbol(activeWatchlistId, contextMenu.symbol); setContextMenu(null); }}
              >
                  <Trash2 size={14} className="text-red-400"/> Remove
              </div>
              <div className="border-t border-slate-700">
                  <div className="px-3 py-1 text-[10px] text-slate-500 mt-1 uppercase">Move to...</div>
                  {watchlists.filter(w => w.id !== activeWatchlistId).map(w => (
                      <div 
                        key={w.id}
                        className="px-3 py-2 hover:bg-slate-700 cursor-pointer text-slate-300 flex items-center gap-2"
                        onClick={() => handleMoveSymbol(w.id)}
                      >
                         <ChevronRight size={14} /> {w.name}
                      </div>
                  ))}
                  {watchlists.length === 1 && <div className="px-3 py-2 text-xs text-slate-600 italic">No other lists</div>}
              </div>
          </div>
      )}
    </div>
  );
};