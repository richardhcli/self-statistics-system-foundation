
import React from 'react';
import { Cpu } from 'lucide-react';
import { useGraphNodes } from '@/stores/cdag-topology';

const SystemLog: React.FC = () => {
  const nodes = useGraphNodes();
  const nodeCount = Object.keys(nodes).length;

  return (
  <div className="bg-slate-900 text-indigo-400 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu className="w-24 h-24" /></div>
    <div className="flex items-center gap-3 mb-6 relative z-10"><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /><h4 className="text-sm font-black uppercase tracking-widest text-white">System Log</h4></div>
    <div className="space-y-4 font-mono text-xs relative z-10 max-h-[150px] overflow-y-auto pr-4">
      <p className="text-emerald-400/80">:: [SYSTEM] INITIALIZING DEBUG_LOG</p>
      <p className="text-slate-500">:: [MEMORY] PERSISTENCE: OK</p>
      <p className="text-indigo-300">:: [STATS] TOPOLOGY_NODES: {nodeCount}</p>
      <div className="h-4 w-2 bg-indigo-500 animate-pulse" />
    </div>
  </div>
  );
};

export default SystemLog;
