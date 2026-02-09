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
  graphStructure: CdagStructure | null;
  graphNodes: Record<string, NodeData>;
  graphEdges: Record<string, EdgeData>;
  graphAdjacencyList: Record<string, string[]>;
  graphNodeSummaries: CdagStructure['nodeSummaries'];
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
    graphStructure,
    graphNodes,
    graphEdges,
    graphAdjacencyList,
    graphNodeSummaries,
  ] = await Promise.all([
    safeGetDocument(`users/${uid}`),
    safeGetCollection(`users/${uid}/account_config`),
    safeGetCollection(`users/${uid}/user_information`),
    safeGetDocument(`users/${uid}/journal_meta/tree_structure`),
    safeGetCollection(`users/${uid}/journal_entries`),
    safeGetDocument(`users/${uid}/graphs/cdag_topology`),
    safeGetCollection(`users/${uid}/graphs/cdag_topology/nodes`),
    safeGetCollection(`users/${uid}/graphs/cdag_topology/edges`),
    safeGetCollection(`users/${uid}/graphs/cdag_topology/adjacency_list`),
    safeGetCollection(`users/${uid}/graphs/cdag_topology/node_summaries`),
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
      normalizeNodeDocument(nodeId, node as NodeData),
    ])
  );

  const normalizedGraphEdges = Object.fromEntries(
    Object.entries(graphEdges).map(([edgeId, edge]) => [
      edgeId,
      normalizeEdgeDocument(edgeId, edge as EdgeData),
    ])
  );

  const normalizedAdjacencyList = Object.fromEntries(
    Object.entries(graphAdjacencyList).map(([source, entry]) => [
      source,
      Array.isArray((entry as { targets?: unknown }).targets)
        ? ((entry as { targets: string[] }).targets ?? [])
        : [],
    ])
  );

  const normalizedNodeSummaries = Object.fromEntries(
    Object.entries(graphNodeSummaries).map(([nodeId, summary]) => [
      nodeId,
      {
        id: nodeId,
        label: (summary as { label?: string }).label ?? nodeId,
        type: (summary as { type?: NodeData['type'] }).type ?? 'none',
      },
    ])
  );

  return {
    userProfile: (userProfile ?? null) as unknown as UserProfile | null,
    accountConfig,
    userInformation,
    journalTree: (journalTree ?? null) as JournalTreeStructure | null,
    journalEntries: normalizedJournalEntries as Record<string, JournalEntryData>,
    graphStructure: (graphStructure ?? null) as CdagStructure | null,
    graphNodes: normalizedGraphNodes as Record<string, NodeData>,
    graphEdges: normalizedGraphEdges as Record<string, EdgeData>,
    graphAdjacencyList: normalizedAdjacencyList as Record<string, string[]>,
    graphNodeSummaries: normalizedNodeSummaries as CdagStructure['nodeSummaries'],
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
    {
      ...(snapshot.graphStructure ?? currentState.cdagTopology.structure),
      adjacencyList: snapshot.graphAdjacencyList ?? currentState.cdagTopology.structure.adjacencyList,
      nodeSummaries: snapshot.graphNodeSummaries ?? currentState.cdagTopology.structure.nodeSummaries,
    }
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
