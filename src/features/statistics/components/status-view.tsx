import React from 'react';
import { Zap } from 'lucide-react';

interface StatusViewProps {
  totalExp: number;
}

/**
 * Status tab view showing the cumulative experience total.
 */
export const StatusView: React.FC<StatusViewProps> = ({ totalExp }) => {
  return (
    <section className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm flex flex-col items-center text-center">
      <div className="p-6 bg-indigo-50 rounded-2xl mb-6">
        <Zap className="w-12 h-12 text-indigo-600 fill-indigo-600" />
      </div>
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Cumulative Experience</h3>
      <p className="text-6xl font-black text-slate-900 tracking-tighter">{totalExp.toFixed(1)}</p>
    </section>
  );
};
