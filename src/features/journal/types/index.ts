
/**
 * Journal Feature Type Definitions
 * 
 * Defines data structures for journal entry storage, component props,
 * and performance tracking metadata following the Separated Selector Facade Pattern.
 * 
 * USER-CENTRIC SCHEMA: Structures data from the user's viewing perspective,
 * not the system's generation method.
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

// ============================================================
// COMPONENT PROPS INTERFACES
// ============================================================

/**
 * Props for the main journal feature wrapper component.
 * Supports optional integration callbacks for webhooks/external systems.
 * 
 * @property {function} [onIntegrationEvent] - Optional callback for integration events (Obsidian, webhooks)
 */
export interface JournalFeatureProps {
  onIntegrationEvent?: (eventName: string, payload: any) => Promise<void>;
}

/**
 * Props for individual journal entry display component.
 * Handles rendering entry content, metadata, and AI processing triggers.
 * 
 * @property {string} time - Entry timestamp (ISO format or HH:mm:ss)
 * @property {JournalEntryData} entry - Complete entry data with content and metadata
 * @property {boolean} isProcessing - Loading state for AI processing
 * @property {function} onParseEntry - Callback to trigger AI semantic analysis
 */
export interface JournalEntryItemProps {
  time: string;
  entry: JournalEntryData;
  isProcessing: boolean;
  onParseEntry: () => void;
}

/**
 * Props for entry results breakdown component.
 * Displays detailed EXP distribution across impacted nodes.
 * 
 * @property {Record<string, number>} nodeIncreases - Map of node labels to EXP gained
 */
export interface EntryResultsProps {
  nodeIncreases: Record<string, number>;
}

/**
 * Props for manual journal entry form component.
 * Supports both manual typing and voice "To Text" integration.
 * 
 * **Voice Integration:**
 * - `initialText` pre-populated from voice "To Text" button
 * - `onTextChange` syncs textarea content with parent component
 * - User can edit before submitting
 * 
 * @property {function} onSubmit - Callback with form data (content, duration)
 * @property {boolean} isProcessing - Loading state during submission
 * @property {string} [initialText] - Pre-populated text from voice transcription
 * @property {function} [onTextChange] - Callback when textarea content changes
 */
export interface ManualEntryFormProps {
  onSubmit: (data: {
    content: string;
    duration?: string;
  }) => void;
  isProcessing: boolean;
  initialText?: string;
  onTextChange?: (text: string) => void;
}

/**
 * Props for voice recorder component.
 * Handles audio capture and Base64 encoding for transcription pipeline.
 * 
 * @property {function} onProcessed - Callback with Base64-encoded audio data
 * @property {boolean} isProcessing - Loading state during transcription/processing
 */
/**
 * Props for VoiceRecorder component using batch Gemini transcription.
 * Handles audio recording with Web Speech API preview and dual submission flows.
 *
 * **Recording Architecture:**
 * - MediaRecorder captures WebM audio during recording (max 60s or manual stop)
 * - Web Speech API provides display-only real-time preview (not used for data)
 * - Falls back to silent recording if Web Speech API unavailable
 * - Two submission flows: auto-submit (immediate entry) or manual review (textarea)
 *
 * **Submission Flows:**
 * 1. Auto-submit (Record button):
 *    - Recording stops → Gemini batch transcription → onSubmitAuto callback
 *    - Parent triggers useCreateJournalEntry immediately
 *
 * 2. Manual review ("To Text" button):
 *    - User clicks button → Gemini batch transcription → onToTextReview callback
 *    - Parent populates textarea for user review and editing
 *
 * @interface VoiceRecorderProps
 * @property {Function} onSubmitAuto - Callback for auto-submit flow (recording stops)
 * @property {Function} onToTextReview - Callback for manual review flow (To Text button)
 */
export interface VoiceRecorderProps {
  /**
   * Callback for auto-submit flow - called when recording stops.
   * Receives transcribed text from Gemini batch transcription.
   * Parent component should trigger useCreateJournalEntry with this text.
   * 
   * @param {string} text - Transcribed text from Gemini (official transcription)
   */
  onSubmitAuto: (text: string) => void;

  /**
   * Callback for manual review flow - called when user clicks "To Text" button.
   * Receives transcribed text from Gemini batch transcription.
   * Parent component should populate textarea with this text for user review.
   * 
   * @param {string} text - Transcribed text from Gemini (for editing before submit)
   */
  onToTextReview: (text: string) => void;
}

/**
 * Props for hierarchical journal view component.
 * Renders year/month/day tree structure with expand/collapse controls.
 * 
 * @property {JournalStore} data - Complete journal data hierarchy
 * @property {function} onAddManualEntry - Callback to add entry at specific date
 * @property {function} onParseEntry - Callback to trigger AI analysis for specific entry
 * @property {boolean} isProcessing - Global processing state indicator
 */
export interface JournalViewProps {
  data: JournalStore;
  onAddManualEntry: (year: string, month: string, day: string, content: string) => void;
  onParseEntry: (year: string, month: string, day: string, time: string) => void;
  isProcessing: boolean;
}
