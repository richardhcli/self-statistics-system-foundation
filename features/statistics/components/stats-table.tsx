
import React from 'react';
import { Cpu, Zap, Award, Star, TrendingUp, Table as TableIcon } from 'lucide-react';

interface StatsTableProps {
  totalNodes: number;
  totalExp: number;
  totalLevels: number;
  highestExpNode: { label: string; experience: number } | null;
  highestLevelNode: { label: string; level: number } | null;
}

export const StatsTable: React.FC<StatsTableProps> = ({ 
  totalNodes, 
  totalExp, 
  totalLevels, 
  highestExpNode, 
  highestLevelNode 
}) => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
        <TableIcon className="w-5 h-5 text-slate-400" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">User Statistics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
              <th className="px-6 py-4">Metric</th>
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4">Context / Leader</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr>
              <td className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-slate-700"><Cpu className="w-4 h-4 text-slate-400" /> Total Nodes</td>
              <td className="px-6 py-4 text-lg font-black text-indigo-600">{totalNodes}</td>
              <td className="px-6 py-4 text-xs text-slate-500 italic">Identified across Action Map</td>
            </tr>
            <tr>
              <td className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-slate-700"><Zap className="w-4 h-4 text-slate-400" /> Total Experience</td>
              <td className="px-6 py-4 text-lg font-black text-indigo-600">{totalExp.toFixed(1)}</td>
              <td className="px-6 py-4 text-xs text-slate-500 italic">Accumulated network growth</td>
            </tr>
            <tr>
              <td className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-slate-700"><Award className="w-4 h-4 text-slate-400" /> Total Skill Levels</td>
              <td className="px-6 py-4 text-lg font-black text-indigo-600">{totalLevels}</td>
              <td className="px-6 py-4 text-xs text-slate-500 italic">Sum of all node tiers</td>
            </tr>
            <tr>
              <td className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-slate-700"><Star className="w-4 h-4 text-amber-500" /> Max EXP Node</td>
              <td className="px-6 py-4 text-lg font-black text-slate-900">{highestExpNode?.experience.toFixed(1) || '0'}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-black uppercase border border-amber-100">
                  {highestExpNode?.label || 'None'}
                </span>
              </td>
            </tr>
            <tr>
              <td className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-slate-700"><TrendingUp className="w-4 h-4 text-emerald-500" /> Highest Level</td>
              <td className="px-6 py-4 text-lg font-black text-slate-900">{highestLevelNode?.level || '1'}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-black uppercase border border-emerald-100">
                  {highestLevelNode?.label || 'None'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};
