/**
 * Firebase CDAG topology service layer.
 * Implements read-aside access patterns for topology data.
 */

import {
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
import type { CdagNodeSummary, CdagStructure, EdgeData, NodeData } from '@/types';
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
const DEFAULT_NODE_SUMMARY: CdagNodeSummary = {
  id: DEFAULT_NODE_ID,
  label: 'Progression',
  type: 'characteristic',
};
const MANIFEST_COLLECTION = 'graph_metadata';
const MANIFEST_DOC_ID = 'topology_manifest';

type ManifestNodeSummary = {
  label?: string;
  type?: CdagStructure['nodeSummaries'][string]['type'];
};

type ManifestAdjacencyEntry = {
  target?: string;
  weight?: number;
  t?: string;
  w?: number;
};

interface CdagTopologyManifest {
  nodes?: Record<string, ManifestNodeSummary>;
  edges?: Record<string, ManifestAdjacencyEntry[]>;
  metrics?: { nodeCount: number; edgeCount: number };
  lastUpdated?: string;
  version?: number;
}

const getManifestRef = (uid: string) =>
  doc(db, 'users', uid, 'graphs', 'cdag_topology', MANIFEST_COLLECTION, MANIFEST_DOC_ID);

const buildEmptyStructure = (): CdagStructure => ({
  adjacencyList: { [DEFAULT_NODE_ID]: [] },
  nodeSummaries: { [DEFAULT_NODE_ID]: DEFAULT_NODE_SUMMARY },
  metrics: { nodeCount: 1, edgeCount: 0 },
  version: 1,
});

const normalizeAdjacencyTargets = (
  payload?: unknown
): CdagStructure['adjacencyList'][string] => {
  if (!payload || !Array.isArray(payload)) return [];

  const normalized = payload
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;

      const target = (entry as ManifestAdjacencyEntry).target ?? (entry as ManifestAdjacencyEntry).t;
      if (!target || typeof target !== 'string') return null;

      const weight = (entry as ManifestAdjacencyEntry).weight ?? (entry as ManifestAdjacencyEntry).w;
      if (typeof weight !== 'number') return null;

      const clampedWeight = Math.min(1, Math.max(0, weight));
      return { target, weight: clampedWeight };
    })
    .filter((entry): entry is { target: string; weight: number } => Boolean(entry));

  return normalized;
};

const normalizeManifestStructure = (payload?: Partial<CdagTopologyManifest>): CdagStructure => {
  if (!payload) return buildEmptyStructure();

  const nodeSummaries = Object.entries(payload.nodes ?? {}).reduce<CdagStructure['nodeSummaries']>(
    (acc, [nodeId, summary]) => {
      acc[nodeId] = {
        id: nodeId,
        label: summary.label ?? nodeId,
        type: summary.type ?? 'none',
      };
      return acc;
    },
    {}
  );

  const adjacencyList = Object.entries(payload.edges ?? {}).reduce<CdagStructure['adjacencyList']>(
    (acc, [source, targets]) => {
      acc[source] = normalizeAdjacencyTargets(targets);
      return acc;
    },
    {}
  );

  const mergedSummaries = {
    [DEFAULT_NODE_ID]: DEFAULT_NODE_SUMMARY,
    ...nodeSummaries,
  };

  const mergedAdjacency = {
    [DEFAULT_NODE_ID]: [],
    ...adjacencyList,
  };

  const computedEdgeCount = Object.values(mergedAdjacency).reduce(
    (sum, targets) => sum + targets.length,
    0
  );

  return {
    adjacencyList: mergedAdjacency,
    nodeSummaries: mergedSummaries,
    metrics: payload.metrics ?? {
      nodeCount: Object.keys(mergedSummaries).length,
      edgeCount: computedEdgeCount,
    },
    lastUpdated: payload.lastUpdated,
    version: payload.version ?? 1,
  };
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
  const manifestRef = getManifestRef(uid);

  return onSnapshot(
    manifestRef,
    (snapshot) => {
      const data = snapshot.data() as CdagTopologyManifest | undefined;
      onUpdate(data ? normalizeManifestStructure(data) : buildEmptyStructure());
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
  const manifestRef = getManifestRef(uid);
  const snapshot = await getDoc(manifestRef);

  if (!snapshot.exists()) {
    return buildEmptyStructure();
  }

  return normalizeManifestStructure(snapshot.data() as CdagTopologyManifest);
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
  manifestUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const nodeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes', node.id);
  const manifestRef = getManifestRef(uid);

  batch.set(nodeRef, serializeNodeDocument(node), { merge: true });
  batch.set(manifestRef, { version: 1 }, { merge: true });
  if (Object.keys(manifestUpdate).length > 0) {
    batch.update(manifestRef, manifestUpdate);
  }

  await batch.commit();
};

/**
 * Update a node and its structure summary in a single batch.
 */
export const updateNodeBatch = async (
  uid: string,
  nodeId: string,
  updates: Partial<NodeData>,
  manifestUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const nodeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes', nodeId);
  const manifestRef = getManifestRef(uid);

  batch.set(nodeRef, serializeNodeUpdate(nodeId, updates), { merge: true });
  batch.set(manifestRef, { version: 1 }, { merge: true });
  if (Object.keys(manifestUpdate).length > 0) {
    batch.update(manifestRef, manifestUpdate);
  }

  await batch.commit();
};

/**
 * Delete a node and update the structure document in a single batch.
 */
export const deleteNodeBatch = async (
  uid: string,
  nodeId: string,
  manifestUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const nodeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'nodes', nodeId);
  const manifestRef = getManifestRef(uid);

  batch.delete(nodeRef);
  batch.set(manifestRef, { version: 1 }, { merge: true });
  if (Object.keys(manifestUpdate).length > 0) {
    batch.update(manifestRef, manifestUpdate);
  }

  await batch.commit();
};

/**
 * Create an edge and update the structure document in a single batch.
 */
export const createEdgeBatch = async (
  uid: string,
  edge: EdgeData,
  manifestUpdate: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const edgeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'edges', edge.id);
  const manifestRef = getManifestRef(uid);

  batch.set(edgeRef, serializeEdgeDocument(edge), { merge: true });
  batch.set(manifestRef, { version: 1 }, { merge: true });
  if (Object.keys(manifestUpdate).length > 0) {
    batch.update(manifestRef, manifestUpdate);
  }

  await batch.commit();
};

/**
 * Update an edge document.
 */
export const updateEdgeBatch = async (
  uid: string,
  edgeId: string,
  updates: Partial<EdgeData>,
  manifestUpdate?: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const edgeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'edges', edgeId);
  const manifestRef = getManifestRef(uid);
  batch.set(edgeRef, serializeEdgeUpdate(edgeId, updates), { merge: true });

  if (manifestUpdate && Object.keys(manifestUpdate).length > 0) {
    batch.set(manifestRef, { version: 1 }, { merge: true });
    batch.update(manifestRef, manifestUpdate);
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
  manifestUpdate?: Record<string, unknown>
): Promise<void> => {
  const batch = writeBatch(db);
  const edgeRef = doc(db, 'users', uid, 'graphs', 'cdag_topology', 'edges', edgeId);
  const manifestRef = getManifestRef(uid);

  batch.delete(edgeRef);
  if (manifestUpdate && Object.keys(manifestUpdate).length > 0) {
    batch.set(manifestRef, { version: 1 }, { merge: true });
    batch.update(manifestRef, manifestUpdate);
  }

  await batch.commit();
};
