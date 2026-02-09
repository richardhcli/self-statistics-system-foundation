import { useJournalEntryPipeline } from '@/features/journal/hooks/use-journal-entry-pipeline';
import { useGraphActions } from '@/stores/cdag-topology';
import type {
  CdagStoreSnapshot,
  CdagStructure,
  EdgeData,
  GraphState,
  NodeData,
} from '@/stores/cdag-topology/types';
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
    const { setSnapshot } = useGraphActions();
    const snapshot = buildSnapshotFromGraph(COMPLEX_TOPOLOGY_DATA);
    setSnapshot(snapshot);
  };
};

/**
 * Injects the Brain CDAG topology directly.
 * 
 * Represents a complex personal development and cognitive skill tree.
 */
export const createInjectBrainTopologyDataHook = () => {
  return () => {
    const { setSnapshot } = useGraphActions();
    const snapshot = buildSnapshotFromGraph(BRAIN_TOPOLOGY_DATA);
    setSnapshot(snapshot);
  };
};

const buildSnapshotFromGraph = (graph: GraphState): CdagStoreSnapshot => {
  const adjacencyList: CdagStructure['adjacencyList'] = {};

  Object.values(graph.edges).forEach((edge) => {
    if (!adjacencyList[edge.source]) {
      adjacencyList[edge.source] = [];
    }
    if (!adjacencyList[edge.source].some((entry) => entry.target === edge.target)) {
      adjacencyList[edge.source].push({
        target: edge.target,
        weight: edge.weight,
      });
    }
  });

  const nodeSummaries = Object.values(graph.nodes).reduce<CdagStructure['nodeSummaries']>(
    (acc, node) => {
      acc[node.id] = { id: node.id, label: node.label, type: node.type };
      return acc;
    },
    {}
  );

  const metadata = {
    nodes: {},
    edges: {},
    structure: { lastFetched: 0, isDirty: false },
    fullFetchAt: 0,
  };

  return {
    nodes: graph.nodes,
    edges: graph.edges,
    structure: {
      adjacencyList,
      nodeSummaries,
      metrics: {
        nodeCount: Object.keys(graph.nodes).length,
        edgeCount: Object.keys(graph.edges).length,
      },
      version: 1,
    },
    metadata,
  };
};
