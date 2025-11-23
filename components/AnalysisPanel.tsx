import React, { useEffect, useState } from 'react';
import { AnalysisResult, NewsItem, Candle } from '../types';
import { analyzeChartData, searchNews } from '../services/geminiService';
import { BrainCircuit, Newspaper, TrendingUp, AlertTriangle } from 'lucide-react';

interface AnalysisPanelProps {
  symbol: string;
  data: Candle[];
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ symbol, data }) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        if (!data.length) return;
        setLoading(true);
        // Parallel fetch
        const [anRes, newsRes] = await Promise.all([
            analyzeChartData(symbol, data),
            searchNews(symbol)
        ]);
        setAnalysis(anRes);
        setNews(newsRes);
        setLoading(false);
    };

    fetchData();
  }, [symbol, data.length]); // Re-analyze when symbol changes or significant data comes in

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BrainCircuit size={16} className="text-indigo-400"/>
                AI Insight
            </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-500">Analyzing Market Structure...</p>
                </div>
            ) : analysis ? (
                <>
                    {/* Sentiment Card */}
                    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400">Technical Sentiment</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                analysis.sentiment === 'Bullish' ? 'bg-green-900/50 text-green-400' : 
                                analysis.sentiment === 'Bearish' ? 'bg-red-900/50 text-red-400' : 'bg-slate-700 text-slate-300'
                            }`}>
                                {analysis.sentiment}
                            </span>
                        </div>
                        
                        <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden mb-3">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${analysis.sentiment === 'Bullish' ? 'bg-green-500' : analysis.sentiment === 'Bearish' ? 'bg-red-500' : 'bg-yellow-500'}`}
                                style={{ width: `${analysis.score}%` }}
                            />
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                            {analysis.summary}
                        </p>
                    </div>

                    {/* Levels */}
                    <div className="space-y-2">
                         <h3 className="text-xs font-bold text-slate-500 uppercase">Key Levels</h3>
                         <div className="flex gap-2">
                             <div className="flex-1 bg-red-900/20 border border-red-900/30 rounded p-2 text-center">
                                 <div className="text-[10px] text-red-400">RESISTANCE</div>
                                 <div className="text-sm font-mono text-red-300">
                                     {analysis.keyLevels.resistance[0]?.toFixed(2) || '---'}
                                 </div>
                             </div>
                             <div className="flex-1 bg-green-900/20 border border-green-900/30 rounded p-2 text-center">
                                 <div className="text-[10px] text-green-400">SUPPORT</div>
                                 <div className="text-sm font-mono text-green-300">
                                     {analysis.keyLevels.support[0]?.toFixed(2) || '---'}
                                 </div>
                             </div>
                         </div>
                    </div>
                </>
            ) : null}

            {/* News Section */}
            <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
                    <Newspaper size={14} />
                    Latest News
                </h3>
                <div className="space-y-3">
                    {news.map((item, idx) => (
                        <a key={idx} href={item.url} target="_blank" rel="noreferrer" className="block group">
                            <h4 className="text-xs text-slate-300 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-1">
                                {item.title}
                            </h4>
                            <div className="flex justify-between text-[10px] text-slate-500">
                                <span>{item.source}</span>
                                <span>{item.time}</span>
                            </div>
                        </a>
                    ))}
                    {news.length === 0 && !loading && <div className="text-xs text-slate-600">No recent news found.</div>}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-auto p-3 bg-slate-950/50 rounded border border-slate-800 text-[10px] text-slate-500 flex gap-2">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                <p>
                    Market data is simulated for demo purposes. AI analysis is experimental. Do not use for financial decisions.
                </p>
            </div>
        </div>
    </div>
  );
};
