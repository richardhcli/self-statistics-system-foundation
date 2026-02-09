/**
 * Firebase CDAG topology service layer.
 * Implements read-aside access patterns for topology data.
 */

import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  writeBatch,
  where,
} from 'firebase/firestore';
import type { CdagStructure, EdgeData, NodeData } from '@/types';
import { db } from './services';
import {
  normalizeEdgeDocument,
  normalizeNodeDocument,
  serializeEdgeDocument,
  serializeEdgeUpdate,
  serializeNodeDocument,
  serializeNodeUpdate,
} from './utils/graph-normalizers';

const DEFAULT_NODE_ID = 'progression';
const DEFAULT_NODE_SUMMARY = {
  id: DEFAULT_NODE_ID,
  label: 'Progression',
  type: 'characteristic',
};

const buildEmptyStructure = (): CdagStructure => ({
  adjacencyList: { [DEFAULT_NODE_ID]: [] },
  nodeSummaries: { [DEFAULT_NODE_ID]: DEFAULT_NODE_SUMMARY },
  metrics: { nodeCount: 1, edgeCount: 0 },
  version: 1,
});

const normalizeStructure = (payload?: Partial<CdagStructure>): CdagStructure => ({
  adjacencyList: payload?.adjacencyList ?? {},
  nodeSummaries: payload?.nodeSummaries ?? {},
  metrics: payload?.metrics ?? { nodeCount: 0, edgeCount: 0 },
  lastUpdated: payload?.lastUpdated,
  version: payload?.version ?? 1,
});

const normalizeAdjacencyTargets = (payload?: unknown): string[] => {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : [];
};

const fetchAdjacencyList = async (uid: string): Promise<Record<string, string[]>> => {
  const adjacencyRef = collection(db, 'users', uid, 'graphs', 'cdag_topology', 'adjacency_list');
  const snapshot = await getDocs(adjacencyRef);

  if (snapshot.empty) {
    return { [DEFAULT_NODE_ID]: [] };
  }

  return snapshot.docs.reduce<Record<string, string[]>>((acc, docSnap) => {
    const data = docSnap.data() as { targets?: unknown };
    acc[docSnap.id] = normalizeAdjacencyTargets(data.targets);
    return acc;
  }, {});
};

const fetchNodeSummaries = async (
  uid: string
): Promise<CdagStructure['nodeSummaries']> => {
  const summariesRef = collection(db, 'users', uid, 'graphs', 'cdag_topology', 'node_summaries');
  const snapshot = await getDocs(summariesRef);

  if (snapshot.empty) {
    return { [DEFAULT_NODE_ID]: DEFAULT_NODE_SUMMARY };
  }

  return snapshot.docs.reduce<CdagStructure['nodeSummaries']>((acc, docSnap) => {
    const data = docSnap.data() as { label?: string; type?: CdagStructure['nodeSummaries'][string]['type'] };
    acc[docSnap.id] = {
      id: docSnap.id,
      label: data.label ?? docSnap.id,
      type: data.type ?? 'none',
    };
    return acc;
  }, {});
};

const chunkIds = (ids: string[], size: number) => {
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += size) {
    chunks.push(ids.slice(i, i + size));
  }
  return chunks;
};

/**
 * Subscribe to the topology structure document.
 */
