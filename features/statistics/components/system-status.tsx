
import React from 'react';
import { Cpu } from 'lucide-react';

interface SystemStatusProps {
  totalEntries: number;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ totalEntries }) => {
  return (
    <section className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
      <h3 className="font-bold flex items-center gap-2 mb-6 uppercase text-xs tracking-widest text-slate-400">
        <Cpu className="w-4 h-4 text-indigo-500" /> Neural Metrics
      </h3>
      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase">Journal Density</span>
          <span className="text-indigo-600 font-black text-lg">{totalEntries} <span className="text-[10px] text-slate-400 uppercase">Entries</span></span>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
          <span className="text-[10px] font-black text-slate-400 uppercase">Map Integrity</span>
          <span className="text-indigo-600 font-black text-lg">94.2%</span>
        </div>
      </div>
    </section>
  );
};
