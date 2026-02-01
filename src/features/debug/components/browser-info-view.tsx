
import React from 'react';
import { Globe } from 'lucide-react';

const BrowserInfoView: React.FC = () => (
  <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl">
    <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-emerald-100 rounded-lg"><Globe className="w-5 h-5 text-emerald-600" /></div><h3 className="text-sm font-black uppercase text-slate-900">Environment Metadata</h3></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[{k: 'User Agent', v: navigator.userAgent}, {k: 'Screen', v: `${window.screen.width}x${window.screen.height}`}, {k: 'Platform', v: (navigator as any).platform}].map(i => (
        <div key={i.k} className="bg-slate-50 border border-slate-200 p-3 rounded-xl"><span className="block text-[9px] font-black text-slate-400 uppercase mb-1">{i.k}</span><span className="font-mono text-[10px] break-all font-bold">{i.v}</span></div>
      ))}
    </div>
  </div>
);

export default BrowserInfoView;
