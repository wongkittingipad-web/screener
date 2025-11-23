import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Save, ArrowUp, ArrowDown, Calculator, AlertCircle } from 'lucide-react';
import { Candle, GamePlan } from '../types';
import { calculateSMA } from '../services/marketData';

interface RightPanelProps {
  symbol: string;
  data: Candle[];
}

export const RightPanel: React.FC<RightPanelProps> = ({ symbol, data }) => {
  // Game Plan State
  const [plan, setPlan] = useState<Partial<GamePlan>>({
      setup: '',
      entry: 0,
      stopLoss: 0,
      target: 0,
      maxLoss: 100, // Default risk
      notes: ''
  });
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Derive Real-time stats from latest candle
  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  
  const price = latest ? latest.close : 0;
  const change = latest && prev ? latest.close - prev.close : 0;
  const changePercent = latest && prev ? (change / prev.close) * 100 : 0;
  const spread = price * 0.0002;

  // Calculate Key Levels
  const levels = useMemo(() => {
      if (data.length < 200) return { ma20: 0, ma50: 0, ma200: 0, support: 0, resistance: 0 };
      const ma20 = calculateSMA(data, 20).pop()?.value || 0;
      const ma50 = calculateSMA(data, 50).pop()?.value || 0;
      const ma200 = calculateSMA(data, 200).pop()?.value || 0;
      const recent = data.slice(-50);
      const resistance = Math.max(...recent.map(c => c.high));
      const support = Math.min(...recent.map(c => c.low));
      return { ma20, ma50, ma200, support, resistance };
  }, [data]);

  // Load / Save Logic
  useEffect(() => {
    const saved = localStorage.getItem(`gamePlan_${symbol}`);
    if (saved) {
        try {
            setPlan(JSON.parse(saved));
            setLastSaved('Loaded');
        } catch (e) {
            console.error(e);
        }
    } else {
        // Reset for new symbol
        setPlan({ setup: '', entry: price, stopLoss: price * 0.98, target: price * 1.05, maxLoss: 100, notes: '' });
        setLastSaved(null);
    }
  }, [symbol]); // Removed 'price' dependency to prevent overwrite on every tick

  const handleSave = () => {
      const fullPlan: GamePlan = {
          symbol,
          setup: plan.setup || '',
          entry: Number(plan.entry),
          stopLoss: Number(plan.stopLoss),
          target: Number(plan.target),
          maxLoss: Number(plan.maxLoss),
          notes: plan.notes || '',
          updatedAt: Date.now()
      };
      localStorage.setItem(`gamePlan_${symbol}`, JSON.stringify(fullPlan));
      setLastSaved(`Saved ${new Date().toLocaleTimeString()}`);
  };

  // Calculations
  const risk = Math.abs((plan.entry || 0) - (plan.stopLoss || 0));
  const reward = Math.abs((plan.target || 0) - (plan.entry || 0));
  const rrRatio = risk > 0 ? reward / risk : 0;
  const positionSizeShares = risk > 0 ? Math.floor((plan.maxLoss || 0) / risk) : 0;
  const positionValue = positionSizeShares * (plan.entry || 0);

  if (!latest) return <div className="w-80 bg-slate-900 border-l border-slate-800 p-4">Loading...</div>;

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full font-sans overflow-hidden">
        {/* Real-Time Price Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-800/20 shrink-0">
            <div className="flex justify-between items-baseline mb-1">
                <h2 className="text-2xl font-bold text-white">{symbol}</h2>
                <div className={`text-lg font-mono font-medium ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {price.toFixed(2)}
                </div>
            </div>
            <div className="flex justify-between items-center text-xs mb-3">
                 <span className="text-slate-400">USD • NASDAQ</span>
                 <div className={`flex items-center ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {change >= 0 ? <ArrowUp size={12}/> : <ArrowDown size={12}/>}
                    {change.toFixed(2)} ({changePercent.toFixed(2)}%)
                 </div>
            </div>
        </div>

        {/* Key Levels Section */}
        <div className="p-4 border-b border-slate-800 shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Levels</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Res</span><span className="text-red-400">{levels.resistance.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Sup</span><span className="text-green-400">{levels.support.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">MA20</span><span className="text-slate-300">{levels.ma20.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">MA200</span><span className="text-slate-300">{levels.ma200.toFixed(2)}</span></div>
            </div>
        </div>
        
        {/* Game Plan Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen size={14} className="text-indigo-400"/>
                Game Plan
            </h2>
            <button onClick={handleSave} className="text-slate-500 hover:text-green-400 transition-colors flex items-center gap-1 text-xs">
                <Save size={14} /> Save
            </button>
        </div>
        
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {lastSaved && <div className="text-[10px] text-right text-slate-600 mb-1">{lastSaved}</div>}
             
             <div>
                 <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Setup / Strategy</label>
                 <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:border-blue-500 outline-none"
                    placeholder="e.g. Bull Flag Breakout"
                    value={plan.setup}
                    onChange={e => setPlan({...plan, setup: e.target.value})}
                 />
             </div>

             <div className="grid grid-cols-2 gap-3">
                 <div>
                     <label className="text-xs text-blue-400 uppercase font-bold block mb-1">Entry ($)</label>
                     <input 
                        type="number" 
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 font-mono focus:border-blue-500 outline-none"
                        value={plan.entry}
                        onChange={e => setPlan({...plan, entry: Number(e.target.value)})}
                     />
                 </div>
                 <div>
                     <label className="text-xs text-slate-400 uppercase font-bold block mb-1">Max Loss ($)</label>
                     <input 
                        type="number" 
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 font-mono focus:border-blue-500 outline-none"
                        value={plan.maxLoss}
                        onChange={e => setPlan({...plan, maxLoss: Number(e.target.value)})}
                     />
                 </div>
                 <div>
                     <label className="text-xs text-red-400 uppercase font-bold block mb-1">Stop Loss ($)</label>
                     <input 
                        type="number" 
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 font-mono focus:border-red-500 outline-none"
                        value={plan.stopLoss}
                        onChange={e => setPlan({...plan, stopLoss: Number(e.target.value)})}
                     />
                 </div>
                 <div>
                     <label className="text-xs text-green-400 uppercase font-bold block mb-1">Target ($)</label>
                     <input 
                        type="number" 
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 font-mono focus:border-green-500 outline-none"
                        value={plan.target}
                        onChange={e => setPlan({...plan, target: Number(e.target.value)})}
                     />
                 </div>
             </div>

             {/* Calculations Box */}
             <div className="bg-slate-800/50 rounded border border-slate-700 p-3 space-y-2">
                 <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                     <Calculator size={12} />
                     <span className="uppercase font-bold">Calculations</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">Risk / Share</span>
                     <span className="font-mono text-red-300">{risk.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">Reward / Share</span>
                     <span className="font-mono text-green-300">{reward.toFixed(2)}</span>
                 </div>
                 <div className="h-px bg-slate-700 my-1"></div>
                 <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-300">R:R Ratio</span>
                     <span className={`text-sm font-mono font-bold ${rrRatio >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                         1 : {rrRatio.toFixed(2)}
                     </span>
                 </div>
                 <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-slate-300">Position Size</span>
                     <div className="text-right">
                         <div className="text-sm font-mono font-bold text-blue-400">{positionSizeShares} Shares</div>
                         <div className="text-[10px] text-slate-500">≈ ${positionValue.toLocaleString()}</div>
                     </div>
                 </div>
             </div>

             <div>
                 <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Execution Notes</label>
                 <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-2 text-xs text-slate-300 focus:border-indigo-500 outline-none resize-none h-24"
                    placeholder="Waiting for 5min close above VWAP..."
                    value={plan.notes}
                    onChange={e => setPlan({...plan, notes: e.target.value})}
                 />
             </div>
        </div>
    </div>
  );
};