/**
 * Journal Feature Type Definitions
 * 
 * Defines critical data structures for journal entry storage, 
 * following the Separated Selector Facade Pattern.
 * 
 * USER-CENTRIC SCHEMA: Structures data from the user's viewing perspective,
 * not the system's generation method. 
 * This is only true for the local journal feature store, NOT the global store. 
 * 
 * @module features/journal/types
 * @see {@link /documentation/state-management/GLOBAL_STATE.md} for state patterns when reading from global store
 * @see {@link /documentation/state-management/LOCAL_STATE.md} for state patterns when using local component state (this file)
 */


// ============================================================
// JOURNAL DATA MODELS
// ============================================================

/**
 * Performance result data for a processed journal entry.
 * Contains calculated metrics after entry has been analyzed and integrated into the topology.
 * 
 * @property {number} levelsGained - Number of node level-ups triggered by this entry
 * @property {number} totalExpIncrease - Total EXP awarded across all affected nodes
 * @property {Record<string, number>} nodeIncreases - Detailed breakdown: node label → EXP gained
 */
export interface JournalEntryResult {
  levelsGained: number;
  totalExpIncrease: number;
  nodeIncreases: Record<string, number>;
}

/**
 * Entry-specific metadata tracking generation method and timing.
 * 
 * @property {Object} flags - Boolean flags for entry characteristics
 * @property {boolean} flags.aiAnalyzed - True if entry was processed by AI semantic analysis
 * @property {string} timePosted - ISO timestamp of when entry was created
 * @property {string} [duration] - Time spent on activity (format: "30", "2h", "90 mins")
 */
export interface JournalEntryMetadata {
  flags: {
    aiAnalyzed: boolean;
  };
  timePosted: string;
  duration?: string;
}

/**
 * Folder-level aggregated metadata.
 * Stores cumulative EXP totals for year/month/day groupings.
 * 
 * @property {number} totalExp - Total EXP from all entries in this folder
 */
export interface FolderMetadata {
  totalExp: number;
}

/**
 * Individual journal entry data structure.
 * User-centric design: structured by what the user sees, not how it was generated.
 * 
 * UNIFIED ACTION WEIGHTING:
 * - AI mode: Provides semantic weights (e.g., { "Debugging": 0.7, "Code review": 0.3 })
 * - Manual mode: Defaults to equal weights (e.g., { "Coding": 1, "Exercise": 1 })
 * 
 * @property {string} content - Raw text content of the journal entry
 * @property {Record<string, number>} actions - Action name → weight mapping (sum should be ~1.0 for AI, any value for manual)
 * @property {JournalEntryResult} [result] - Performance metrics (present after processing)
 * @property {JournalEntryMetadata} metadata - Entry generation metadata and flags
 * 
 * @example
 * // AI-analyzed entry
 * {
 *   content: "Spent time debugging the authentication system",
 *   actions: { "Debugging": 0.8, "System design": 0.2 },
 *   result: { levelsGained: 2, totalExpIncrease: 45.3, nodeIncreases: {...} },
 *   metadata: { flags: { aiAnalyzed: true }, timePosted: "2026-02-02T14:30:00Z", duration: "120" }
 * }
 * 
 * @example
 * // Manual entry
 * {
 *   content: "Morning workout session",
 *   actions: { "Exercise": 1 },
 *   result: { levelsGained: 1, totalExpIncrease: 12.5, nodeIncreases: {...} },
 *   metadata: { flags: { aiAnalyzed: false }, timePosted: "2026-02-02T07:00:00Z", duration: "60" }
 * }
 */
export interface JournalEntryData {
  content: string;
  actions: Record<string, number>;
  result?: JournalEntryResult;
  metadata: JournalEntryMetadata;
}

/**
 * Hierarchical journal storage structure.
 * Organized by time hierarchy: Year → Month → Day → Time Key
 * 
 * @example
 * {
 *   "2026": {
 *     "2": {
 *       "2": {
 *         "14:30:00.000": { content: "Finished coding session", ... },
 *         metadata: { totalExp: 150 }
 *       },
 *       metadata: { totalExp: 300 }
 *     },
 *     metadata: { totalExp: 1200 }
 *   }
 * }
 */
export type JournalDay = Record<string, JournalEntryData> & { metadata?: FolderMetadata };
export type JournalMonth = Record<string, JournalDay> & { metadata?: FolderMetadata };
export type JournalYear = Record<string, JournalMonth> & { metadata?: FolderMetadata };
export type JournalStore = Record<string, JournalYear>;
