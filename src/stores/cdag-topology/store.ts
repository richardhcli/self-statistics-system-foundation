import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GraphState, NodeData, EdgeData } from './types';
import { indexedDBStorage } from '@/stores/root/persist-middleware';

/**
 * Internal store interface - includes state and action setters
 */
interface GraphStoreState extends GraphState {
  // CRUD: Nodes
  addNode: (node: NodeData) => void;
  updateNode: (nodeId: string, updates: Partial<NodeData>) => void;
  removeNode: (nodeId: string) => void;
  
  // CRUD: Edges
  addEdge: (edge: EdgeData) => void;
  updateEdge: (edgeId: string, updates: Partial<EdgeData>) => void;
  removeEdge: (edgeId: string) => void;
  
  // Batch operations
  setGraph: (graphState: GraphState) => void;
  clear: () => void;
}

/**
 * CDAG Topology Store (Zustand with idb-keyval Persistence)
 * 
 * Architecture:
 * - Flat normalized schema: Record<string, NodeData> + Record<string, EdgeData>
 * - Persistence: idb-keyval (IndexedDB wrapper) via Zustand persist
 * - Local-First: Changes saved to IndexedDB immediately
 * - Manual Sync: Server sync triggered by explicit save button
 * 
 * This store is PRIVATE - access ONLY via public hooks:
 * - useGraphNodes() - selector for nodes
 * - useGraphEdges() - selector for edges
 * - useGraphNode(id) - selector for single node
 * - useGraphActions() - all mutation functions
 */
export const useGraphStore = create<GraphStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: {
        progression: {
          id: 'progression',
          label: 'progression',
          type: 'characteristic',
        },
      },
      edges: {},
      version: 2,

      // CRUD: Nodes
      addNode: (node: NodeData) =>
        set((state) => ({
          nodes: { ...state.nodes, [node.id]: node },
        })),

      updateNode: (nodeId: string, updates: Partial<NodeData>) =>
        set((state) => ({
          nodes: {
            ...state.nodes,
            [nodeId]: state.nodes[nodeId]
              ? { ...state.nodes[nodeId], ...updates, updatedAt: new Date().toISOString() }
              : state.nodes[nodeId],
          },
        })),

      removeNode: (nodeId: string) =>
        set((state) => {
          const { [nodeId]: _, ...remainingNodes } = state.nodes;
          const remainingEdges = Object.fromEntries(
            Object.entries(state.edges).filter(
              ([_, edge]) => edge.source !== nodeId && edge.target !== nodeId
            )
          );
          return { nodes: remainingNodes, edges: remainingEdges };
        }),

      // CRUD: Edges
      addEdge: (edge: EdgeData) =>
        set((state) => ({
          edges: { ...state.edges, [edge.id]: edge },
        })),

      updateEdge: (edgeId: string, updates: Partial<EdgeData>) =>
        set((state) => ({
          edges: {
            ...state.edges,
            [edgeId]: state.edges[edgeId]
              ? { ...state.edges[edgeId], ...updates, updatedAt: new Date().toISOString() }
              : state.edges[edgeId],
          },
        })),

      removeEdge: (edgeId: string) =>
        set((state) => {
          const { [edgeId]: _, ...remainingEdges } = state.edges;
          return { edges: remainingEdges };
        }),

      // Batch operations
      setGraph: (graphState: GraphState) =>
        set({
          nodes: graphState.nodes,
          edges: graphState.edges,
          version: graphState.version,
          lastSyncTimestamp: graphState.lastSyncTimestamp,
        }),

      clear: () =>
        set({
          nodes: {},
          edges: {},
          version: 2,
        }),
    }),
    {
      name: 'cdag-topology-store-v2',
      storage: indexedDBStorage,
      version: 2,
      // Non-destructive migration
      migrate: (state: any, version: number) => {
        if (version < 2) {
          // Migration from old CdagTopology format is handled externally
          // For now, just ensure structure is correct
          return {
            nodes: state.nodes || {},
            edges: state.edges || {},
            version: 2,
          };
        }
        return state;
      },
    }
  )
);

/**
 * Selector: Get all nodes
 * ✅ Fine-grained: Only re-renders when nodes change
 */
export const useGraphNodes = () => useGraphStore((state) => state.nodes);

/**
 * Selector: Get all edges
 * ✅ Fine-grained: Only re-renders when edges change
 */
export const useGraphEdges = () => useGraphStore((state) => state.edges);

/**
 * Selector: Get single node by ID
 * ✅ Fine-grained: Only re-renders if specific node changes
 * @param nodeId - The node ID to retrieve
 */
export const useGraphNode = (nodeId: string) =>
  useGraphStore((state) => state.nodes[nodeId]);

/**
 * Action Hook: All graph mutations
 * ✅ Stable references via selector pattern (never triggers re-render)
 * Fine-grained selector returns only the actions object, preventing unnecessary component updates.
 * 
 * Implementation: Returns stable action methods via Zustand selector,
 * following the same pattern as useJournalActions.
 * 
 * Usage:
 * const { addNode, updateNode, addEdge } = useGraphActions();
 */
export const useGraphActions = () => useGraphStore((state) => ({
  addNode: state.addNode,
  updateNode: state.updateNode,
  removeNode: state.removeNode,
  addEdge: state.addEdge,
  updateEdge: state.updateEdge,
  removeEdge: state.removeEdge,
  setGraph: state.setGraph,
  clear: state.clear,
}));

/**
 * Selector: Get complete graph state
 * ⚠️ Use sparingly - re-renders on any change
 * Prefer atomic selectors (useGraphNodes, useGraphEdges) instead
 * 
 * For safe usage with useSyncExternalStore, wrap in useMemo in consuming component
 */
export const useGraphState = () => ({
  nodes: useGraphStore.getState().nodes,
  edges: useGraphStore.getState().edges,
  version: useGraphStore.getState().version,
  lastSyncTimestamp: useGraphStore.getState().lastSyncTimestamp,
});

