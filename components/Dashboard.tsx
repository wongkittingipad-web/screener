import React, { useEffect, useState } from 'react';
import { X, LayoutDashboard, Search, ArrowRight } from 'lucide-react';
import { GamePlan } from '../types';

interface DashboardProps {
  onClose: () => void;
  onSymbolSelect: (symbol: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onClose, onSymbolSelect }) => {
  const [plans, setPlans] = useState<GamePlan[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load all game plans from local storage
    const loadedPlans: GamePlan[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gamePlan_')) {
            try {
                const val = localStorage.getItem(key);
                if (val) loadedPlans.push(JSON.parse(val));
            } catch (e) {
                console.error(e);
            }
        }
    }
    // Sort by updated time (newest first)
    loadedPlans.sort((a, b) => b.updatedAt - a.updatedAt);
    setPlans(loadedPlans);
  }, []);

  const filteredPlans = plans.filter(p => p.symbol.includes(search.toUpperCase()));

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
             <div className="flex items-center gap-3">
                 <LayoutDashboard className="text-indigo-500" />
                 <h1 className="text-xl font-bold text-white">Strategy Dashboard</h1>
                 <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full">{plans.length} Plans</span>
             </div>
             <div className="flex items-center gap-4">
                 <div className="relative">
                     <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                     <input 
                        type="text" 
                        placeholder="Search Symbol..." 
                        className="bg-slate-800 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 w-64"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                     />
                 </div>
                 <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white">
                     <X size={24} />
                 </button>
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950">
            {filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <LayoutDashboard size={48} className="mb-4 opacity-20" />
                    <p>No active game plans found.</p>
                    <p className="text-sm mt-2">Create a plan in the sidebar for any symbol.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredPlans.map(plan => {
                         const risk = Math.abs(plan.entry - plan.stopLoss);
                         const reward = Math.abs(plan.target - plan.entry);
                         const rr = risk > 0 ? reward/risk : 0;
                         const shares = risk > 0 ? Math.floor(plan.maxLoss / risk) : 0;
                         const potential = shares * reward;

                         return (
                             <div key={plan.symbol} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all shadow-lg group relative">
                                 <div className="flex justify-between items-start mb-4">
                                     <div>
                                         <h3 className="text-2xl font-bold text-white mb-1">{plan.symbol}</h3>
                                         <span className="text-xs text-indigo-400 font-medium bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-900/50">
                                            {plan.setup || 'No Setup'}
                                         </span>
                                     </div>
                                     <div className={`text-xl font-mono font-bold ${rr >= 2 ? 'text-green-400' : 'text-yellow-400'}`}>
                                         {rr.toFixed(1)}R
                                     </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-4">
                                     <div>
                                         <div className="text-[10px] text-slate-500 uppercase">Entry</div>
                                         <div className="font-mono text-slate-200">{plan.entry.toFixed(2)}</div>
                                     </div>
                                     <div>
                                         <div className="text-[10px] text-slate-500 uppercase">Target</div>
                                         <div className="font-mono text-green-400">{plan.target.toFixed(2)}</div>
                                     </div>
                                     <div>
                                         <div className="text-[10px] text-slate-500 uppercase">Stop</div>
                                         <div className="font-mono text-red-400">{plan.stopLoss.toFixed(2)}</div>
                                     </div>
                                     <div>
                                         <div className="text-[10px] text-slate-500 uppercase">Shares</div>
                                         <div className="font-mono text-blue-400">{shares}</div>
                                     </div>
                                 </div>

                                 <div className="bg-slate-950 rounded p-3 text-xs text-slate-400 italic mb-4 h-16 overflow-hidden line-clamp-3 border border-slate-800">
                                     "{plan.notes || 'No notes provided...'}"
                                 </div>

                                 <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
                                      <div className="text-[10px] text-slate-600">Updated: {new Date(plan.updatedAt).toLocaleDateString()}</div>
                                      <button 
                                        onClick={() => { onSymbolSelect(plan.symbol); onClose(); }}
                                        className="text-xs font-bold text-indigo-400 flex items-center gap-1 hover:text-indigo-300"
                                      >
                                          Open Chart <ArrowRight size={12} />
                                      </button>
                                 </div>
                             </div>
                         );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};