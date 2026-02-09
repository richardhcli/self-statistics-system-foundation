import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  arrayRemove,
  arrayUnion,
  deleteField,
  increment,
} from 'firebase/firestore';
import {
  createEdgeBatch,
  createNodeBatch,
  deleteEdgeBatch,
  deleteNodeBatch,
  fetchEdgesByIds,
  fetchNodesByIds,
  fetchStructure as fetchStructureFromFirebase,
  subscribeToStructure,
  updateEdgeBatch,
  updateNodeBatch,
} from '@/lib/firebase/cdag-topology';
import { auth } from '@/lib/firebase/services';
import { indexedDBStorage } from '@/stores/root/persist-middleware';
import type {
  CdagMetadata,
  CdagStoreSnapshot,
  CdagStructure,
  EdgeData,
  NodeData,
} from './types';

const CACHE_TTL_MS = 1000 * 60 * 5;
const DEFAULT_NODE_ID = 'progression';
const DEFAULT_NODE: NodeData = {
  id: DEFAULT_NODE_ID,
  label: 'Progression',
  type: 'characteristic',
};

const buildEdgeId = (source: string, target: string) => `${source}->${target}`;

const getCurrentUserId = () => auth.currentUser?.uid ?? null;

const isCacheStale = (cacheInfo: { lastFetched: number; isDirty?: boolean } | undefined) => {
  if (!cacheInfo) return true;
  if (cacheInfo.isDirty) return true;
  return Date.now() - cacheInfo.lastFetched > CACHE_TTL_MS;
};

const buildEmptyStructure = (): CdagStructure => ({
  adjacencyList: {},
  nodeSummaries: {
    [DEFAULT_NODE_ID]: {
      id: DEFAULT_NODE_ID,
      label: DEFAULT_NODE.label,
      type: DEFAULT_NODE.type,
    },
  },
  metrics: { nodeCount: 1, edgeCount: 0 },
  version: 1,
});

const buildEmptyMetadata = (): CdagMetadata => ({
  nodes: {},
  edges: {},
  structure: { lastFetched: 0, isDirty: false },
});

const ensureDefaultNode = (nodes: Record<string, NodeData>) => {
  if (nodes[DEFAULT_NODE_ID]) return nodes;
  return { ...nodes, [DEFAULT_NODE_ID]: DEFAULT_NODE };
};

const ensureStructureDefaults = (structure?: CdagStructure): CdagStructure => {
  if (!structure) return buildEmptyStructure();

  return {
    adjacencyList: structure.adjacencyList ?? {},
    nodeSummaries: {
      ...buildEmptyStructure().nodeSummaries,
      ...(structure.nodeSummaries ?? {}),
    },
    metrics: structure.metrics ?? { nodeCount: 0, edgeCount: 0 },
    lastUpdated: structure.lastUpdated,
    version: structure.version ?? 1,
  };
};

/**
 * Internal store interface - includes state and stable actions object.
 */
interface GraphStoreState {
  nodes: Record<string, NodeData>;
  edges: Record<string, EdgeData>;
  structure: CdagStructure;
  metadata: CdagMetadata;

  actions: {
    setSnapshot: (snapshot: CdagStoreSnapshot) => void;
    setStructure: (structure: CdagStructure) => void;
    cacheNodes: (nodes: NodeData[]) => void;
    cacheEdges: (edges: EdgeData[]) => void;
    upsertNode: (node: NodeData) => void;
    upsertEdge: (edge: EdgeData) => void;
    addNode: (node: NodeData) => void;
    updateNode: (nodeId: string, updates: Partial<NodeData>) => void;
    removeNode: (nodeId: string) => void;
    addEdge: (edge: EdgeData) => void;
    updateEdge: (edgeId: string, updates: Partial<EdgeData>) => void;
    removeEdge: (edgeId: string) => void;
    invalidateStructure: () => void;
    fetchStructure: (uid: string, force?: boolean) => Promise<void>;
    subscribeToStructure: (uid: string) => () => void;
    fetchNodes: (uid: string, ids: string[], force?: boolean) => Promise<void>;
    fetchEdges: (uid: string, ids: string[], force?: boolean) => Promise<void>;
  };
}

