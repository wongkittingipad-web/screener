import React, { useState } from 'react';
import { X, Plus, Code, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Indicator } from '../types';

interface IndicatorDialogProps {
  onClose: () => void;
  onAdd: (indicator: Indicator) => void;
  indicators?: Indicator[];
  onRemove?: (id: string) => void;
  onToggle?: (id: string) => void;
  onMove?: (id: string, direction: 'up' | 'down') => void;
}

export const IndicatorDialog: React.FC<IndicatorDialogProps> = ({ onClose, onAdd, indicators = [], onRemove, onToggle, onMove }) => {
  const [activeTab, setActiveTab] = useState<'Standard' | 'Active' | 'Script'>('Standard');
  const [script, setScript] = useState('// Enter Pine Script here\nplot(close)');
  
  const standardIndicators = [
      { type: 'SMA', name: 'Moving Average Simple', defaultPeriod: 20, color: '#3b82f6' },
      { type: 'EMA', name: 'Moving Average Exponential', defaultPeriod: 20, color: '#a855f7' },
      { type: 'RSI', name: 'Relative Strength Index', defaultPeriod: 14, color: '#f97316' },
      { type: 'Stochastic', name: 'Stochastic Oscillator', kPeriod: 14, dPeriod: 3, slowing: 3, color: '#3b82f6' },
      { type: 'MACD', name: 'MACD', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, color: '#2962FF' },
      { type: 'BB', name: 'Bollinger Bands', defaultPeriod: 20, defaultStdDev: 2, color: '#22d3ee' },
      { type: 'Volume', name: 'Volume + MA', color: '#26a69a' },
      { type: 'VWAP', name: 'Volume Weighted Average Price', color: '#e879f9' },
  ];

  const handleAdd = (template: any) => {
      onAdd({
          id: Math.random().toString(36).substr(2, 9),
          type: template.type,
          name: template.name,
          period: template.defaultPeriod,
          stdDev: template.defaultStdDev,
          fastPeriod: template.fastPeriod,
          slowPeriod: template.slowPeriod,
          signalPeriod: template.signalPeriod,
          kPeriod: template.kPeriod,
          dPeriod: template.dPeriod,
          slowing: template.slowing,
          color: template.color,
          visible: true
      });
      // Do not close, allow adding more
  };

  const handleScriptCompile = () => {
      onAdd({
          id: Math.random().toString(36).substr(2, 9),
          type: 'PineScript',
          name: 'Custom Script',
          color: '#ffffff',
          pineCode: script,
          visible: true
      });
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-900 w-full max-w-lg rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                <div className="flex space-x-6">
                    <button 
                        onClick={() => setActiveTab('Standard')}
                        className={`text-sm font-bold pb-1 transition-colors ${activeTab === 'Standard' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Library
                    </button>
                    <button 
                         onClick={() => setActiveTab('Active')}
                         className={`text-sm font-bold pb-1 transition-colors ${activeTab === 'Active' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Active ({indicators.length})
                    </button>
                    <button 
                         onClick={() => setActiveTab('Script')}
                         className={`text-sm font-bold pb-1 transition-colors ${activeTab === 'Script' ? 'text-white border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        Pine Editor
                    </button>
                </div>
                <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white" /></button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
                {activeTab === 'Standard' && (
                    <div className="space-y-2">
                        {standardIndicators.map((ind) => (
                            <div key={ind.type} className="flex items-center justify-between p-3 hover:bg-slate-800 rounded group border border-transparent hover:border-slate-700 transition-all">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-200">{ind.name}</h3>
                                </div>
                                <button 
                                    onClick={() => handleAdd(ind)}
                                    className="bg-slate-800 text-blue-400 border border-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 p-1.5 rounded transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'Active' && (
                    <div className="space-y-2">
                         {indicators.length === 0 && <p className="text-center text-slate-500 mt-10 text-sm">No active indicators.</p>}
                         {indicators.map((ind, index) => (
                             <div key={ind.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700">
                                 <div className="flex items-center gap-3">
                                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ind.color }}></div>
                                     <div>
                                         <h3 className="text-sm font-bold text-slate-200">{ind.name}</h3>
                                         <p className="text-[10px] text-slate-500">
                                            {ind.period ? `Period: ${ind.period}` : ''} 
                                            {ind.type === 'MACD' ? `${ind.fastPeriod}/${ind.slowPeriod}` : ''}
                                            {ind.type === 'Stochastic' ? `${ind.kPeriod}/${ind.dPeriod}/${ind.slowing}` : ''}
                                         </p>
                                     </div>
                                 </div>
                                 <div className="flex gap-2">
                                     <div className="flex flex-col mr-2">
                                        <button 
                                            onClick={() => onMove && onMove(ind.id, 'up')}
                                            disabled={index === 0}
                                            className="text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-500"
                                        >
                                            <ArrowUp size={12}/>
                                        </button>
                                        <button 
                                            onClick={() => onMove && onMove(ind.id, 'down')}
                                            disabled={index === indicators.length - 1}
                                            className="text-slate-500 hover:text-blue-400 disabled:opacity-30 disabled:hover:text-slate-500"
                                        >
                                            <ArrowDown size={12}/>
                                        </button>
                                     </div>
                                     <button 
                                        onClick={() => onToggle && onToggle(ind.id)}
                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                                    >
                                         {ind.visible ? <Eye size={16}/> : <EyeOff size={16}/>}
                                     </button>
                                     <button 
                                        onClick={() => onRemove && onRemove(ind.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded"
                                    >
                                         <Trash2 size={16}/>
                                     </button>
                                 </div>
                             </div>
                         ))}
                    </div>
                )}

                {activeTab === 'Script' && (
                    <div className="flex flex-col h-full">
                        <textarea 
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            className="w-full flex-1 bg-slate-950 text-green-400 font-mono text-xs p-4 rounded border border-slate-800 focus:border-blue-500 outline-none resize-none"
                            spellCheck={false}
                        />
                        <button 
                            onClick={handleScriptCompile}
                            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-medium flex items-center justify-center gap-2"
                        >
                            <Code size={16} /> Add to Chart
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};