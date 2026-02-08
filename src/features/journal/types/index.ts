
/**
 * Journal Feature Type Definitions
 * 
 * Defines data structures for journal entry storage, component props,
 * and performance tracking metadata.
 * 
 * **STATE DISTINCTION:**
 * - GLOBAL CACHE: Firebase source of truth, Zustand + IndexedDB cache (JournalEntryData, tree summaries)
 * - LOCAL STATE: Transient, UI-centric (isProcessing per entry, feedbackMessage, form inputs)
 * 
 * Global state is read from the journal store; local state lives in React components.
 * 
 * USER-CENTRIC SCHEMA: Structures data from the user's viewing perspective,
 * not the system's generation method. 
 * 
 * @module features/journal/types
 * @see {@link /documentation/state-management/GLOBAL_STATE.md} for state patterns when reading from global store
 * @see {@link /documentation/state-management/LOCAL_STATE.md} for component-level state patterns
 */
import {
  JournalEntryData,
  JournalEntryMetadata,
  JournalEntryResult,
  JournalEntryStatus,
  JournalTreeStructure,
} from '@/stores/journal/types';
import type { TextToActionResponse, WeightedAction } from '@/lib/soulTopology/types';

// ============================================================
// FEATURE-LEVEL LOCAL STATE (React Component State)
// ============================================================

/**
 * Feature-level feedback message state.
 * Displayed to user for all entry operations (transcription, AI analysis, etc).
 * 
 * **Scope:** Feature-level useState in JournalFeature component
 * **Lifetime:** Session-only (cleared on page refresh)
 * **Purpose:** User feedback for async operations
 * 
 * @property {string} message - Current feedback message (empty string = no message)
 * @property {setFeedbackMessage} function - React setState for updating message
 * 
 * @example
 * const [feedbackMessage, setFeedbackMessage] = useState('');
 * 
 * // During transcription
 * setFeedbackMessage('🤖 Transcribing with Gemini AI...');
 * 
 * // After transcription
 * setFeedbackMessage('✅ Transcription complete');
 */
export interface FeedbackState {
  message: string;
  setMessage: (message: string) => void;
}

/**
 * Local processing state per entry.
 * Tracks which entries are currently being analyzed by AI.
 * 
 * **Scope:** Feature-level Set or Record in JournalFeature
 * **Lifetime:** Duration of AI analysis (seconds to minutes)
 * **Purpose:** UI state for "Analyzing..." button on each entry
 * 
 * @example
 * const [processingEntries, setProcessingEntries] = useState<Set<string>>(new Set());
 * 
 * // When AI analysis starts
 * setProcessingEntries(prev => new Set(prev).add(entryId));
 * 
 * // When AI analysis completes
 * setProcessingEntries(prev => {
 *   const next = new Set(prev);
 *   next.delete(entryId);
 *   return next;
 * });
 */
export type ProcessingEntries = Set<string>;

// ============================================================
// COMPONENT PROPS INTERFACES
// ============================================================

/**
 * Props for the main journal feature wrapper component.
 * Manages local state internally (feedback messages, processing indicators).
 * 
 * **Local State Management:**
 * - Feedback and processing state are internal to the feature component
 * - External consumers only provide optional integration callbacks
 * 
 * **Integration Callbacks:**
 * - `onIntegrationEvent`: Optional callback for webhooks/external systems
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
 * **Global State (from store):**
 * - `entry`: JournalEntryData - Persistent entry content and results
 * 
 * **Local State (from feature component):**
 * - `isProcessing`: Whether THIS specific entry is being analyzed
 *   - TRUE: Show "Analyzing..." button state
 *   - FALSE: Show "AI Analyze Entry" button normally
 * 
 * @property {string} time - Entry timestamp (HH:mm:ss format)
 * @property {JournalEntryData} entry - Complete entry data from global store (GLOBAL STATE)
 * @property {boolean} isProcessing - Processing state for THIS entry (LOCAL STATE)
 * @property {function} onParseEntry - Callback to trigger AI analysis
 */
