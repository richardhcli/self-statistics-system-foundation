
import React from 'react';
import { Star, Award, TrendingUp } from 'lucide-react';

interface MasteryListProps {
  topNodes: any[];
}

export const MasteryList: React.FC<MasteryListProps> = ({ topNodes }) => {
  return (
    <section className="bg-slate-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Star className="w-48 h-48 -mr-12 -mt-12 rotate-12" />
      </div>
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-black uppercase italic tracking-tight">Active Mastery</h3>
        </div>
        <div className="space-y-3">
          {topNodes.length > 0 ? (
            topNodes.map((n, i) => (
              <div key={n.label} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-white/20">0{i+1}</span>
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{n.label}</p>
                    <p className="text-lg font-black">Level {n.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-500 font-bold uppercase">Experience</p>
                  <p className="text-xs text-indigo-200 font-mono font-bold">{n.experience.toFixed(1)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 border-2 border-dashed border-white/10 rounded-2xl">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-[10px] font-black uppercase">No Mastery Recorded</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
