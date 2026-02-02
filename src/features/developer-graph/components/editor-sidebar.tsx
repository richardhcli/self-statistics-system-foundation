import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '@/types';
import { Database, Plus, Trash2, Link } from 'lucide-react';

interface EditorSidebarProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onAddNode: (label: string, parents: string[]) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (source: string, target: string, weight: number) => void;
  onRemoveEdge: (edge: GraphEdge) => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  nodes, 
  edges,
  onAddNode, 
  onRemoveNode,
  onAddEdge,
  onRemoveEdge,
}) => {
  const [addNodeLabel, setAddNodeLabel] = useState('');
  const [addNodeParents, setAddNodeParents] = useState<string[]>([]);
  const [removeNodeId, setRemoveNodeId] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState<string>('1.0');
  const [removeEdgeId, setRemoveEdgeId] = useState('');

  const handleAddNodeSubmit = () => {
    if (!addNodeLabel.trim()) return;
    onAddNode(addNodeLabel.trim(), addNodeParents);
    setAddNodeLabel('');
    setAddNodeParents([]);
  };

  const handleAddEdgeSubmit = () => {
    const weightVal = parseFloat(edgeWeight);
    if (!edgeSource || !edgeTarget || edgeSource === edgeTarget || isNaN(weightVal)) return;
    onAddEdge(edgeSource, edgeTarget, weightVal);
    setEdgeSource('');
    setEdgeTarget('');
    setEdgeWeight('1.0');
  };

  return (
    <div className="w-80 h-full bg-white border-r border-slate-200 flex flex-col shadow-lg overflow-y-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Graph Editor</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5 mt-1">
          <Database className="w-3 h-3" /> Global Store
        </p>
      </div>

      {/* Add Node Section */}
      <section className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Plus className="w-3 h-3 text-emerald-500" /> Add Node
        </label>
        <input 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" 
          placeholder="Node Label" 
          value={addNodeLabel} 
          onChange={e => setAddNodeLabel(e.target.value)} 
        />
        <label className="text-[9px] font-black text-slate-400 uppercase block mt-2">Optional Parent Nodes</label>
        <select 
          multiple 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24"
          value={addNodeParents} 
          onChange={e => setAddNodeParents(Array.from(e.target.selectedOptions, (o: any) => o.value))}
        >
          {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <button 
          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors"
          onClick={handleAddNodeSubmit}
        >
          Add Node
        </button>
      </section>

      {/* Remove Node Section */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Trash2 className="w-3 h-3 text-red-500" /> Remove Node
        </label>
        <select 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
          value={removeNodeId}
          onChange={e => setRemoveNodeId(e.target.value)}
        >
          <option value="">Select Node...</option>
          {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <button 
          className="w-full py-2.5 border-2 border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!removeNodeId}
          onClick={() => { onRemoveNode(removeNodeId); setRemoveNodeId(''); }}
        >
          Delete Node
        </button>
      </section>

      {/* Add Edge Section */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Link className="w-3 h-3 text-indigo-500" /> Add Edge
        </label>
        <div className="space-y-2">
          <select 
            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={edgeSource}
            onChange={e => setEdgeSource(e.target.value)}
          >
            <option value="">Source Node...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <select 
            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={edgeTarget}
            onChange={e => setEdgeTarget(e.target.value)}
          >
            <option value="">Target Node...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <input 
            type="number" 
            step="any"
            placeholder="Weight (e.g. 1.0)"
            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
            value={edgeWeight}
            onChange={e => setEdgeWeight(e.target.value)}
          />
          <button 
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors"
            onClick={handleAddEdgeSubmit}
          >
            Create Edge
          </button>
        </div>
      </section>

      {/* Remove Edge Section */}
      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Trash2 className="w-3 h-3 text-red-500" /> Remove Edge
        </label>
        <select 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
          onChange={e => {
            const selectedEdgeId = e.target.value;
            if (selectedEdgeId) {
              const edge = edges.find(ed => ed.id === selectedEdgeId);
              if (edge) {
                onRemoveEdge(edge);
              }
            }
          }}
          value={removeEdgeId}
        >
          <option value="">Select Edge...</option>
          {edges.map(e => {
            const sourceLabel = nodes.find(n => n.id === e.source)?.label || e.source;
            const targetLabel = nodes.find(n => n.id === e.target)?.label || e.target;
            return <option key={e.id} value={e.id}>{sourceLabel} → {targetLabel}</option>;
          })}
        </select>
      </section>

      <div className="pt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] text-center border-t border-slate-100">
        Developer Graph v1.0
      </div>
    </div>
  );
};