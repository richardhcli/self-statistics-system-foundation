
import React from 'react';
import { GraphNode, GraphEdge } from '@/types';
import { X, Info, Layers, Link, Zap } from 'lucide-react';

type SelectedElement = 
  | { type: 'node'; data: GraphNode }
  | { type: 'edge'; data: GraphEdge };

interface PropertySidebarProps {
  selection: SelectedElement;
  onUpdateNode: (n: GraphNode) => void;
  onUpdateEdge: (e: GraphEdge) => void;
  onClose: () => void;
}

export const PropertySidebar: React.FC<PropertySidebarProps> = ({ selection, onUpdateNode, onUpdateEdge, onClose }) => {
  
  const handleNodeChange = (field: string, value: string) => {
    if (selection.type !== 'node') return;
    onUpdateNode({
      ...selection.data,
      [field]: value
    });
  };

  const handleEdgeChange = (field: string, value: string) => {
    if (selection.type !== 'edge') return;
    let finalValue: any = value;
    if (field === 'proportion') {
      finalValue = parseFloat(value);
      if (isNaN(finalValue)) return;
    }
    onUpdateEdge({
      ...selection.data,
      [field]: finalValue
    });
  };

  const isNode = selection.type === 'node';
  const isEdge = selection.type === 'edge';

  return (
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-xl animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{isNode ? 'Node Properties' : 'Edge Properties'}</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mt-1">Config Explorer</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        <section className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Info className="w-3 h-3" /> Internal ID
          </label>
          <div className="w-full text-xs font-mono p-2.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
            {selection.data.id}
          </div>
        </section>
        
        {isNode && (
          <>
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> Label
              </label>
              <input 
                type="text"
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={selection.data.label || ''}
                onChange={(e) => handleNodeChange('label', e.target.value)}
              />
            </section>

            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> Hierarchy Layer
              </label>
              <div className="w-full text-xs font-bold p-2.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
                {selection.data.level ?? 0}
              </div>
            </section>
          </>
        )}

        {isEdge && (
          <>
            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Link className="w-3 h-3" /> Source Node
              </label>
              <div className="w-full text-xs font-mono p-2.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
                {typeof selection.data.source === 'string' ? selection.data.source : (selection.data.source as any).id}
              </div>
            </section>

            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Link className="w-3 h-3" /> Target Node
              </label>
              <div className="w-full text-xs font-mono p-2.5 bg-slate-100 text-slate-500 rounded-xl border border-slate-200">
                {typeof selection.data.target === 'string' ? selection.data.target : (selection.data.target as any).id}
              </div>
            </section>

            <section className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Weight (Float)
              </label>
              <input 
                type="number"
                step="any"
                className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={selection.data.proportion}
                onChange={(e) => handleEdgeChange('proportion', e.target.value)}
              />
            </section>
          </>
        )}
      </div>

      <div className="p-6 pt-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest italic border-t border-slate-50">
        Changes are saved to local state automatically.
      </div>
    </div>
  );
};