export const subscribeToStructure = (
  uid: string,
  onUpdate: (structure: CdagStructure) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const structureRef = doc(db, 'users', uid, 'graphs', 'cdag_topology');

  return onSnapshot(
    structureRef,
    (snapshot) => {
      const data = snapshot.data();
      const baseStructure = data ? normalizeStructure(data as CdagStructure) : buildEmptyStructure();

      void Promise.all([fetchAdjacencyList(uid), fetchNodeSummaries(uid)])
        .then(([adjacencyList, nodeSummaries]) => {
          onUpdate({
            ...baseStructure,
            adjacencyList,
            nodeSummaries,
          });
        })
        .catch((error) => {
          if (onError) {
            onError(error as Error);
          }
        });
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

/**
 * Fetch the topology structure document.
 */
export const fetchStructure = async (uid: string): Promise<CdagStructure> => {
  const structureRef = doc(db, 'users', uid, 'graphs', 'cdag_topology');
  const snapshot = await getDoc(structureRef);
  const baseStructure = snapshot.exists()
    ? normalizeStructure(snapshot.data() as CdagStructure)
    : buildEmptyStructure();
  const [adjacencyList, nodeSummaries] = await Promise.all([
    fetchAdjacencyList(uid),
    fetchNodeSummaries(uid),
  ]);

  return {
    ...baseStructure,
    adjacencyList,
    nodeSummaries,
  };
};

/**
 * Fetch node documents by id in chunks.
 */
export const fetchNodesByIds = async (uid: string, ids: string[]): Promise<NodeData[]> => {
  if (ids.length === 0) return [];

  const nodesRef = collection(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes');
  const chunks = chunkIds(ids, 10);
  const results: NodeData[] = [];

  for (const chunk of chunks) {
    const snapshot = await getDocs(
      query(nodesRef, where(documentId(), 'in', chunk))
    );
    snapshot.docs.forEach((docSnap) => {
      results.push(normalizeNodeDocument(docSnap.id, docSnap.data() as NodeData));
    });
  }

  return results;
};

/**
 * Fetch all node documents.
 */
export const fetchAllNodes = async (uid: string): Promise<NodeData[]> => {
  const nodesRef = collection(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes');
  const snapshot = await getDocs(nodesRef);
  return snapshot.docs.map((docSnap) =>
    normalizeNodeDocument(docSnap.id, docSnap.data() as NodeData)
  );
};

/**
 * Fetch edge documents by id in chunks.
 */
export const fetchEdgesByIds = async (uid: string, ids: string[]): Promise<EdgeData[]> => {
  if (ids.length === 0) return [];

  const edgesRef = collection(db, 'users', uid, 'graphs', 'cdag_topology', 'edges');
  const chunks = chunkIds(ids, 10);
  const results: EdgeData[] = [];

  for (const chunk of chunks) {
    const snapshot = await getDocs(
      query(edgesRef, where(documentId(), 'in', chunk))
    );
    snapshot.docs.forEach((docSnap) => {
      results.push(normalizeEdgeDocument(docSnap.id, docSnap.data() as EdgeData));
    });
  }

  return results;
};

/**
 * Fetch all edge documents.
 */
export const fetchAllEdges = async (uid: string): Promise<EdgeData[]> => {
  const edgesRef = collection(db, 'users', uid, 'graphs', 'cdag_topology', 'edges');
  const snapshot = await getDocs(edgesRef);
  return snapshot.docs.map((docSnap) =>
    normalizeEdgeDocument(docSnap.id, docSnap.data() as EdgeData)
  );
};

/**
 * Create a node and update the structure document in a single batch.
 */
export const createNodeBatch = async (
  uid: string,
  node: NodeData,
  structureUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const nodeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes', node.id);
  const summaryRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'node_summaries', node.id);
  const structureRef = doc(db, 'users', uid, 'graphs', 'cdag_topology');

  batch.set(nodeRef, serializeNodeDocument(node), { merge: true });
  batch.set(summaryRef, { label: node.label, type: node.type }, { merge: true });
  batch.set(structureRef, structureUpdate, { merge: true });

  await batch.commit();
};

/**
 * Update a node and its structure summary in a single batch.
 */
export const updateNodeBatch = async (
  uid: string,
  nodeId: string,
  updates: Partial<NodeData>,
  structureUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const nodeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes', nodeId);
  const summaryRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'node_summaries', nodeId);
  const structureRef = doc(db, 'users', uid, 'graphs', 'cdag_topology');

  batch.set(nodeRef, serializeNodeUpdate(nodeId, updates), { merge: true });
  batch.set(
    summaryRef,
    {
      ...(updates.label !== undefined ? { label: updates.label } : {}),
      ...(updates.type !== undefined ? { type: updates.type } : {}),
    },
    { merge: true }
  );
  batch.set(structureRef, structureUpdate, { merge: true });

  await batch.commit();
};

/**
 * Delete a node and update the structure document in a single batch.
 */
export const deleteNodeBatch = async (
  uid: string,
  nodeId: string,
  structureUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const nodeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes', nodeId);
  const summaryRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'node_summaries', nodeId);
  const adjacencyRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'adjacency_list', nodeId);
  const structureRef = doc(db, 'users', uid, 'graphs', 'cdag_topology');

  batch.delete(nodeRef);
  batch.delete(summaryRef);
  batch.delete(adjacencyRef);
  batch.set(structureRef, structureUpdate, { merge: true });

  await batch.commit();
};

/**
 * Create an edge and update the structure document in a single batch.
 */
export const createEdgeBatch = async (
  uid: string,
  edge: EdgeData,
  structureUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const edgeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'edges', edge.id);
  const adjacencyRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'adjacency_list', edge.source);
  const structureRef = doc(db, 'users', uid, 'graphs', 'cdag_topology');

  batch.set(edgeRef, serializeEdgeDocument(edge), { merge: true });
  batch.set(
    adjacencyRef,
    { targets: arrayUnion(edge.target) },
    { merge: true }
  );
  batch.set(structureRef, structureUpdate, { merge: true });

  await batch.commit();
};

/**
 * Update an edge document.
 */
export const updateEdgeBatch = async (
  uid: string,
  edgeId: string,
  updates: Partial<EdgeData>
): Promise<void> => {
  const batch = writeBatch(db);
  const edgeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'edges', edgeId);
  batch.set(edgeRef, serializeEdgeUpdate(edgeId, updates), { merge: true });

  if (updates.source || updates.target) {
    const [prevSource, prevTarget] = edgeId.split('->');
    const nextSource = updates.source ?? prevSource;
    const nextTarget = updates.target ?? prevTarget;

    if (prevSource !== nextSource || prevTarget !== nextTarget) {
      const prevAdjacencyRef = doc(
        db,
        'users',
        uid,
        'graphs',
        'cdag_topology',
        'adjacency_list',
        prevSource
      );
      const nextAdjacencyRef = doc(
        db,
        'users',
        uid,
        'graphs',
        'cdag_topology',
        'adjacency_list',
        nextSource
      );

      batch.set(
        prevAdjacencyRef,
        { targets: arrayRemove(prevTarget) },
        { merge: true }
      );
      batch.set(
        nextAdjacencyRef,
        { targets: arrayUnion(nextTarget) },
        { merge: true }
      );
    }
  }

  await batch.commit();
};

/**
 * Delete an edge and update the structure document in a single batch.
 */
export const deleteEdgeBatch = async (
  uid: string,
  edgeId: string,
  source: string,
  target: string,
  structureUpdate?: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const edgeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'edges', edgeId);
  const adjacencyRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'adjacency_list', source);
  const structureRef = doc(db, 'users', uid, 'graphs', 'cdag_topology');

  batch.delete(edgeRef);
  batch.set(
    adjacencyRef,
    { targets: arrayRemove(target) },
    { merge: true }
  );

  if (structureUpdate) {
    batch.set(structureRef, structureUpdate, { merge: true });
  }

  await batch.commit();
};
