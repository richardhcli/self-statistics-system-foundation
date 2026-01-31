import React, { useState } from 'react';
import { GraphNode, GraphEdge, VisualGraph } from '@/types';
import { Database, Plus, Trash2, Link, Sparkles, Loader2, GitMerge } from 'lucide-react';

interface EditorSidebarProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onAddNode: (label: string, parents: string[]) => void;
  onRemoveNode: (id: string) => void;
  onAddEdge: (source: string, target: string, weight: number) => void;
  onRemoveEdge: (edge: GraphEdge) => void;
  onAiGenerate: (prompt: string) => Promise<void>;
  onAiGeneralize: (concept: string) => Promise<void>;
  loading: boolean;
  generalizing: boolean;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ 
  nodes, 
  edges,
  onAddNode, 
  onRemoveNode,
  onAddEdge,
  onRemoveEdge,
  onAiGenerate, 
  onAiGeneralize,
  loading,
  generalizing
}) => {
  const [addNodeLabel, setAddNodeLabel] = useState('');
  const [addNodeParents, setAddNodeParents] = useState<string[]>([]);
  const [removeNodeId, setRemoveNodeId] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeWeight, setEdgeWeight] = useState<string>('1.0');
  const [removeEdgeId, setRemoveEdgeId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [genConcept, setGenConcept] = useState('');

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
    <div className="w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-xl overflow-y-auto architect-sidebar-scroll p-6 space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Graph Architect</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black flex items-center gap-1.5 mt-1">
          <Database className="w-3 h-3" /> IndexedDB Source
        </p>
      </div>

      <section className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Plus className="w-3 h-3 text-emerald-500" /> Add Node
        </label>
        <input 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
          placeholder="Node Label" 
          value={addNodeLabel} 
          onChange={e => setAddNodeLabel(e.target.value)} 
        />
        <label className="text-[9px] font-black text-slate-400 uppercase block mt-2">Optional Parents</label>
        <select 
          multiple 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24"
          value={addNodeParents} 
          onChange={e => setAddNodeParents(Array.from(e.target.selectedOptions, (o: any) => o.value))}
        >
          {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <button className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest" onClick={handleAddNodeSubmit}>Add Node</button>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Trash2 className="w-3 h-3 text-red-500" /> Remove Node
        </label>
        <select 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
          value={removeNodeId}
          onChange={e => setRemoveNodeId(e.target.value)}
        >
          <option value="">Select Node...</option>
          {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
        </select>
        <button 
          className="w-full py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-30" 
          disabled={!removeNodeId}
          onClick={() => { onRemoveNode(removeNodeId); setRemoveNodeId(''); }}
        >
          Delete Node
        </button>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Link className="w-3 h-3 text-indigo-500" /> Add Edge
        </label>
        <div className="space-y-2">
          <select 
            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={edgeSource}
            onChange={e => setEdgeSource(e.target.value)}
          >
            <option value="">Source Node...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <select 
            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={edgeTarget}
            onChange={e => setEdgeTarget(e.target.value)}
          >
            <option value="">Target Node...</option>
            {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <input 
            type="number" 
            step="any"
            className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
            value={edgeWeight}
            onChange={e => setEdgeWeight(e.target.value)}
          />
          <button className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest" onClick={handleAddEdgeSubmit}>Create Edge</button>
        </div>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <GitMerge className="w-3 h-3 text-violet-500" /> Neural Generalization
        </label>
        <input 
          className="w-full text-xs font-bold p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" 
          placeholder="Seed Concept (e.g. React)" 
          value={genConcept} 
          onChange={e => setGenConcept(e.target.value)} 
        />
        <button 
          className="w-full py-2.5 bg-violet-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-violet-100 disabled:opacity-50" 
          disabled={generalizing || !genConcept.trim()} 
          onClick={() => { onAiGeneralize(genConcept); setGenConcept(''); }}
        >
          {generalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
          {generalizing ? 'Generalizing...' : 'Expand Logic Chain'}
        </button>
      </section>

      <section className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-indigo-500" /> Batch AI Generation
        </label>
        <textarea 
          className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none min-h-[80px]" 
          placeholder="Describe a process..." 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)} 
        />
        <button 
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50" 
          disabled={loading} 
          onClick={() => { onAiGenerate(prompt); setPrompt(''); }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Processing...' : 'Generate Graph'}
        </button>
      </section>

      <div className="pt-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] text-center">
        GraphMind v1.0
      </div>
    </div>
  );
};