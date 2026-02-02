
/**
 * Journal Feature Type Definitions
 * 
 * Defines data structures for journal entry storage, component props,
 * and performance tracking metadata following the Separated Selector Facade Pattern.
 * 
 * @module features/journal/types
 * @see {@link /documentation/state-management/GLOBAL_STATE.md} for state patterns
 */

import { WeightedAction } from '@/lib/soulTopology/types';

// ============================================================
// JOURNAL DATA MODELS
// ============================================================

/**
 * Performance metadata for a single journal entry.
 * Tracks EXP gains and progression impact after AI processing.
 * 
 * @property {number} totalExp - Total EXP awarded for this entry
 * @property {number} levelsGained - Number of node level-ups triggered
 * @property {Record<string, number>} [nodeIncreases] - Detailed breakdown: node label → EXP gained
 */
export interface JournalMetadata {
  totalExp: number;
  levelsGained: number;
  nodeIncreases?: Record<string, number>;
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
 * Supports both AI-processed and manually tagged entries.
 * 
 * @property {string} content - Raw text content of the journal entry
 * @property {WeightedAction[]} [weightedActions] - AI-extracted actions with proportional weights
 * @property {string[]} [actions] - Manually assigned action tags (legacy/manual mode)
 * @property {string} [duration] - Time spent (format: "30", "2h", "90 mins")
 * @property {JournalMetadata} [metadata] - Performance tracking data post-processing
 * @deprecated {string} [action] - Legacy singular action field (backward compatibility)
 */
export interface JournalEntryData {
  content: string;
  weightedActions?: WeightedAction[];
  actions?: string[];
  duration?: string;
  metadata?: JournalMetadata;
  action?: string; // Deprecated
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
 * Supports both AI-powered and manual tagging workflows.
 * 
 * @property {function} onSubmit - Callback with form data (content, time, duration, tags, AI flag)
 * @property {boolean} isProcessing - Loading state during submission
 */
export interface ManualEntryFormProps {
  onSubmit: (data: {
    content: string;
    time?: string;
    duration?: string;
    actions?: string[];
    useAI: boolean;
  }) => void;
  isProcessing: boolean;
}

/**
 * Props for voice recorder component.
 * Handles audio capture and Base64 encoding for transcription pipeline.
 * 
 * @property {function} onProcessed - Callback with Base64-encoded audio data
 * @property {boolean} isProcessing - Loading state during transcription/processing
 */
export interface VoiceRecorderProps {
  onProcessed: (audioBase64: string) => void;
  isProcessing: boolean;
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
