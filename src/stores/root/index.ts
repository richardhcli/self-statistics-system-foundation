import { getJournalEntries, setJournalEntries } from '@/stores/journal';
import { getGraphSnapshot, setGraphSnapshot, type CdagStoreSnapshot } from '@/stores/cdag-topology';
import {
  getPlayerStatistics,
  setPlayerStatistics,
} from '@/stores/player-statistics';
import {
  getUserInformation,
  setUserInformation,
} from '@/stores/user-information';
import { getAiConfig, setAiConfig } from '@/stores/ai-config';
import {
  getUserIntegrations,
  setUserIntegrations,
} from '@/stores/user-integrations';
import { JournalPersistedState } from '@/stores/journal';
import { PlayerStatistics } from '@/stores/player-statistics';
import { UserInformation } from '@/stores/user-information';
import { AIConfig } from '@/stores/ai-config';
import { IntegrationStore } from '@/features/integration/types';

/**
 * Root Application State
 * Aggregates all independent stores for serialization/deserialization.
 * 
 * ⚠️ WARNING: This should ONLY be used for:
 * - Persistence (saving/loading to IndexedDB)
 * - Import/Export operations
 * - Initial hydration from backend
 * 
 * NEVER access this during runtime operations. Use individual store hooks instead.
 */
export interface RootState {
  journal: JournalPersistedState;
  cdagTopology: CdagStoreSnapshot;
  playerStatistics: PlayerStatistics;
  userInformation: UserInformation;
  aiConfig: AIConfig;
  integrations: IntegrationStore;
}

/**
 * Serialize: Aggregate all stores into a single RootState object.
 * Used for persistence, export, and sync operations.
 */
export const serializeRootState = (): RootState => {
  return {
    journal: getJournalEntries(),
    cdagTopology: getGraphSnapshot(),
    playerStatistics: getPlayerStatistics(),
    userInformation: getUserInformation(),
    aiConfig: getAiConfig(),
    integrations: getUserIntegrations(),
  };
};

/**
 * Deserialize: Load a RootState object into all individual stores.
 * Used for hydration, import, and sync operations.
 */
export const deserializeRootState = (state: RootState): void => {
  setJournalEntries(state.journal);
  setGraphSnapshot(state.cdagTopology);
  setPlayerStatistics(state.playerStatistics);
  setUserInformation(state.userInformation);
  setAiConfig(state.aiConfig);
  setUserIntegrations(state.integrations);
};

/**
 * Initial Root State
 * Used for first-time app initialization.
 */
export const INITIAL_ROOT_STATE: RootState = {
  journal: {
    entries: {},
    tree: {},
    metadata: {},
  },
  cdagTopology: {
    nodes: {
      progression: {
        id: 'progression',
        label: 'Progression',
        type: 'characteristic',
      },
    },
    edges: {},
    structure: {
      adjacencyList: {},
      nodeSummaries: {
        progression: {
          id: 'progression',
          label: 'Progression',
          type: 'characteristic',
        },
      },
      metrics: { nodeCount: 1, edgeCount: 0 },
      version: 1,
    },
    metadata: {
      nodes: {},
      edges: {},
      structure: { lastFetched: 0, isDirty: false },
    },
  },
  playerStatistics: {
    progression: { experience: 0, level: 1 },
  },
  userInformation: {
    name: 'Pioneer',
    userClass: 'Neural Architect',
    mostRecentAction: 'None',
  },
  aiConfig: {
    model: 'gemini-3-flash-preview',
    temperature: 0,
    liveTranscription: true,
    voiceSensitivity: 0.5,
  },
  integrations: {
    config: { webhookUrl: '', enabled: false },
    obsidianConfig: {
      enabled: false,
      host: '127.0.0.1',
      port: '27124',
      apiKey: '',
      useHttps: false,
      targetFolder: 'Journal/AI',
    },
    logs: [],
  },
};