/**
 * CDAG Topology Store (Zustand with Persist Middleware)
 *
 * Architecture:
 * - Firebase is the source of truth
 * - Zustand + IndexedDB are a read-aside cache
 * - Structure doc holds adjacency + lightweight node summaries
 *
 * Access ONLY via public hooks:
 * - useGraphNodes() / useGraphEdges() / useGraphStructure()
 * - useGraphActions()
 */
export const useGraphStore = create<GraphStoreState>()(
  persist(
    (set, get) => {
      const actions = {
        setSnapshot: (snapshot: CdagStoreSnapshot) =>
          set(() => ({
            nodes: ensureDefaultNode(snapshot.nodes ?? {}),
            edges: snapshot.edges ?? {},
            structure: ensureStructureDefaults(snapshot.structure),
            metadata: snapshot.metadata ?? buildEmptyMetadata(),
          })),

        setStructure: (structure: CdagStructure) =>
          set((state) => {
            const now = Date.now();
            const nextStructure = ensureStructureDefaults(structure);
            const nextNodes = { ...state.nodes };
            const nextEdges = { ...state.edges };
            const nextMetadata: CdagMetadata = {
              nodes: { ...state.metadata.nodes },
              edges: { ...state.metadata.edges },
              structure: { lastFetched: now, isDirty: false },
            };

            Object.values(nextStructure.nodeSummaries).forEach((summary) => {
              if (!nextNodes[summary.id]) {
                nextNodes[summary.id] = {
                  id: summary.id,
                  label: summary.label,
                  type: summary.type,
                };
              }

              if (!nextMetadata.nodes[summary.id]) {
                nextMetadata.nodes[summary.id] = { lastFetched: 0, isDirty: false };
              }
            });

            Object.entries(nextStructure.adjacencyList).forEach(([source, targets]) => {
              targets.forEach((target) => {
                const edgeId = buildEdgeId(source, target);
                if (!nextEdges[edgeId]) {
                  nextEdges[edgeId] = {
                    id: edgeId,
                    source,
                    target,
                    weight: 1.0,
                  };
                }

                if (!nextMetadata.edges[edgeId]) {
                  nextMetadata.edges[edgeId] = { lastFetched: 0, isDirty: false };
                }
              });
            });

            return {
              nodes: ensureDefaultNode(nextNodes),
              edges: nextEdges,
              structure: nextStructure,
              metadata: nextMetadata,
            };
          }),

        cacheNodes: (nodes: NodeData[]) =>
          set((state) => {
            const now = Date.now();
            const nextNodes = { ...state.nodes };
            const nextMetadata = { ...state.metadata.nodes };

            nodes.forEach((node) => {
              nextNodes[node.id] = node;
              nextMetadata[node.id] = { lastFetched: now, isDirty: false };
            });

            return {
              nodes: ensureDefaultNode(nextNodes),
              metadata: { ...state.metadata, nodes: nextMetadata },
            };
          }),

        cacheEdges: (edges: EdgeData[]) =>
          set((state) => {
            const now = Date.now();
            const nextEdges = { ...state.edges };
            const nextMetadata = { ...state.metadata.edges };

            edges.forEach((edge) => {
              nextEdges[edge.id] = edge;
              nextMetadata[edge.id] = { lastFetched: now, isDirty: false };
            });

            return {
              edges: nextEdges,
              metadata: { ...state.metadata, edges: nextMetadata },
            };
          }),

        upsertNode: (node: NodeData) => {
          const { nodes } = get();
          if (nodes[node.id]) {
            actions.updateNode(node.id, node);
          } else {
            actions.addNode(node);
          }
        },

        upsertEdge: (edge: EdgeData) => {
          const { edges } = get();
          if (edges[edge.id]) {
            actions.updateEdge(edge.id, edge);
          } else {
            actions.addEdge(edge);
          }
        },

        addNode: (node: NodeData) => {
          set((state) => {
            const nextNodes = { ...state.nodes, [node.id]: node };
            const nextStructure = ensureStructureDefaults(state.structure);

            return {
              nodes: ensureDefaultNode(nextNodes),
              structure: {
                ...nextStructure,
                nodeSummaries: {
                  ...nextStructure.nodeSummaries,
                  [node.id]: { id: node.id, label: node.label, type: node.type },
                },
                metrics: {
                  nodeCount: nextStructure.metrics.nodeCount + 1,
                  edgeCount: nextStructure.metrics.edgeCount,
                },
              },
              metadata: {
                ...state.metadata,
                nodes: {
                  ...state.metadata.nodes,
                  [node.id]: { lastFetched: Date.now(), isDirty: false },
                },
              },
            };
          });

          const uid = getCurrentUserId();
          if (!uid) return;

          void createNodeBatch(uid, node, {
            [`nodeSummaries.${node.id}`]: { id: node.id, label: node.label, type: node.type },
            'metrics.nodeCount': increment(1),
            lastUpdated: new Date().toISOString(),
          });
        },

        updateNode: (nodeId: string, updates: Partial<NodeData>) => {
          const updatedAt = new Date().toISOString();

          set((state) => {
            const existing = state.nodes[nodeId];
            if (!existing) return state;

            const nextNode = { ...existing, ...updates, updatedAt };
            const nextStructure = ensureStructureDefaults(state.structure);

            return {
              nodes: { ...state.nodes, [nodeId]: nextNode },
              structure: {
                ...nextStructure,
                nodeSummaries: {
                  ...nextStructure.nodeSummaries,
                  [nodeId]: {
                    id: nodeId,
                    label: nextNode.label,
                    type: nextNode.type,
                  },
                },
              },
              metadata: {
                ...state.metadata,
                nodes: {
                  ...state.metadata.nodes,
                  [nodeId]: { lastFetched: Date.now(), isDirty: false },
                },
              },
            };
          });

          const uid = getCurrentUserId();
          if (!uid) return;

          void updateNodeBatch(uid, nodeId, { ...updates, updatedAt }, {
            [`nodeSummaries.${nodeId}`]: {
              id: nodeId,
              label: updates.label ?? get().nodes[nodeId]?.label ?? nodeId,
              type: updates.type ?? get().nodes[nodeId]?.type ?? 'none',
            },
            lastUpdated: new Date().toISOString(),
          });
        },

        removeNode: (nodeId: string) => {
          const { edges } = get();
          const relatedEdges = (Object.values(edges) as EdgeData[]).filter(
            (edge) => edge.source === nodeId || edge.target === nodeId
          );

          set((state) => {
            const nextNodes = { ...state.nodes };
            const nextEdges = { ...state.edges };
            const nextStructure = ensureStructureDefaults(state.structure);
            const nextAdjacency = { ...nextStructure.adjacencyList };
            const nextSummaries = { ...nextStructure.nodeSummaries };
            delete nextNodes[nodeId];
            delete nextAdjacency[nodeId];
            delete nextSummaries[nodeId];

            relatedEdges.forEach((edge) => {
              delete nextEdges[edge.id];
              if (nextAdjacency[edge.source]) {
                nextAdjacency[edge.source] = nextAdjacency[edge.source].filter(
                  (target) => target !== edge.target
                );
              }
            });

            return {
              nodes: ensureDefaultNode(nextNodes),
              edges: nextEdges,
              structure: {
                ...nextStructure,
                adjacencyList: nextAdjacency,
                nodeSummaries: nextSummaries,
                metrics: {
                  nodeCount: Math.max(0, nextStructure.metrics.nodeCount - 1),
                  edgeCount: Math.max(0, nextStructure.metrics.edgeCount - relatedEdges.length),
                },
              },
            };
          });

          const structureUpdates: Record<string, unknown> = {
            [`nodeSummaries.${nodeId}`]: deleteField(),
            [`adjacencyList.${nodeId}`]: deleteField(),
            'metrics.nodeCount': increment(-1),
            'metrics.edgeCount': increment(-relatedEdges.length),
            lastUpdated: new Date().toISOString(),
          };

          relatedEdges.forEach((edge) => {
            structureUpdates[`adjacencyList.${edge.source}`] = arrayRemove(edge.target);
          });

          const uid = getCurrentUserId();
          if (!uid) return;

          void deleteNodeBatch(uid, nodeId, structureUpdates);

          relatedEdges.forEach((edge) => {
            void deleteEdgeBatch(uid, edge.id);
          });
        },

        addEdge: (edge: EdgeData) => {
          set((state) => {
            const nextStructure = ensureStructureDefaults(state.structure);
            const nextAdjacency = { ...nextStructure.adjacencyList };
            const nextTargets = nextAdjacency[edge.source]
              ? [...nextAdjacency[edge.source]]
              : [];

            if (!nextTargets.includes(edge.target)) {
              nextTargets.push(edge.target);
            }

            nextAdjacency[edge.source] = nextTargets;

            return {
              edges: { ...state.edges, [edge.id]: edge },
              structure: {
                ...nextStructure,
                adjacencyList: nextAdjacency,
                metrics: {
                  nodeCount: nextStructure.metrics.nodeCount,
                  edgeCount: nextStructure.metrics.edgeCount + 1,
                },
              },
              metadata: {
                ...state.metadata,
                edges: {
                  ...state.metadata.edges,
                  [edge.id]: { lastFetched: Date.now(), isDirty: false },
                },
              },
            };
          });

          const uid = getCurrentUserId();
          if (!uid) return;

          void createEdgeBatch(uid, edge, {
            [`adjacencyList.${edge.source}`]: arrayUnion(edge.target),
            'metrics.edgeCount': increment(1),
            lastUpdated: new Date().toISOString(),
          });
        },

        updateEdge: (edgeId: string, updates: Partial<EdgeData>) => {
          const updatedAt = new Date().toISOString();

          set((state) => {
            const existing = state.edges[edgeId];
            if (!existing) return state;

            const nextEdge = { ...existing, ...updates, updatedAt };
            return {
              edges: { ...state.edges, [edgeId]: nextEdge },
              metadata: {
                ...state.metadata,
                edges: {
                  ...state.metadata.edges,
                  [edgeId]: { lastFetched: Date.now(), isDirty: false },
                },
              },
            };
          });

          const uid = getCurrentUserId();
          if (!uid) return;

          void updateEdgeBatch(uid, edgeId, { ...updates, updatedAt });
        },

        removeEdge: (edgeId: string) => {
          const edge = get().edges[edgeId];

          set((state) => {
            if (!state.edges[edgeId]) return state;
            const nextEdges = { ...state.edges };
            const nextStructure = ensureStructureDefaults(state.structure);
            const nextAdjacency = { ...nextStructure.adjacencyList };
            delete nextEdges[edgeId];
            if (edge && nextAdjacency[edge.source]) {
              nextAdjacency[edge.source] = nextAdjacency[edge.source].filter(
                (target) => target !== edge.target
              );
            }
            return {
              edges: nextEdges,
              structure: {
                ...nextStructure,
                adjacencyList: nextAdjacency,
                metrics: {
                  nodeCount: nextStructure.metrics.nodeCount,
                  edgeCount: Math.max(0, nextStructure.metrics.edgeCount - 1),
                },
              },
            };
          });

          if (!edge) return;

          const uid = getCurrentUserId();
          if (!uid) return;

          void deleteEdgeBatch(uid, edgeId, {
            [`adjacencyList.${edge.source}`]: arrayRemove(edge.target),
            'metrics.edgeCount': increment(-1),
            lastUpdated: new Date().toISOString(),
          });
        },

        invalidateStructure: () =>
          set((state) => ({
            metadata: {
              ...state.metadata,
              structure: {
                lastFetched: state.metadata.structure.lastFetched ?? 0,
                isDirty: true,
              },
            },
          })),

        fetchStructure: async (uid: string, force = false) => {
          const { metadata } = get();
          if (!force && !isCacheStale(metadata.structure)) return;

          const structure = await fetchStructureFromFirebase(uid);
          actions.setStructure(structure);
        },

        subscribeToStructure: (uid: string) => {
          return subscribeToStructure(uid, (structure) => {
            actions.setStructure(structure);
          });
        },

        fetchNodes: async (uid: string, ids: string[], force = false) => {
          const { metadata } = get();
          const targets = ids.filter((id) => force || isCacheStale(metadata.nodes[id]));
          if (targets.length === 0) return;

          const nodes = await fetchNodesByIds(uid, targets);
          actions.cacheNodes(nodes);
        },

        fetchEdges: async (uid: string, ids: string[], force = false) => {
          const { metadata } = get();
          const targets = ids.filter((id) => force || isCacheStale(metadata.edges[id]));
          if (targets.length === 0) return;

          const edges = await fetchEdgesByIds(uid, targets);
          actions.cacheEdges(edges);
        },
      };

      return {
        // Initial state
        nodes: { [DEFAULT_NODE_ID]: DEFAULT_NODE },
        edges: {},
        structure: buildEmptyStructure(),
        metadata: buildEmptyMetadata(),
        actions,
      };
    },
    {
      name: 'cdag-topology-store-v3',
      storage: indexedDBStorage,
      version: 3,
      // ✅ CRITICAL: Only persist data, never persist actions/functions to IndexedDB
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        structure: state.structure,
        metadata: state.metadata,
      }),
      merge: (persistedState: any, currentState: GraphStoreState) => ({
        ...currentState,
        ...persistedState,
        nodes: ensureDefaultNode(persistedState?.nodes ?? currentState.nodes),
        structure: ensureStructureDefaults(persistedState?.structure ?? currentState.structure),
        metadata: persistedState?.metadata ?? currentState.metadata,
        actions: currentState.actions,
      }),
      migrate: (state: any, version: number) => {
        if (version !== 3) {
          console.warn('[CDAG Store] Schema mismatch - clearing persisted data');
          return {
            nodes: { [DEFAULT_NODE_ID]: DEFAULT_NODE },
            edges: {},
            structure: buildEmptyStructure(),
            metadata: buildEmptyMetadata(),
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
 * Selector: Get topology structure doc
 */
export const useGraphStructure = () => useGraphStore((state) => state.structure);

/**
 * Selector: Get cache metadata
 */
export const useGraphMetadata = () => useGraphStore((state) => state.metadata);

/**
 * Selector: Get single node by ID
 * ✅ Fine-grained: Only re-renders if specific node changes
 * @param nodeId - The node ID to retrieve
 */
export const useGraphNode = (nodeId: string) =>
  useGraphStore((state) => state.nodes[nodeId]);

/**
 * Action Hook: All graph mutations with stable reference
 * ✅ Single stable object reference (never triggers re-render or infinite loops)
 * The actions object is created once at store initialization and never recreated.
 * 
 * Implementation: Returns the stable state.actions object via Zustand selector,
 * consistent with useJournalActions pattern.
 * 
 * Usage:
 * const { addNode, updateNode, addEdge } = useGraphActions();
 */
export const useGraphActions = () => useGraphStore((state) => state.actions);

