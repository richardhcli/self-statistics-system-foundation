/**
 * Firebase CDAG topology service layer.
 * Implements read-aside access patterns for topology data.
 */

import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import type { CdagStructure, EdgeData, NodeData } from '@/types';
import { db } from './services';

const buildEmptyStructure = (): CdagStructure => ({
  adjacencyList: {},
  nodeSummaries: {},
  metrics: { nodeCount: 0, edgeCount: 0 },
  version: 1,
});

const normalizeStructure = (payload?: Partial<CdagStructure>): CdagStructure => ({
  adjacencyList: payload?.adjacencyList ?? {},
  nodeSummaries: payload?.nodeSummaries ?? {},
  metrics: payload?.metrics ?? { nodeCount: 0, edgeCount: 0 },
  lastUpdated: payload?.lastUpdated,
  version: payload?.version ?? 1,
});

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
  const structureRef = doc(db, 'users', uid, 'cdag_topology', 'meta', 'structure');

  return onSnapshot(
    structureRef,
    (snapshot) => {
      const data = snapshot.data();
      onUpdate(data ? normalizeStructure(data as CdagStructure) : buildEmptyStructure());
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
  const structureRef = doc(db, 'users', uid, 'cdag_topology', 'meta', 'structure');
  const snapshot = await getDoc(structureRef);
  if (!snapshot.exists()) {
    return buildEmptyStructure();
  }
  return normalizeStructure(snapshot.data() as CdagStructure);
};

/**
 * Fetch node documents by id in chunks.
 */
export const fetchNodesByIds = async (uid: string, ids: string[]): Promise<NodeData[]> => {
  if (ids.length === 0) return [];

  const nodesRef = collection(db, 'users', uid, 'cdag_topology', 'nodes');
  const chunks = chunkIds(ids, 10);
  const results: NodeData[] = [];

  for (const chunk of chunks) {
    const snapshot = await getDocs(
      query(nodesRef, where(documentId(), 'in', chunk))
    );
    snapshot.docs.forEach((docSnap) => {
      results.push(docSnap.data() as NodeData);
    });
  }

  return results;
};

/**
 * Fetch edge documents by id in chunks.
 */
export const fetchEdgesByIds = async (uid: string, ids: string[]): Promise<EdgeData[]> => {
  if (ids.length === 0) return [];

  const edgesRef = collection(db, 'users', uid, 'cdag_topology', 'edges');
  const chunks = chunkIds(ids, 10);
  const results: EdgeData[] = [];

  for (const chunk of chunks) {
    const snapshot = await getDocs(
      query(edgesRef, where(documentId(), 'in', chunk))
    );
    snapshot.docs.forEach((docSnap) => {
      results.push(docSnap.data() as EdgeData);
    });
  }

  return results;
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
  const nodeRef = doc(db, 'users', uid, 'cdag_topology', 'nodes', node.id);
  const structureRef = doc(db, 'users', uid, 'cdag_topology', 'meta', 'structure');

  batch.set(nodeRef, node, { merge: true });
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
  const nodeRef = doc(db, 'users', uid, 'cdag_topology', 'nodes', nodeId);
  const structureRef = doc(db, 'users', uid, 'cdag_topology', 'meta', 'structure');

  batch.set(nodeRef, updates, { merge: true });
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
  const nodeRef = doc(db, 'users', uid, 'cdag_topology', 'nodes', nodeId);
  const structureRef = doc(db, 'users', uid, 'cdag_topology', 'meta', 'structure');

  batch.delete(nodeRef);
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
  const edgeRef = doc(db, 'users', uid, 'cdag_topology', 'edges', edge.id);
  const structureRef = doc(db, 'users', uid, 'cdag_topology', 'meta', 'structure');

  batch.set(edgeRef, edge, { merge: true });
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
  const edgeRef = doc(db, 'users', uid, 'cdag_topology', 'edges', edgeId);
  await setDoc(edgeRef, updates, { merge: true });
};

/**
 * Delete an edge and update the structure document in a single batch.
 */
export const deleteEdgeBatch = async (
  uid: string,
  edgeId: string,
  structureUpdate?: Record<string, unknown>
): Promise<void> => {
  if (!structureUpdate) {
    const edgeRef = doc(db, 'users', uid, 'cdag_topology', 'edges', edgeId);
    await deleteDoc(edgeRef);
    return;
  }

  const batch = writeBatch(db);
  const edgeRef = doc(db, 'users', uid, 'cdag_topology', 'edges', edgeId);
  const structureRef = doc(db, 'users', uid, 'cdag_topology', 'meta', 'structure');

  batch.delete(edgeRef);
  batch.set(structureRef, structureUpdate, { merge: true });

  await batch.commit();
};
