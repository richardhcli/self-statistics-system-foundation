
import React from 'react';
import { Zap, Award, Star, TrendingUp } from 'lucide-react';

interface PlayerStatusTabProps {
  totalExp: number;
  highestLevel: number;
  highestLevelNodeLabel?: string;
}

export const PlayerStatusTab: React.FC<PlayerStatusTabProps> = ({ 
  totalExp, 
  highestLevel,
  highestLevelNodeLabel 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Total Experience Card */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-indigo-500 transition-colors">
        <div className="p-6 bg-indigo-50 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
          <Zap className="w-12 h-12 text-indigo-600 fill-indigo-600" />
        </div>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Cumulative Experience</h3>
        <p className="text-6xl font-black text-slate-900 tracking-tighter">{totalExp.toFixed(1)}</p>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-indigo-500" /> Across all neural nodes
        </p>
      </div>

      {/* Highest Level Card */}
      <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center group hover:border-emerald-500 transition-colors">
        <div className="p-6 bg-emerald-50 rounded-2xl mb-6 group-hover:scale-110 transition-transform">
          <Award className="w-12 h-12 text-emerald-600" />
        </div>
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Highest Node Level</h3>
        <p className="text-6xl font-black text-slate-900 tracking-tighter">LVL {highestLevel}</p>
        {highestLevelNodeLabel && (
          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200">
              {highestLevelNodeLabel}
            </span>
          </div>
        )}
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Star className="w-3 h-3 text-amber-500" /> Peak Mastery Reached
        </p>
      </div>
    </div>
  );
};
