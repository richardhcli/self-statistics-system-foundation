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
import type {
  AISettings,
  IntegrationSettings,
  ProfileDisplaySettings,
  PlayerStatisticsDoc,
  UserProfile,
} from "@/types/firestore";
import type { PlayerStatistics } from "@/stores/player-statistics";

export interface BackendDatastoreSnapshot {
  userProfile: UserProfile | null;
  accountConfig: Record<string, Record<string, unknown>>;
  userInformation: Record<string, Record<string, unknown>>;
  journalTree: JournalTreeStructure | null;
  journalEntries: Record<string, JournalEntryData>;
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
  const [userProfile, accountConfig, userInformation, journalTree, journalEntries] =
    await Promise.all([
      safeGetDocument(`users/${uid}`),
      safeGetCollection(`users/${uid}/account_config`),
      safeGetCollection(`users/${uid}/user_information`),
      safeGetDocument(`users/${uid}/journal_meta/tree_structure`),
      safeGetCollection(`users/${uid}/journal_entries`),
    ]);

  const normalizedJournalEntries = Object.fromEntries(
    Object.entries(journalEntries).map(([entryId, entry]) => [
      entryId,
      { id: entryId, ...entry },
    ])
  );

  return {
    userProfile: (userProfile ?? null) as unknown as UserProfile | null,
    accountConfig,
    userInformation,
    journalTree: (journalTree ?? null) as JournalTreeStructure | null,
    journalEntries: normalizedJournalEntries as Record<string, JournalEntryData>,
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

  return {
    ...currentState,
    journal: {
      entries: nextJournalEntries,
      tree: nextJournalTree,
      metadata: {},
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
