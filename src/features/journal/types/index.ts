
/**
 * Types defining the structure of journal entries and their storage.
 */

export interface JournalMetadata {
  totalExp: number;
  levelsGained: number;
  /** Detailed breakdown of EXP added to each specific node by this entry */
  nodeIncreases?: Record<string, number>;
}

export interface WeightedAction {
  label: string;
  weight: number;
}

export interface GeneralizationLink {
  child: string;
  parent: string;
  weight: number;
}

/**
 * AI Response structure for the refined action pipeline.
 * Represents the 3-layer semantic decomposition with structured parent-child mappings.
 */
export interface TextToActionResponse {
  /** Estimated duration in integer minutes (e.g., 30, 120) */
  durationMinutes: number;
  /** The most granular level: specific tasks performed */
  weightedActions: WeightedAction[];
  /** Action-to-Skill mappings: explicit parent-child relationships */
  skillMappings: GeneralizationLink[];
  /** Skill-to-Characteristic mappings: explicit parent-child relationships */
  characteristicMappings: GeneralizationLink[];
  /** Optional abstraction chain from characteristics to higher-level concepts */
  generalizationChain?: GeneralizationLink[];
}

export interface JournalEntryData {
  /** The raw text content of the entry */
  content: string;
  /** Primary classified actions with their respective time/relevance proportions */
  weightedActions?: WeightedAction[];
  /** Manually assigned action tags */
  actions?: string[];
  /** Optional time taken for the activity (estimated or manual) */
  duration?: string;
  /** Performance metadata for this specific entry */
  metadata?: JournalMetadata;
  /** Deprecated singular action field */
  action?: string;
}

export interface FolderMetadata {
  totalExp: number;
}

/** 
 * Hierarchical store for journal entries.
 * Structure: Year (string) -> Month (string) -> Day (string) -> Time Key (string) -> JournalEntryData
 */
export type JournalDay = Record<string, JournalEntryData> & { metadata?: FolderMetadata };
export type JournalMonth = Record<string, JournalDay> & { metadata?: FolderMetadata };
export type JournalYear = Record<string, JournalMonth> & { metadata?: FolderMetadata };

export type JournalStore = Record<string, JournalYear>;
