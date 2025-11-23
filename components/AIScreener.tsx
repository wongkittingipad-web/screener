import React, { useState } from 'react';
import { X, Sparkles, ArrowRight, Loader } from 'lucide-react';
import { smartScreener } from '../services/geminiService';

interface AIScreenerProps {
  onClose: () => void;
  onSymbolSelect: (symbol: string) => void;
}

export const AIScreener: React.FC<AIScreenerProps> = ({ onClose, onSymbolSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!query.trim()) return;
      
      setLoading(true);
      const data = await smartScreener(query);
      setResults(data);
      setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div className="bg-slate-900 w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh]">
          
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-xl">
             <div className="flex items-center space-x-3 text-indigo-400">
                <Sparkles size={24} />
                <h2 className="text-xl font-bold text-white">Gemini Smart Screener</h2>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
             <div>
                 <label className="block text-sm font-medium text-slate-400 mb-2">Describe what you are looking for</label>
                 <form onSubmit={handleSearch} className="relative">
                    <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., High growth tech stocks with PE under 20..."
                        className="w-full bg-slate-800 text-white p-4 rounded-lg border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none pr-12 transition-all"
                    />
                    <button type="submit" className="absolute right-3 top-3 text-indigo-400 hover:text-indigo-300 p-1">
                        {loading ? <Loader className="animate-spin" /> : <ArrowRight />}
                    </button>
                 </form>
             </div>

             {results.length > 0 && (
                 <div className="space-y-3">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Results</h3>
                     <div className="grid gap-3">
                        {results.map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => { onSymbolSelect(item.symbol); onClose(); }}
                                className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all flex justify-between items-center group"
                            >
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-lg text-white">{item.symbol}</span>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{item.sector}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">{item.name}</p>
                                    <p className="text-xs text-indigo-300/80 mt-2 italic">"{item.reason}"</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-mono">${item.price}</div>
                                    <ArrowRight className="text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 inline-block mt-2" size={16}/>
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
             )}
             
             {results.length === 0 && !loading && (
                 <div className="text-center py-10 text-slate-600">
                     <p>Try searching for "Undervalued energy stocks" or "Crypto related stocks with high momentum"</p>
                 </div>
             )}
          </div>
          
          <div className="p-4 bg-slate-950 rounded-b-xl border-t border-slate-800 text-center">
             <p className="text-xs text-slate-500">Powered by Google Gemini 2.5 Flash</p>
          </div>
       </div>
    </div>
  );
};
