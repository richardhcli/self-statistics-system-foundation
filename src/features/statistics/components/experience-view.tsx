import React from 'react';
import { TrendingUp } from 'lucide-react';

interface ExperienceNode {
  label: string;
  experience: number;
}

interface ExperienceViewProps {
  topNodes: ExperienceNode[];
}

/**
 * Experience tab view showing the top nodes by experience.
 */
export const ExperienceView: React.FC<ExperienceViewProps> = ({ topNodes }) => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Top Experience Nodes</h3>
      </div>
      <div className="p-6">
        {topNodes.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm font-semibold">
            No experience nodes available.
          </div>
        ) : (
          <ul className="space-y-3">
            {topNodes.map((node, index) => (
              <li
                key={`${node.label}-${index}`}
                className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">{node.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-black uppercase">Experience</p>
                  <p className="text-sm font-black text-indigo-600">{node.experience.toFixed(1)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
