import { useJournalEntryPipeline } from '@/features/journal/hooks/use-journal-entry-pipeline';
import { useGraphActions } from '@/stores/cdag-topology';
import type { CdagTopology } from '@/stores/cdag-topology/types';
import type { EdgeData, GraphState, NodeData } from '@/stores/cdag-topology/types';
import { 
  AI_TEST_ENTRIES, 
  MANUAL_TEST_ENTRIES, 
  COMPLEX_TOPOLOGY_DATA,
  BRAIN_TOPOLOGY_DATA
} from '@/testing';

/**
 * API for injecting mock datasets into the application for testing.
 * 
 * Functional Description:
 * Orchestrates the batch creation of journal entries.
 * - AI Injections: Passes raw strings to the Gemini-powered pipeline.
 * - Manual Injections: Directly tags entries with pre-defined actions.
 * 
 * NOTE: This is designed to be called from a React component context
 * where hooks can be used. See DebugView for usage example.
 */
export const createInjectTestDataHook = () => {
  return async (isAI: boolean) => {
    const { processManualEntry } = useJournalEntryPipeline();
    const entries = isAI ? AI_TEST_ENTRIES : MANUAL_TEST_ENTRIES;

    for (const e of entries) {
      if (typeof e === 'string') {
        await processManualEntry(e, { useAI: true });
      } else {
        await processManualEntry(e.c, { useAI: false, actions: e.a });
      }
      
      // Staggered delay ensures that generated timestamps are unique 
      // at the millisecond level for IndexedDB key safety.
      await new Promise(r => setTimeout(r, 350));
    }
  };
};

/**
 * Injects a complex CDAG topology directly.
 * 
 * Useful for verifying graph visualization stability and 
 * multi-path experience propagation logic.
 * 
 * NOTE: This must be called from a React component context.
 */
export const createInjectTopologyDataHook = () => {
  return () => {
    const { setGraph } = useGraphActions();
    const graphState = normalizeTopology(COMPLEX_TOPOLOGY_DATA);
    setGraph(graphState);
  };
};

/**
 * Injects the Brain CDAG topology directly.
 * 
 * Represents a complex personal development and cognitive skill tree.
 */
export const createInjectBrainTopologyDataHook = () => {
  return () => {
    const { setGraph } = useGraphActions();
    const graphState = normalizeTopology(BRAIN_TOPOLOGY_DATA);
    setGraph(graphState);
  };
};

/**
 * Normalize legacy topology into GraphState.
 * Supports both GraphState and legacy parent-mapped datasets.
 */
const normalizeTopology = (topology: CdagTopology): GraphState => {
  if ((topology as GraphState).nodes && (topology as GraphState).edges) {
    return topology as GraphState;
  }

  const legacy = topology as Record<string, { parents: Record<string, number>; type?: NodeData["type"] }>;
  const nodes: Record<string, NodeData> = {};
  const edges: Record<string, EdgeData> = {};

  Object.entries(legacy).forEach(([nodeId, nodeData]) => {
    nodes[nodeId] = {
      id: nodeId,
      label: nodeId,
      type: nodeData.type ?? "none",
    };

    Object.entries(nodeData.parents || {}).forEach(([parentId, weight]) => {
      const edgeId = `${parentId}__${nodeId}`;
      edges[edgeId] = {
        id: edgeId,
        source: parentId,
        target: nodeId,
        weight,
      };
    });
  });

  return {
    nodes,
    edges,
    version: 2,
  };
};