export interface JournalEntryItemProps {
  time: string;
  entry: JournalEntryData;
  isProcessing: boolean;  // LOCAL STATE: Processing state for this specific entry
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
 * - User can edit before submitting
 * 
 * **Local State:**
 * - `feedbackMessage`: Display feedback to user during processing
 * - `setFeedbackMessage`: Update feedback display
 * 
 * @property {function} onSubmit - Callback with form data (content, duration)
 * @property {boolean} isProcessing - Loading state during submission
 * @property {string} [initialText] - Pre-populated text from voice transcription
 * @property {string} feedbackMessage - User feedback message (LOCAL STATE)
 * @property {function} setFeedbackMessage - Update feedback message
 */
export interface ManualEntryFormProps {
  onSubmit: (data: {
    content: string;
    duration?: string;
  }) => void;
  isProcessing: boolean;
  initialText?: string;
}

// ============================================================
// RE-EXPORTS (FEATURE TYPE GATEWAY)
// ============================================================

export type {
  JournalEntryData,
  JournalEntryMetadata,
  JournalEntryResult,
  JournalEntryStatus,
  JournalTreeStructure,
};
export type { TextToActionResponse, WeightedAction };

/**
 * Props for VoiceRecorder component.
 * 
 * **Architecture:**
 * - Uses modular components: AudioVisualization, WebSpeechPreview
 * - Uses unified hook: useJournalEntryPipeline for progressive entry orchestration
 * - Entry creation is encapsulated within the journal entry pipeline
 *
 * **Submission Flows:**
 * 1. Auto-submit (Record button stop) - Sequential Entry Creation:
 *    - Recording stops → Hook creates dummy entry (Stage 1)
 *    - Gemini transcription → Hook updates entry with text (Stage 2)
 *    - AI analysis → Hook updates entry with full data (Stage 3)
 *    - Hook calls onProcessingStateChange for parent to track AI analysis state
 *
 * 2. Manual review ("To Text" button):
 *    - User clicks button → Web Speech preview text → onToTextReview callback
 *    - Parent populates textarea for user review and editing
 *
 * **Processing State Tracking:**
 * - onProcessingStateChange: Callback from hook with (entryId, isProcessing)
 * - Parent tracks which entries are being analyzed via processingEntries Set
 * - Enables "Analyzing..." button state for each entry
 *
 * @interface VoiceRecorderProps
 * @property {Function} onToTextReview - Callback for manual review flow (To Text button)
 * @property {Function} [onProcessingStateChange] - Callback for tracking AI analysis per entry (LOCAL STATE tracking)
 */
export interface VoiceRecorderProps {
  /**
   * Callback for manual review flow - called when user clicks "To Text" button.
   * Receives transcribed text from Gemini batch transcription.
   * Parent component should populate textarea with this text for user review.
   * 
   * @param {string} text - Transcribed text from Gemini (for editing before submit)
   */
  onToTextReview: (text: string) => void;
  
  /**
   * Callback for tracking AI analysis processing state per entry.
   * Called by useJournalEntryPipeline when AI analysis starts/ends.
   * Parent should use this to update processingEntries Set for "Analyzing..." button state.
   * 
   * **LOCAL STATE:** Transient UI state (cleared after AI analysis completes)
   * 
   * @param {string} entryId - Entry ID being analyzed
   * @param {boolean} isProcessing - TRUE: analysis started, FALSE: analysis ended
   */
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void;
}

/**
 * Props for hierarchical journal view component.
 * Renders year/month/day tree structure with expand/collapse controls.
 * 
 * **Local State (from feature component):**
 * - `processingEntries`: Set of entry IDs currently being analyzed
 * - `feedbackMessage`: User feedback for all entry operations
 * 
 * @property {JournalTreeStructure} tree - Lightweight tree index (GLOBAL CACHE)
 * @property {Record<string, JournalEntryData>} entries - Normalized entry map (GLOBAL CACHE)
 * @property {function} onAddManualEntry - Callback to add entry at a specific date
 * @property {function} onParseEntry - Callback to trigger AI analysis for specific entry
 * @property {ProcessingEntries} processingEntries - Local state: IDs of entries being analyzed
 * @property {string} feedbackMessage - Local state: Current feedback message for user
 */
export interface JournalViewProps {
  tree: JournalTreeStructure;
  entries: Record<string, JournalEntryData>;
  onAddManualEntry: (content: string, date?: Date) => void;
  onParseEntry: (entryId: string) => void;
  processingEntries: ProcessingEntries;  // LOCAL STATE
  feedbackMessage: string;               // LOCAL STATE
}
