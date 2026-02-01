import { JournalStore } from '@/features/journal/types';
import { VisualGraph } from '@/features/visual-graph/types';
import { CdagTopology } from '@/stores/cdag-topology/types';
import { IntegrationStore } from '@/features/integration/types';
// Exporting player statistics types so they are accessible to submodules importing from '../types'
export * from '@/stores/player-statistics/types';
import { PlayerStatistics } from '@/stores/player-statistics/types';

/**
 * Types for general user information and identity.
 */
export interface UserInformation {
  name: string;
  userClass?: string;
  mostRecentAction?: string;
}

export interface AIConfig {
  model: string;
  temperature: number;
  liveTranscription: boolean;
  voiceSensitivity: number;
  apiKey?: string;
}

/**
 * The unified state object representing the entire application's data.
 * This is the primary interaction point for external persistence APIs.
 */
export interface AppData {
  /** Historical records of thoughts and actions */
  journal: JournalStore;
  /** Processed visual data for simulation (D3). Maps to "visualGraph" table. */
  visualGraph: VisualGraph;
  /** Logical structural hierarchy (The Second Brain core). Maps to "cdagTopology" table. */
  cdagTopology: CdagTopology;
  /** Experience and level tracking for all identified nodes */
  playerStatistics: PlayerStatistics;
  /** User specific details like name and profile settings */
  userInformation: UserInformation;
  /** External API integration settings and logs */
  integrations: IntegrationStore;
  /** AI processing configurations */
  aiConfig: AIConfig;
}
