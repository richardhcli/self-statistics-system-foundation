import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { deleteField, increment } from 'firebase/firestore';
import {
  createEdgeBatch,
  createNodeBatch,
  deleteEdgeBatch,
  deleteNodeBatch,
  fetchAllEdges,
  fetchAllNodes,
  fetchEdgesByIds,
  fetchNodesByIds,
  fetchStructure as fetchStructureFromFirebase,
  subscribeToStructure,
  updateEdgeBatch,
  updateNodeBatch,
} from '@/lib/firebase/graph-service';
import { auth } from '@/lib/firebase/services';
import { indexedDBStorage } from '@/stores/root/persist-middleware';
import type {
  CdagMetadata,
  CdagStoreSnapshot,
  CdagStructure,
  EdgeData,
  NodeData,
} from './types';
import { buildEdgeId } from '@/lib/firebase/utils/graph-normalizers';
import {
  DEFAULT_NODE,
  DEFAULT_NODE_ID,
  buildEmptyMetadata,
  buildEmptyStructure,
  ensureDefaultNode,
  ensureStructureDefaults,
  isCacheStale,
} from './store-helpers';

const getCurrentUserId = () => auth.currentUser?.uid ?? null;

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
    fetchAllNodes: (uid: string) => Promise<number>;
    fetchAllEdges: (uid: string) => Promise<number>;
    setFullFetchTimestamp: (timestamp: number) => void;
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
            metadata: {
              ...buildEmptyMetadata(),
              ...(snapshot.metadata ?? {}),
            },
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
              fullFetchAt: state.metadata.fullFetchAt ?? 0,
            };

            Object.values(nextStructure.nodeSummaries).forEach((summary) => {
              if (!nextNodes[summary.id]) {
                nextNodes[summary.id] = {
                  id: summary.id,
                  label: summary.label,
                  type: summary.type,
                };
              } else {
                nextNodes[summary.id] = {
                  ...nextNodes[summary.id],
                  label: summary.label,
                  type: summary.type,
                };
              }

              if (!nextMetadata.nodes[summary.id]) {
                nextMetadata.nodes[summary.id] = { lastFetched: 0, isDirty: false };
              }
            });

            Object.entries(nextStructure.adjacencyList).forEach(([source, targets]) => {
              targets.forEach((entry) => {
                if (!entry?.target) return;
                const edgeId = buildEdgeId(source, entry.target);
                if (!nextEdges[edgeId]) {
                  nextEdges[edgeId] = {
                    id: edgeId,
                    source,
                    target: entry.target,
                    weight: entry.weight ?? 1.0,
                  };
                } else if (entry.weight !== undefined && nextEdges[edgeId].weight !== entry.weight) {
                  nextEdges[edgeId] = {
                    ...nextEdges[edgeId],
                    weight: entry.weight,
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

        setFullFetchTimestamp: (timestamp: number) =>
          set((state) => ({
            metadata: {
              ...state.metadata,
              fullFetchAt: timestamp,
            },
          })),

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
            const nextAdjacency = { ...nextStructure.adjacencyList };
            if (!nextAdjacency[node.id]) {
              nextAdjacency[node.id] = [];
            }

            return {
              nodes: ensureDefaultNode(nextNodes),
              structure: {
                ...nextStructure,
                nodeSummaries: {
                  ...nextStructure.nodeSummaries,
                  [node.id]: { id: node.id, label: node.label, type: node.type },
                },
                adjacencyList: nextAdjacency,
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
            'metrics.nodeCount': increment(1),
            lastUpdated: new Date().toISOString(),
            [`nodes.${node.id}`]: { label: node.label, type: node.type },
            [`edges.${node.id}`]: [],
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

          const manifestUpdate: Record<string, unknown> = {
            lastUpdated: new Date().toISOString(),
          };

          if (updates.label !== undefined || updates.type !== undefined) {
            const nextNode = get().nodes[nodeId];
            if (nextNode) {
              manifestUpdate[`nodes.${nodeId}`] = {
                label: nextNode.label,
                type: nextNode.type,
              };
            }
          }

          void updateNodeBatch(uid, nodeId, { ...updates, updatedAt }, manifestUpdate);
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
                  (entry) => entry.target !== edge.target
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

          const manifestUpdates: Record<string, unknown> = {
            'metrics.nodeCount': increment(-1),
            'metrics.edgeCount': increment(-relatedEdges.length),
            lastUpdated: new Date().toISOString(),
            [`nodes.${nodeId}`]: deleteField(),
            [`edges.${nodeId}`]: deleteField(),
          };

          relatedEdges.forEach((edge) => {
            manifestUpdates[`edges.${edge.source}`] =
              get().structure.adjacencyList[edge.source] ?? [];
          });

          const uid = getCurrentUserId();
          if (!uid) return;

          void deleteNodeBatch(uid, nodeId, manifestUpdates);

          relatedEdges.forEach((edge) => {
            void deleteEdgeBatch(uid, edge.id, edge.source, edge.target);
          });
        },

        addEdge: (edge: EdgeData) => {
          set((state) => {
            const nextStructure = ensureStructureDefaults(state.structure);
            const nextAdjacency = { ...nextStructure.adjacencyList };
            const nextTargets = nextAdjacency[edge.source]
              ? [...nextAdjacency[edge.source]]
              : [];
            const existingIndex = nextTargets.findIndex(
              (entry) => entry.target === edge.target
            );
            const nextWeight = edge.weight ?? 1.0;

            if (existingIndex >= 0) {
              nextTargets[existingIndex] = {
                ...nextTargets[existingIndex],
                target: edge.target,
                weight: nextWeight,
              };
            } else {
              nextTargets.push({ target: edge.target, weight: nextWeight });
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
            'metrics.edgeCount': increment(1),
            lastUpdated: new Date().toISOString(),
            [`edges.${edge.source}`]: get().structure.adjacencyList[edge.source] ?? [],
          });
        },

        updateEdge: (edgeId: string, updates: Partial<EdgeData>) => {
          const updatedAt = new Date().toISOString();

          const existing = get().edges[edgeId];
          if (!existing) return;

          const nextEdge = { ...existing, ...updates, updatedAt };
          const nextStructure = ensureStructureDefaults(get().structure);
          const nextAdjacency = { ...nextStructure.adjacencyList };
          const manifestUpdate: Record<string, unknown> = {
            lastUpdated: new Date().toISOString(),
          };
          let adjacencyChanged = false;

          if (updates.source || updates.target) {
            const prevSource = existing.source;
            const prevTarget = existing.target;
            const nextSource = updates.source ?? prevSource;
            const nextTarget = updates.target ?? prevTarget;

            if (nextAdjacency[prevSource]) {
              nextAdjacency[prevSource] = nextAdjacency[prevSource].filter(
                (entry) => entry.target !== prevTarget
              );
              manifestUpdate[`edges.${prevSource}`] = nextAdjacency[prevSource];
              adjacencyChanged = true;
            }

            const nextTargets = nextAdjacency[nextSource]
              ? [...nextAdjacency[nextSource]]
              : [];
            const nextWeight = updates.weight ?? existing.weight ?? 1.0;
            const existingIndex = nextTargets.findIndex(
              (entry) => entry.target === nextTarget
            );

            if (existingIndex >= 0) {
              nextTargets[existingIndex] = {
                ...nextTargets[existingIndex],
                target: nextTarget,
                weight: nextWeight,
              };
            } else {
              nextTargets.push({ target: nextTarget, weight: nextWeight });
            }

            nextAdjacency[nextSource] = nextTargets;
            manifestUpdate[`edges.${nextSource}`] = nextTargets;
            adjacencyChanged = true;
          } else if (updates.weight !== undefined) {
            const source = existing.source;
            const targets = nextAdjacency[source] ? [...nextAdjacency[source]] : [];
            const entryIndex = targets.findIndex(
              (entry) => entry.target === existing.target
            );

            if (entryIndex >= 0) {
              targets[entryIndex] = {
                ...targets[entryIndex],
                target: existing.target,
                weight: updates.weight,
              };
            } else {
              targets.push({ target: existing.target, weight: updates.weight });
            }

            nextAdjacency[source] = targets;
            manifestUpdate[`edges.${source}`] = targets;
            adjacencyChanged = true;
          }

          set((state) => ({
            edges: { ...state.edges, [edgeId]: nextEdge },
            structure: adjacencyChanged
              ? { ...nextStructure, adjacencyList: nextAdjacency }
              : state.structure,
            metadata: {
              ...state.metadata,
              edges: {
                ...state.metadata.edges,
                [edgeId]: { lastFetched: Date.now(), isDirty: false },
              },
            },
          }));

          const uid = getCurrentUserId();
          if (!uid) return;

          void updateEdgeBatch(
            uid,
            edgeId,
            { ...updates, updatedAt },
            adjacencyChanged ? manifestUpdate : undefined
          );
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
                (entry) => entry.target !== edge.target
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

          void deleteEdgeBatch(uid, edgeId, edge.source, edge.target, {
            'metrics.edgeCount': increment(-1),
            lastUpdated: new Date().toISOString(),
            [`edges.${edge.source}`]: get().structure.adjacencyList[edge.source] ?? [],
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
        fetchAllNodes: async (uid: string) => {
          const nodes = await fetchAllNodes(uid);
          actions.cacheNodes(nodes);
          return nodes.length;
        },
        fetchAllEdges: async (uid: string) => {
          const edges = await fetchAllEdges(uid);
          actions.cacheEdges(edges);
          return edges.length;
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
      name: 'cdag-topology-store-v4',
      storage: indexedDBStorage,
      version: 4,
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
        if (version !== 4) {
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

