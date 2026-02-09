/**
 * Debug datastore sync utilities.
 * Builds backend snapshots and maps them to local RootState.
 */

import { getFirestoreCollection, getFirestoreDocument } from "@/lib/firebase/firestore-crud";
import { serializeRootState } from "@/stores/root";
import type { RootState } from "@/stores/root";
import type {
  JournalEntryData,
  JournalTreeStructure,
} from "@/stores/journal/types";
import type { CdagStructure, EdgeData, NodeData } from "@/stores/cdag-topology/types";
import type {
  AISettings,
  IntegrationSettings,
  ProfileDisplaySettings,
  PlayerStatisticsDoc,
  UserProfile,
} from "@/types/firestore";
import type { PlayerStatistics } from "@/stores/player-statistics";
import {
  ensureDefaultNode,
  ensureStructureDefaults,
  buildEmptyMetadata,
} from "@/stores/cdag-topology/store-helpers";
import {
  normalizeEdgeDocument,
  normalizeNodeDocument,
} from "@/lib/firebase/utils/graph-normalizers";

export interface BackendDatastoreSnapshot {
  userProfile: UserProfile | null;
  accountConfig: Record<string, Record<string, unknown>>;
  userInformation: Record<string, Record<string, unknown>>;
  journalTree: JournalTreeStructure | null;
  journalEntries: Record<string, JournalEntryData>;
  graphManifest: Record<string, unknown> | null;
  graphStructure: CdagStructure | null;
  graphNodes: Record<string, NodeData>;
  graphEdges: Record<string, EdgeData>;
}

const safeGetDocument = async (path: string) => {
  try {
    return await getFirestoreDocument(path);
  } catch (error) {
    console.warn(`[Datastore Sync] Failed to fetch document: ${path}`, error);
    return null;
  }
};

const safeGetCollection = async (path: string) => {
  try {
    return await getFirestoreCollection(path);
  } catch (error) {
    console.warn(`[Datastore Sync] Failed to fetch collection: ${path}`, error);
    return {};
  }
};

const normalizeManifestAdjacency = (payload?: unknown) => {
  if (!payload || !Array.isArray(payload)) return [];
  return payload
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const target = (entry as { target?: string; t?: string }).target ?? (entry as { t?: string }).t;
      if (!target) return null;
      const weight = (entry as { weight?: number; w?: number }).weight ?? (entry as { w?: number }).w;
      if (typeof weight !== 'number') return null;
      const clampedWeight = Math.min(1, Math.max(0, weight));
      return { target, weight: clampedWeight };
    })
    .filter((entry): entry is { target: string; weight: number } => Boolean(entry));
};

const normalizeManifestStructure = (manifest: Record<string, unknown> | null): CdagStructure | null => {
  if (!manifest) return null;

  const nodes = (manifest as { nodes?: Record<string, { label?: string; type?: NodeData['type'] }> }).nodes ?? {};
  const edges = (manifest as { edges?: Record<string, unknown> }).edges ?? {};

  const nodeSummaries = Object.fromEntries(
    Object.entries(nodes).map(([nodeId, summary]) => [
      nodeId,
      {
        id: nodeId,
        label: summary.label ?? nodeId,
        type: summary.type ?? 'none',
      },
    ])
  ) as CdagStructure['nodeSummaries'];

  const adjacencyList = Object.fromEntries(
    Object.entries(edges).map(([source, targets]) => [
      source,
      normalizeManifestAdjacency(targets),
    ])
  ) as CdagStructure['adjacencyList'];

  const metrics = (manifest as { metrics?: { nodeCount: number; edgeCount: number } }).metrics;
  const edgeCount = Object.values(adjacencyList).reduce((sum, targets) => sum + targets.length, 0);

  return ensureStructureDefaults({
    adjacencyList,
    nodeSummaries,
    metrics: metrics ?? {
      nodeCount: Object.keys(nodeSummaries).length,
      edgeCount,
    },
    lastUpdated: (manifest as { lastUpdated?: string }).lastUpdated,
    version: (manifest as { version?: number }).version ?? 1,
  });
};

/**
 * Fetches Firestore data for debug inspection and local hydration.
 */
