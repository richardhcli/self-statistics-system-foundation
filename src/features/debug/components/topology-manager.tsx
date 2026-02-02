
import React, { useState } from 'react';
import { Network, Plus, X, Trash2 } from 'lucide-react';
import { useGraphNodes, useGraphActions } from '@/stores/cdag-topology';

const TopologyManager: React.FC = () => {
  const nodes = useGraphNodes();
  const { addNode, removeNode } = useGraphActions();
  const [newLabel, setNewLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const handleAdd = () => { 
    if (newLabel.trim()) { 
      const id = newLabel.toLowerCase().replace(/\s+/g, '-');
      addNode({ id, label: newLabel.trim(), type: 'none' }); 
      setNewLabel(""); 
      setIsAdding(false); 
    } 
  };
  return (
    <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl">
      <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Network className="w-5 h-5 text-amber-600" /></div><h3 className="text-sm font-black uppercase text-slate-900">Topology Editor</h3></div><button onClick={() => setIsAdding(!isAdding)} className="p-2 bg-slate-900 text-white rounded-lg">{isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</button></div>
      {isAdding && <div className="mb-6 flex gap-3"><input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="flex-1 px-4 py-2 border-2 rounded-lg" /><button onClick={handleAdd} className="px-4 py-2 bg-indigo-600 text-white font-black text-xs rounded-lg">Register</button></div>}
      <div className="space-y-3">
        {Object.entries(nodes).map(([id, nodeData]) => (
          <div key={id} className="group border-2 border-slate-100 rounded-xl p-4 flex items-center justify-between">
            <div className="space-y-1"><h4 className="font-black text-slate-800 uppercase flex items-center gap-2">{nodeData.label}<span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded uppercase">{nodeData.type}</span></h4></div>
            <button onClick={() => removeNode(id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopologyManager;