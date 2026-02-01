
import React, { useState } from 'react';
import { Zap, ChevronDown } from 'lucide-react';

interface DirectInputProps {
  nodeLabels: string[];
  recordExperience: (actions: string[], exp: number) => void;
}

const DirectInput: React.FC<DirectInputProps> = ({ nodeLabels, recordExperience }) => {
  const [exp, setExp] = useState("1.0");
  const [selectedNode, setSelectedNode] = useState("");
  const handleIncreaseExp = () => {
    const val = parseFloat(exp);
    if (selectedNode) recordExperience([selectedNode], val);
  };
  return (
    <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl relative overflow-hidden group">
      <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-indigo-100 rounded-lg"><Zap className="w-5 h-5 text-indigo-600" /></div><h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Experience Injector</h3></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">EXP Amount</label><input type="number" step="0.1" value={exp} onChange={(e) => setExp(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border-2 rounded-xl" /></div>
        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400">Target Node</label><div className="relative"><select value={selectedNode} onChange={(e) => setSelectedNode(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border-2 rounded-xl appearance-none"><option value="">Select Node</option>{nodeLabels.map(label => <option key={label} value={label}>{label}</option>)}</select><ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" /></div></div>
        <button onClick={handleIncreaseExp} className="w-full py-2 bg-slate-900 text-white font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2"><Zap className="w-4 h-4" />Inject Exp</button>
      </div>
    </div>
  );
};

export default DirectInput;
