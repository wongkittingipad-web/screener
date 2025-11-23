import React from 'react';
import { MousePointer2, Minus, TrendingUp, Type, Crosshair, PenTool, Hash, Circle, Lock } from 'lucide-react';

export const DrawingToolbar: React.FC = () => {
  const tools = [
    { icon: <Crosshair size={18} />, label: "Cursor" },
    { icon: <Minus size={18} className="rotate-45" />, label: "Trend Line" },
    { icon: <TrendingUp size={18} />, label: "Fib Retracement" },
    { icon: <PenTool size={18} />, label: "Brush" },
    { icon: <Type size={18} />, label: "Text" },
    { icon: <Hash size={18} />, label: "Patterns" },
    { icon: <Circle size={18} />, label: "Shapes" },
    { icon: <Lock size={18} />, label: "Lock" },
  ];

  return (
    <div className="w-12 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 space-y-4 shrink-0">
      {tools.map((tool, idx) => (
        <button 
          key={idx}
          className={`p-2 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors ${idx === 0 ? 'text-blue-400 bg-slate-800' : ''}`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
};