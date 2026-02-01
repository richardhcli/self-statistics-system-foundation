import React, { useState } from 'react';
import { VisualGraph, GraphNode, GraphEdge, AppData, CdagTopology } from '@/types';
import DAGCanvas from './dag-canvas';
import { EditorSidebar } from './editor-sidebar';
import { PropertySidebar } from './property-sidebar';
import { GoogleGenAI, Type } from '@google/genai';
import { mergeTopology } from '@/lib/soulTopology';
import { generalizeConcept, processTextToLocalTopology } from '@/lib/google-ai';

interface DeveloperGraphViewProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  addTopologyNode: (label: string, parents?: Record<string, number>) => void;
  deleteTopologyNode: (label: string) => void;
}

const DeveloperGraphView: React.FC<DeveloperGraphViewProps> = ({ 
  data, 
  setData, 
  addTopologyNode, 
  deleteTopologyNode 
}) => {
  const [selection, setSelection] = useState<{ type: 'node' | 'edge'; data: any } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGenLoading, setIsGenLoading] = useState(false);

  const handleNodeClick = (node: GraphNode) => {
    setSelection({ type: 'node', data: node });
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    setSelection({ type: 'edge', data: edge });
  };

  const handleAddNode = (label: string, parents: string[]) => {
    const parentMap: Record<string, number> = {};
    parents.forEach(id => {
      const node = data.visualGraph.nodes.find(n => n.id === id);
      if (node) parentMap[node.label] = 1.0;
    });
    addTopologyNode(label, parentMap);
  };

  const handleAddEdge = (sourceId: string, targetId: string, weight: number) => {
    const sourceNode = data.visualGraph.nodes.find(n => n.id === sourceId);
    const targetNode = data.visualGraph.nodes.find(n => n.id === targetId);
    if (!sourceNode || !targetNode) return;

    setData(prev => {
      const fragment: CdagTopology = {
        [targetNode.label]: {
          parents: { [sourceNode.label]: weight },
          type: 'none'
        }
      };
      return mergeTopology(prev, fragment);
    });
  };

  const handleRemoveEdge = (edge: GraphEdge) => {
    const sourceLabel = data.visualGraph.nodes.find(n => n.id === (typeof edge.source === 'string' ? edge.source : (edge.source as any).id))?.label;
    const targetLabel = data.visualGraph.nodes.find(n => n.id === (typeof edge.target === 'string' ? edge.target : (edge.target as any).id))?.label;
    if (!sourceLabel || !targetLabel) return;

    setData(prev => {
      const nextTopology = { ...prev.cdagTopology };
      const nodeData = { ...nextTopology[targetLabel] };
      const parents = { ...nodeData.parents };
      delete parents[sourceLabel];
      nextTopology[targetLabel] = { ...nodeData, parents };
      return { ...prev, cdagTopology: nextTopology };
    });
    setSelection(null);
  };

  const handleUpdateNode = (updated: GraphNode) => {
    const originalLabel = data.visualGraph.nodes.find(n => n.id === updated.id)?.label;
    if (!originalLabel) return;

    setData(prev => {
      const nextTopology = { ...prev.cdagTopology };
      const nodeData = nextTopology[originalLabel];
      delete nextTopology[originalLabel];
      nextTopology[updated.label] = nodeData;
      
      Object.keys(nextTopology).forEach(k => {
        if (nextTopology[k].parents[originalLabel] !== undefined) {
          const weight = nextTopology[k].parents[originalLabel];
          delete nextTopology[k].parents[originalLabel];
          nextTopology[k].parents[updated.label] = weight;
        }
      });

      return { ...prev, cdagTopology: nextTopology };
    });
    setSelection({ type: 'node', data: updated });
  };

  const handleUpdateEdge = (updated: GraphEdge) => {
    const sourceLabel = data.visualGraph.nodes.find(n => n.id === (typeof updated.source === 'string' ? updated.source : (updated.source as any).id))?.label;
    const targetLabel = data.visualGraph.nodes.find(n => n.id === (typeof updated.target === 'string' ? updated.target : (updated.target as any).id))?.label;
    if (!sourceLabel || !targetLabel) return;

    setData(prev => {
      const fragment: CdagTopology = {
        [targetLabel]: {
          parents: { [sourceLabel]: updated.proportion },
          type: 'none'
        }
      };
      return mergeTopology(prev, fragment);
    });
    setSelection({ type: 'edge', data: updated });
  };

  const handleAiGenerate = async (prompt: string) => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a directed acyclic graph hierarchy (Action Map) based on: "${prompt}". 
        Format the response as a JSON object with 'nodes' (array of strings) and 'edges' (array of {source: string, target: string, weight: number}). 
        Root nodes should have no parents. Max 10 nodes.`,
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nodes: { type: Type.ARRAY, items: { type: Type.STRING } },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING },
                    weight: { type: Type.NUMBER }
                  },
                  required: ['source', 'target', 'weight']
                }
              }
            },
            required: ['nodes', 'edges']
          }
        }
      });

      const result = JSON.parse(response.text || '{"nodes":[],"edges":[]}');
      setData(prev => {
        const fragment: CdagTopology = {};
        result.nodes.forEach((label: string) => {
          fragment[label] = { parents: {}, type: 'none' };
        });
        result.edges.forEach((e: any) => {
          if (fragment[e.target]) {
            fragment[e.target].parents[e.source] = e.weight;
          } else {
            fragment[e.target] = { parents: { [e.source]: e.weight }, type: 'none' };
          }
        });
        return mergeTopology(prev, fragment);
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiGeneralize = async (concept: string) => {
    setIsGenLoading(true);
    try {
      // Step 1: Extract basic 3-layer classification for the concept
      const analysis = await processTextToLocalTopology(concept);
      const actionLabels = analysis.weightedActions.map(a => a.label);
      
      // Step 2: Use those layers to generate a deep abstract chain
      const result = await generalizeConcept(actionLabels, analysis.skills, analysis.characteristics);
      
      if (result.chain && result.chain.length > 0) {
        setData(prev => {
          const fragment: CdagTopology = {};
          
          // First, register the 3-layer analysis as a base
          analysis.characteristics.forEach(c => {
            if (!fragment[c]) fragment[c] = { parents: {}, type: 'characteristic' };
          });
          analysis.skills.forEach(s => {
            const firstChar = analysis.characteristics[0];
            if (!fragment[s]) fragment[s] = { parents: firstChar ? { [firstChar]: 1.0 } : {}, type: 'skill' };
          });
          analysis.weightedActions.forEach(wa => {
            const firstSkill = analysis.skills[0];
            if (!fragment[wa.label]) fragment[wa.label] = { parents: firstSkill ? { [firstSkill]: wa.weight } : {}, type: 'action' };
          });

          // Then merge the abstract chain
          result.chain.forEach(link => {
            if (!fragment[link.child]) fragment[link.child] = { parents: {}, type: 'none' };
            if (!fragment[link.parent]) fragment[link.parent] = { parents: {}, type: 'none' };
            fragment[link.child].parents[link.parent] = link.weight;
          });
          
          return mergeTopology(prev, fragment);
        });
      }
    } finally {
      setIsGenLoading(false);
    }
  };

  return (
    <div className="flex h-[750px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
      <EditorSidebar 
        nodes={data.visualGraph.nodes}
        edges={data.visualGraph.edges}
        onAddNode={handleAddNode}
        onRemoveNode={id => {
          const label = data.visualGraph.nodes.find(n => n.id === id)?.label;
          if (label) deleteTopologyNode(label);
        }}
        onAddEdge={handleAddEdge}
        onRemoveEdge={handleRemoveEdge}
        onAiGenerate={handleAiGenerate}
        onAiGeneralize={handleAiGeneralize}
        loading={isAiLoading}
        generalizing={isGenLoading}
      />
      
      <div className="flex-1 relative bg-slate-50">
        <DAGCanvas 
          data={data.visualGraph} 
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          selectedId={selection?.data.id}
        />
      </div>

      {selection && (
        <PropertySidebar 
          selection={selection as any}
          onUpdateNode={handleUpdateNode}
          onUpdateEdge={handleUpdateEdge}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  );
};

export default DeveloperGraphView;
