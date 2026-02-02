import React from 'react';
import { TrendingUp, Award, Zap } from 'lucide-react';
import { EntryResultsProps } from '../../types';

/**
 * Component: EntryResults
 * 
 * Functional Description:
 * Displays a detailed breakdown of how a single journal entry impacted 
 * the user's neural network. Lists each node that received EXP.
 */
export const EntryResults: React.FC<EntryResultsProps> = ({ nodeIncreases }) => {
  // Use explicit casting to ensure correctly typed arithmetic operations in the sort function
  const sortedIncreases = (Object.entries(nodeIncreases) as [string, number][])
    .sort(([, a], [, b]) => (b as number) - (a as number));

  if (sortedIncreases.length === 0) return null;

  return (
    <div className="mt-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
        <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Neural Impact Analysis</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {sortedIncreases.map(([label, inc]) => (
          <div key={label} className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-indigo-500 transition-colors" />
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight truncate max-w-[120px]">
                {label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-emerald-400">
                {/* Explicitly cast inc to number to access toFixed method */}
                +{(inc as number).toFixed(2)}
              </span>
              <span className="text-[8px] font-black text-slate-600 uppercase">EXP</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <Award className="w-3 h-3 text-amber-500" />
          <span className="text-[9px] font-bold text-slate-500 uppercase">Progression Propagated</span>
        </div>
        <div className="flex items-center gap-1">
           <Zap className="w-2.5 h-2.5 text-indigo-400" />
           <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Weighted Mean Intensity</span>
        </div>
      </div>
    </div>
  );
};
