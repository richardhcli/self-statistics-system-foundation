
import React from 'react';
import { Database, Code } from 'lucide-react';
import { AppData } from '@/types';

interface PersistenceViewProps {
  data: AppData;
}

const PersistenceView: React.FC<PersistenceViewProps> = ({ data }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3"><Database className="w-5 h-5 text-slate-900" /><h3 className="text-sm font-black uppercase text-slate-900">Raw Data Storage</h3></div>
    <div className="grid grid-cols-1 gap-6">
      {[
        {label: 'Journal Store', color: 'text-emerald-400', key: 'journal'}, 
        {label: 'Visual Graph', color: 'text-blue-400', key: 'visualGraph'}, 
        {label: 'Topology', color: 'text-amber-400', key: 'cdagTopology'}, 
        {label: 'Stats', color: 'text-indigo-400', key: 'playerStatistics'}
      ].map(store => (
        <div key={store.key} className="bg-slate-900 rounded-3xl p-6 border border-slate-800 overflow-hidden">
          <h4 className={`text-[10px] font-black uppercase mb-4 flex items-center gap-2 ${store.color}`}><Code className="w-3.5 h-3.5" />{store.label}</h4>
          <pre className={`text-[10px] font-mono overflow-auto max-h-[200px] bg-black/30 p-4 rounded-xl ${store.color}`}>
            {JSON.stringify((data as any)[store.key], null, 2)}
          </pre>
        </div>
      ))}
    </div>
  </div>
);

export default PersistenceView;
