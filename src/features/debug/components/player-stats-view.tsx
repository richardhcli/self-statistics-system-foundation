
import React from 'react';
import { User, Trophy } from 'lucide-react';
import { PlayerStatistics } from '@/stores/player-statistics/types';

interface PlayerStatsViewProps {
  stats: PlayerStatistics;
}

const PlayerStatsView: React.FC<PlayerStatsViewProps> = ({ stats }) => (
  <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl">
    <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-indigo-100 rounded-lg"><User className="w-5 h-5 text-indigo-600" /></div><h3 className="text-sm font-black uppercase text-slate-900">Player Node Statistics</h3></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Use explicit casting to handle unknown property access during sorting and mapping */}
      {Object.entries(stats).length > 0 ? (
        Object.entries(stats).sort((a,b) => (b[1] as any).experience - (a[1] as any).experience).map(([label, d]) => (
          <div key={label} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
            <div><span className="block text-[10px] font-black text-slate-400 uppercase">{label}</span><span className="font-mono text-xs font-bold">LVL {(d as any).level}</span></div>
            <div className="text-right"><span className="block text-[9px] font-bold text-indigo-400 uppercase">EXP</span><span className="font-mono text-xs text-indigo-600 font-black">{(d as any).experience.toFixed(2)}</span></div>
          </div>
        ))
      ) : (
        <div className="md:col-span-2 py-8 text-center border-2 border-dashed border-slate-200 rounded-xl"><Trophy className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-slate-400 text-xs font-bold uppercase italic tracking-widest">No Experience Propagated Yet</p></div>
      )}
    </div>
  </div>
);

export default PlayerStatsView;