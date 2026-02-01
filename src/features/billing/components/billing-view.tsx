
import React from 'react';
import { CreditCard, CheckCircle2, Zap, Shield, Crown } from 'lucide-react';

const BillingView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2"><h2 className="text-3xl font-black text-slate-900">Upgrade Your Second Brain</h2><p className="text-slate-500 max-w-lg mx-auto">Unlock advanced temporal reasoning and unlimited graph persistence.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col"><div className="mb-6"><h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Standard</h3><div className="flex items-baseline gap-1"><span className="text-4xl font-black text-slate-900">$0</span><span className="text-slate-400 font-bold">/mo</span></div></div><ul className="space-y-4 mb-8 flex-1">
          {["Local Persistence", "Action Flow Graph", "Voice Journaling", "AI Analysis"].map(f => <li key={f} className="flex items-center gap-3 text-sm text-slate-600 font-medium"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{f}</li>)}
        </ul><button className="w-full py-3 px-4 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">Current Plan</button></div>
        <div className="bg-white p-8 rounded-3xl border-2 border-indigo-600 shadow-xl flex flex-col relative overflow-hidden"><div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black uppercase px-4 py-1.5 tracking-widest">Recommended</div><div className="mb-6"><h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-1">Pro Explorer</h3><div className="flex items-baseline gap-1"><span className="text-4xl font-black text-slate-900">$12</span><span className="text-slate-400 font-bold">/mo</span></div></div><ul className="space-y-4 mb-8 flex-1">
          {["Cloud Sync", "Semantic Search", "Unlimited Complexity", "Early Access", "Priority Support"].map(f => <li key={f} className="flex items-center gap-3 text-sm text-slate-600 font-medium"><Zap className="w-4 h-4 text-indigo-500 fill-indigo-500" />{f}</li>)}
        </ul><button className="w-full py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Crown className="w-4 h-4" /> Upgrade to Pro</button></div>
      </div>
    </div>
  );
};

export default BillingView;
