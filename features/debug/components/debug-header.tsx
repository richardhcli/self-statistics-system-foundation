
import React from 'react';
import { Terminal } from 'lucide-react';
import { AppData } from '@/types';

interface HeaderProps {
  data: AppData;
  setData: (fn: (prev: AppData) => AppData) => void;
}

const DebugHeader: React.FC<HeaderProps> = () => (
  <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
    <div>
      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3"><Terminal className="w-8 h-8 text-indigo-600" /> Debug Console</h2>
      <p className="text-slate-400 font-mono text-xs tracking-widest mt-1">SYSTEM_LEVEL_ACCESS_GRANTED</p>
    </div>
  </div>
);

export default DebugHeader;
