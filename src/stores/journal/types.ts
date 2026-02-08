/**
 * Journal Store Type Definitions
 *
 * Defines the Firebase-first, read-aside schema for journal storage.
 * All entries are normalized by ID and indexed by a lightweight tree.
 *
 * @module stores/journal/types
 * @see {@link /documentation/state-management/GLOBAL_STATE.md} for state patterns
 */

// ============================================================
// JOURNAL ENTRY MODELS
// ============================================================

/**
 * Allowed lifecycle states for a journal entry.
 */
export type JournalEntryStatus =
  | 'DRAFT'
  | 'TRANSCRIBING'
  | 'PENDING_ANALYSIS'
  | 'ANALYZING'
  | 'COMPLETED'
  | 'ANALYSIS_FAILED';

/**
 * AI analysis result for a processed journal entry.
 *
 * @property {number} totalExpIncrease - Total EXP awarded across all affected nodes
 * @property {Record<string, number>} nodeIncreases - Node label to EXP gained
 * @property {number} levelsGained - Number of node level-ups triggered by this entry
 */
export interface JournalEntryResult {
  totalExpIncrease: number;
  nodeIncreases: Record<string, number>;
  levelsGained: number;
}

/**
 * Entry metadata that is safe for display and sync.
 *
 * @property {Object} flags - Boolean flags for entry characteristics
 * @property {boolean} flags.aiAnalyzed - True if entry was processed by AI analysis
 * @property {string} timePosted - ISO timestamp for when the entry was created
 * @property {number} [duration] - Duration in seconds (or minutes if the UI uses minutes)
 */
export interface JournalEntryMetadata {
  flags: {
    aiAnalyzed: boolean;
  };
  timePosted: string;
  duration?: number;
}

/**
 * Normalized journal entry stored in Firebase and cached in Zustand.
 *
 * @property {string} id - Sortable ID (YYYYMMDD-HHmmss-suffix)
 * @property {string} content - Raw entry text
 * @property {JournalEntryStatus} status - Current processing state
 * @property {Record<string, number>} actions - Action name to weight mapping
 * @property {JournalEntryResult} [result] - Present after analysis completes
 * @property {JournalEntryMetadata} metadata - Immutable entry metadata
 */
export interface JournalEntryData {
  id: string;
  content: string;
  status: JournalEntryStatus;
  actions: Record<string, number>;
  result?: JournalEntryResult;
  metadata: JournalEntryMetadata;
}

// ============================================================
// JOURNAL TREE STRUCTURE (LIGHTWEIGHT INDEX)
// ============================================================

/**
 * Day-level tree node referencing entry IDs only.
 */
export interface JournalTreeDay {
  totalExp: number;
  entries: string[];
}

/**
 * Month-level tree node containing day summaries.
 */
export interface JournalTreeMonth {
  totalExp: number;
  days: Record<string, JournalTreeDay>;
}

/**
 * Year-level tree node containing month summaries.
 */
export interface JournalTreeYear {
  totalExp: number;
  months: Record<string, JournalTreeMonth>;
}

/**
 * Top-level tree structure keyed by year (YYYY).
 */
export type JournalTreeStructure = Record<string, JournalTreeYear>;

// ============================================================
// CACHE METADATA
// ============================================================

/**
 * Cache metadata for a month or entry group.
 */
export interface JournalCacheInfo {
  lastFetched: number;
  isDirty?: boolean;
}

/**
 * Persisted journal store snapshot.
 */
export interface JournalPersistedState {
  entries: Record<string, JournalEntryData>;
  tree: JournalTreeStructure;
  metadata: Record<string, JournalCacheInfo>;
}
