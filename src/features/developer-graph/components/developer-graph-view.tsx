import React, { useState } from 'react';
import { VisualGraph, GraphNode, GraphEdge, CdagTopology } from '@/types';
import { useCdagTopology, useCdagTopologyActions } from '@/stores/cdag-topology';
import DAGCanvas from './dag-canvas';
import { EditorSidebar } from './editor-sidebar';
import { PropertySidebar } from './property-sidebar';
import { GoogleGenAI, Type } from '@google/genai';
import { mergeTopology } from '@/lib/soulTopology';
import { generalizeConcept, processTextToLocalTopology } from '@/lib/google-ai';

interface DeveloperGraphViewProps {
  addTopologyNode?: (label: string, parents?: Record<string, number>) => void;
  deleteTopologyNode?: (label: string) => void;
}

/**
 * Developer Graph View - Refactored for Pattern C
 * 
 * Allows developers to create, edit, and visualize the CDAG topology structure.
 * Uses store hooks instead of prop drilling.
 */
const DeveloperGraphView: React.FC<DeveloperGraphViewProps> = ({ 
  addTopologyNode, 
  deleteTopologyNode 
}) => {
  const [selection, setSelection] = useState<{ type: 'node' | 'edge'; data: any } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGenLoading, setIsGenLoading] = useState(false);

  // Use store hooks (Pattern C)
  const topology = useCdagTopology();
  const { mergeTopology: mergeTopologyAction } = useCdagTopologyActions();

  const handleNodeClick = (node: GraphNode) => {
    setSelection({ type: 'node', data: node });
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    setSelection({ type: 'edge', data: edge });
  };

  const handleAddNode = (label: string, parents: string[]) => {
    // TODO: Implement via topology store
  };

  const handleAddEdge = (sourceId: string, targetId: string, weight: number) => {
    // TODO: Implement via topology store
  };

  const handleRemoveEdge = (edge: GraphEdge) => {
    setSelection(null);
  };

  const handleUpdateNode = (updated: GraphNode) => {
    setSelection({ type: 'node', data: updated });
  };

  const handleUpdateEdge = (updated: GraphEdge) => {
    setSelection({ type: 'edge', data: updated });
  };

  const handleAiGenerate = async (prompt: string) => {
    setIsAiLoading(true);
    try {
      // TODO: Implement AI generation
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGeneralize = async (concepts: string[]) => {
    setIsGenLoading(true);
    try {
      // TODO: Implement generalization
    } catch (error) {
      console.error('Generalization failed:', error);
    } finally {
      setIsGenLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex bg-gray-900">
      <div className="flex-1">
        <div className="text-white p-4">
          <h2>Developer Graph View</h2>
          <p className="text-gray-400 text-sm mt-2">
            Topology nodes: {Object.keys(topology).length}
          </p>
        </div>
      </div>
      
      {selection && (
        <PropertySidebar
          type={selection.type}
          data={selection.data}
          onUpdate={selection.type === 'node' ? handleUpdateNode : handleUpdateEdge}
        />
      )}

      <EditorSidebar
        onAddNode={handleAddNode}
        onAddEdge={handleAddEdge}
        onRemoveEdge={handleRemoveEdge}
        onAiGenerate={handleAiGenerate}
        onGeneralize={handleGeneralize}
        isAiLoading={isAiLoading}
        isGenLoading={isGenLoading}
      />
    </div>
  );
};

export default DeveloperGraphView;
