
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

/**
 * AI Response structure for the refined action pipeline.
 * Represents the 3-layer semantic decomposition of human effort.
 */
export interface TextToActionResponse {
  /** The most granular level: specific tasks performed */
  weightedActions: WeightedAction[];
  /** The estimated time taken for the activity */
  duration: string;
  /** The intermediate level: clusters of actions (e.g., "Coding") */
  skills: string[];
  /** The highest level: abstract human traits or qualities (e.g., "Intellect") */
  characteristics: string[];
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
