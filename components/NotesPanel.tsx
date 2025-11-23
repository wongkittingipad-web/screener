import React, { useState, useEffect } from 'react';
import { BookOpen, Save } from 'lucide-react';

interface NotesPanelProps {
  symbol: string;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({ symbol }) => {
  const [note, setNote] = useState('');
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    // Load note from local storage (mock)
    const saved = localStorage.getItem(`note_${symbol}`);
    if (saved) {
        setNote(saved);
        setLastSaved('Loaded');
    } else {
        setNote('');
        setLastSaved(null);
    }
  }, [symbol]);

  const handleSave = () => {
      localStorage.setItem(`note_${symbol}`, note);
      const time = new Date().toLocaleTimeString();
      setLastSaved(`Saved at ${time}`);
  };

  return (
    <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col h-full">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <BookOpen size={16} className="text-blue-400"/>
                Game Plan
            </h2>
            <button onClick={handleSave} className="text-slate-500 hover:text-green-400 transition-colors" title="Save Note">
                <Save size={18} />
            </button>
        </div>
        
        <div className="flex-1 p-4 flex flex-col">
            <div className="mb-2 text-xs text-slate-500 flex justify-between">
                <span>NOTES FOR {symbol}</span>
                <span>{lastSaved}</span>
            </div>
            <textarea 
                className="flex-1 bg-slate-950/50 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono leading-relaxed"
                placeholder={`Write your trading plan for ${symbol}...\n\n- Key Support:\n- Key Resistance:\n- Entry Triggers:`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
            <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-800 text-[10px] text-slate-500">
                <p>Notes are saved locally in your browser.</p>
            </div>
        </div>
    </div>
  );
};