export const fetchBackendDatastoreSnapshot = async (
  uid: string
): Promise<BackendDatastoreSnapshot> => {
  const [
    userProfile,
    accountConfig,
    userInformation,
    journalTree,
    journalEntries,
    graphManifest,
    graphNodes,
    graphEdges,
  ] = await Promise.all([
    safeGetDocument(`users/${uid}`),
    safeGetCollection(`users/${uid}/account_config`),
    safeGetCollection(`users/${uid}/user_information`),
    safeGetDocument(`users/${uid}/journal_meta/tree_structure`),
    safeGetCollection(`users/${uid}/journal_entries`),
    safeGetDocument(`users/${uid}/graphs/cdag_topology/graph_metadata/topology_manifest`),
    safeGetCollection(`users/${uid}/graphs/cdag_topology/nodes`),
    safeGetCollection(`users/${uid}/graphs/cdag_topology/edges`),
  ]);

  const normalizedJournalEntries = Object.fromEntries(
    Object.entries(journalEntries).map(([entryId, entry]) => [
      entryId,
      { id: entryId, ...entry },
    ])
  );

  const normalizedGraphNodes = Object.fromEntries(
    Object.entries(graphNodes).map(([nodeId, node]) => [
      nodeId,
      normalizeNodeDocument(nodeId, node as unknown as Partial<NodeData>),
    ])
  );

  const normalizedGraphEdges = Object.fromEntries(
    Object.entries(graphEdges).map(([edgeId, edge]) => [
      edgeId,
      normalizeEdgeDocument(edgeId, edge as unknown as Partial<EdgeData>),
    ])
  );

  const normalizedManifest = normalizeManifestStructure(
    (graphManifest ?? null) as Record<string, unknown> | null
  );

  return {
    userProfile: (userProfile ?? null) as unknown as UserProfile | null,
    accountConfig,
    userInformation,
    journalTree: (journalTree ?? null) as JournalTreeStructure | null,
    journalEntries: normalizedJournalEntries as Record<string, JournalEntryData>,
    graphManifest: (graphManifest ?? null) as Record<string, unknown> | null,
    graphStructure: normalizedManifest,
    graphNodes: normalizedGraphNodes as Record<string, NodeData>,
    graphEdges: normalizedGraphEdges as Record<string, EdgeData>,
  };
};

/**
 * Builds a RootState snapshot from backend data.
 * Missing backend data preserves the current local state.
 */
export const buildRootStateFromSnapshot = (
  snapshot: BackendDatastoreSnapshot,
  currentState: RootState = serializeRootState()
): RootState => {
  const aiSettings = snapshot.accountConfig[
    "ai_settings"
  ] as unknown as AISettings | undefined;
  const integrationSettings = snapshot.accountConfig[
    "integrations"
  ] as unknown as IntegrationSettings | undefined;
  const profileDisplay = snapshot.userInformation[
    "profile_display"
  ] as unknown as ProfileDisplaySettings | undefined;
  const playerStatisticsDoc = snapshot.userInformation[
    "player_statistics"
  ] as unknown as PlayerStatisticsDoc | undefined;

  const nextJournalEntries = snapshot.journalEntries ?? currentState.journal.entries;
  const nextJournalTree = snapshot.journalTree ?? currentState.journal.tree;
  const nextGraphStructure = ensureStructureDefaults(
    snapshot.graphStructure ?? currentState.cdagTopology.structure
  );
  const nextGraphNodes = ensureDefaultNode(
    snapshot.graphNodes ?? currentState.cdagTopology.nodes
  );
  const nextGraphEdges = snapshot.graphEdges ?? currentState.cdagTopology.edges;

  return {
    ...currentState,
    journal: {
      entries: nextJournalEntries,
      tree: nextJournalTree,
      metadata: {},
    },
    cdagTopology: {
      nodes: nextGraphNodes,
      edges: nextGraphEdges,
      structure: nextGraphStructure,
      metadata: buildEmptyMetadata(),
    },
    userInformation: {
      ...currentState.userInformation,
      name: snapshot.userProfile?.displayName ?? currentState.userInformation.name,
      userClass: profileDisplay?.class ?? currentState.userInformation.userClass,
    },
    aiConfig: aiSettings ? { ...currentState.aiConfig, ...aiSettings } : currentState.aiConfig,
    integrations: integrationSettings ? { ...currentState.integrations, ...integrationSettings } : currentState.integrations,
    playerStatistics: (playerStatisticsDoc?.stats ?? currentState.playerStatistics) as PlayerStatistics,
  };
};
