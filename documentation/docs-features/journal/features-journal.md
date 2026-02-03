# Feature: Journal

**Last updated**: 2026-02-03 - Voice orchestration refactored into atomic hooks, Web Speech integration, real-time preview

The Journal is the primary data ingestion point, transforming raw input into structured neural data. Users can submit entries via three independent flows: voice recording with auto-submit, voice with review-before-submit, or manual text entry. All flows support AI analysis for skill/action tagging and experience calculation.

## Journal Entry Schema

### Current Structure (v2 - User-Centric)

```typescript
interface JournalEntryData {
  content: string;                     // Raw text content
  actions: Record<string, number>;     // Action → weight mapping
  result?: {                           // Performance metrics (post-processing)
    levelsGained: number;
    totalExpIncrease: number;
    nodeIncreases: Record<string, number>;
  };
  metadata: {                          // Entry metadata
    flags: { aiAnalyzed: boolean };
    timePosted: string;
    duration?: string;
  };
}
```

### Design Philosophy

**User-Centric**: Schema reflects the user's viewing perspective, not the system's generation method.

**Unified Action Weighting**:
- AI mode: Provides semantic weights (`{ "Debugging": 0.7, "Code review": 0.3 }`)
- Manual mode: Defaults to equal weights (`{ "Coding": 1, "Exercise": 1 }`)
- Both use the same `actions: Record<string, number>` structure

**Separated Concerns**:
- `result`: Calculated performance data (EXP, levels, node impacts)
- `metadata`: Entry generation metadata (flags, timestamp, duration)

### Examples

**AI-Analyzed Entry**:
```typescript
{
  content: "Spent time debugging the authentication system",
  actions: { "Debugging": 0.8, "System design": 0.2 },
  result: {
    levelsGained: 2,
    totalExpIncrease: 45.3,
    nodeIncreases: { "Debugging": 18.2, "Software engineering": 15.1, "Intellect": 12.0 }
  },
  metadata: {
    flags: { aiAnalyzed: true },
    timePosted: "2026-02-02T14:30:00Z",
    duration: "120"
  }
}
```

**Manual Entry**:
```typescript
{
  content: "Morning workout session",
  actions: { "Exercise": 1 },
  result: {
    levelsGained: 1,
    totalExpIncrease: 12.5,
    nodeIncreases: { "Exercise": 5.0, "Strength training": 4.0, "Vitality": 3.5 }
  },
  metadata: {
    flags: { aiAnalyzed: false },
    timePosted: "2026-02-02T07:00:00Z",
    duration: "60"
  }
}
```

## Architecture Overview

### Three Entry Creation Flows

The journal feature supports three independent user pathways:

#### 1. **Auto-Submit Flow** (Voice → Transcribe → Analyze → Immediate Entry)
- User records audio via microphone
- Clicks "Stop" button
- System automatically: transcribes (Gemini API), analyzes with AI, creates final entry
- Result: Complete entry created immediately with skills and experience
- Best for: Quick logging of major activities

#### 2. **To-Text Review Flow** (Voice → Preview → Manual Edit → Submit)
- User records audio via microphone
- Clicks "To Text" button
- System captures real-time Web Speech preview text (instant, no API)
- User edits text in manual entry form
- User clicks "Submit" for AI analysis
- Result: Entry created with user-edited content and AI analysis
- Best for: Refining transcription before logging

#### 3. **Manual Entry Flow** (Type → Optional Duration → Submit)
- User types directly in manual entry form
- Optional: specify duration override
- Clicks "Submit" for AI analysis
- Result: Entry created with AI-extracted skills and experience
- Best for: Activities without audio or when typing is faster

### Three Core Responsibilities

1. **Getting User Input**
   - Voice Recorder: Audio capture with real-time Web Speech preview
   - Manual Entry Form: Text input with optional duration override
   - Support three independent submission flows (auto-submit, review, manual)

2. **Updating Global Journal Store**
   - Update store **immediately** with loading placeholder (for responsiveness)
   - Create entry via `useVoiceAutoSubmit` hook (orchestrator) or `useCreateEntryPipeline`
   - Maintain global journal state in `stores/app-data`

3. **Displaying Journal Store**
   - Render journal entries using `journal-entry-item` and related components
   - Use **local React state** for ephemeral UI state (dropdowns, form state, processing flags)
   - Separate persistent data (journal entries) from transient UI state
   - Show per-entry processing state ("Analyzing..." indicators) during AI analysis

## Processing State Architecture

### Problem: AI Analysis Latency
When a user creates an entry (especially voice with auto-submit), the entry is created immediately but AI analysis takes 1-2 seconds. Users need visual feedback that the entry is being processed.

### Solution: Per-Entry Processing State

**Parent Component (JournalFeature)**:
```typescript
const [processingEntries, setProcessingEntries] = useState<Set<string>>(new Set());

const handleProcessingStateChange = (entryId: string, isProcessing: boolean) => {
  setProcessingEntries(prev => {
    const updated = new Set(prev);
    if (isProcessing) {
      updated.add(entryId);
    } else {
      updated.delete(entryId);
    }
    return updated;
  });
};
```

**Passed to Children**:
```typescript
<VoiceRecorder onProcessingStateChange={handleProcessingStateChange} />
```

**Child Hooks Track State**:
```typescript
// In useAnalyzeVoiceEntry (Stage 3)
onProcessingStateChange?.(entryId, true);  // Start AI analysis
// ... AI analysis happens ...
onProcessingStateChange?.(entryId, false); // Complete
```

**Display Component Uses State**:
```typescript
// In journal-entry-item.tsx
if (processingEntries.has(entryId)) {
  return <button disabled>Analyzing...</button>;
}
```

**Why This Pattern**:
- Single source of truth (parent state)
- Children notify parent via callbacks
- Parent re-renders all entries with fresh state
- Automatic synchronization between UI and processing

## State Management Summary

### Global State (Zustand)
- **Persistent**: Journal entries, graph data, player statistics
- **Storage**: IndexedDB via Zustand middleware
- **Accessed via**: `useJournalStore()`, `useAppDataStore()`
- **Stores**: Located in `stores/` directory

### Local Component State (React useState)
- **Transient**: UI dropdowns, form inputs, processing indicators
- **Scope**: Component-only (not global)
- **Examples**: `expanded` (JournalView), `processingEntries` (JournalFeature), `isRecording` (VoiceRecorder)

### State Boundaries
```
JournalFeature (Parent)
├─ Global: journal entries, graph store
├─ Local: processingEntries Set, feedbackMessage
│
├─ VoiceRecorder (Child)
│  ├─ Local: isRecording, webSpeechText, recordingTime
│  └─ Callback out: onProcessingStateChange(entryId, isProcessing)
│
└─ JournalView (Child)
   ├─ Local: expanded states, current day
   └─ Callback in: processingEntries from parent
```

## Component Structure

### Main Components

#### JournalFeature (Orchestrator)
The main entry point for the journal feature. Self-contained component that handles all journal operations.

```typescript
interface JournalFeatureProps {
  onIntegrationEvent?: (eventName: string, payload: any) => Promise<void>;
}
```

**Responsibilities**:
- Render input components (VoiceRecorder, ManualEntryForm)
- Render display component (JournalView)
- Handle all user interactions
- Coordinate store updates
- Trigger integration events

#### JournalView
Displays journal entries in chronological hierarchy (year > month > day > time).

**Features**:
- Recursive dropdown navigation with expand/collapse states
- Inline quick entry forms (TextOnlyManualEntryForm) at day level
- Plus button to add entries to specific days
- Loading states during initialization
- Uses local React useState for dropdown states (not global store)
- Chronological sorting at all levels (earliest first)

## Voice Recording Architecture

### VoiceRecorder Component
UI layer for audio recording with three submission options and real-time preview.

**Features**:
- Microphone capture with permission handling
- Real-time audio level visualization using Canvas
- Real-time Web Speech API preview (concurrent with recording)
- Three submission buttons:
  - **Stop**: Auto-submit flow (Gemini transcription + AI analysis)
  - **To Text**: Review flow (Web Speech preview → manual edit → submit)
  - **Clear**: Reset recording
- User feedback display showing current state

**Key Design**:
- Component is UI-only (no orchestration logic)
- Web Speech preview text stored in state but NOT persisted
- All orchestration logic moved to `useVoiceAutoSubmit` hook
- Processing state tracked via parent callback `onProcessingStateChange`

### Voice Orchestration Hooks

Three atomic hooks handle sequential entry creation pipeline:

#### `useVoiceAutoSubmit` (Orchestrator)
Coordinates Stages 1-3 sequentially. Brain of the voice auto-submit flow.

```typescript
const submitVoiceRecording = useVoiceAutoSubmit(
  webSpeechFallback,      // Web Speech text for cascade fallback
  setFeedback,            // Update user feedback message
  onProcessingStateChange // Track per-entry AI analysis state
);

await submitVoiceRecording(audioBlob);
```

**Sequential Pipeline**:
1. **Stage 1**: Create dummy entry immediately with "🎤 Transcribing..." placeholder
2. **Stage 2**: Transcribe audio (cascade: Gemini → Web Speech API → error)
3. **Stage 3**: AI analysis on real text (only if transcription succeeded)

**Why Sequential**:
- Ensures AI never processes placeholder text
- Guarantees transcription completes before analysis
- User sees immediate feedback while processing continues

#### `useTranscribeAudio` (Stage 2)
Handles audio transcription with cascade fallback strategy.

**Transcription Flow**:
1. Try Gemini API (official transcription)
2. Fallback to Web Speech API text (captured during recording)
3. Return error if both fail

**When Used**:
- Auto-Submit flow (via `useVoiceAutoSubmit`)
- To-Text does NOT use this (uses Web Speech directly for speed)

#### `useAnalyzeVoiceEntry` (Stage 3)
AI analysis of transcribed text. Extracts skills and calculates experience.

**When Used**:
- Auto-Submit flow (after Stage 2 succeeds)
- Manual entry submit (when user clicks "Submit")

**Processing State Tracking**:
- Calls `onProcessingStateChange(entryId, true)` when starting
- Calls `onProcessingStateChange(entryId, false)` when complete
- Parent uses this to show "Analyzing..." button state

### Web Speech API Integration

**WebSpeechPreview Component**:
- Runs concurrently with MediaRecorder during recording
- Captures real-time final + interim results
- Updates parent `webSpeechText` state via callback
- Purely display-only (text shown to user while speaking)

**Used By**:
- To-Text button: Uses captured Web Speech text directly (instant, no API call)
- Auto-Submit: Uses captured Web Speech as fallback if Gemini fails

**Key Difference**:
- Web Speech: Real-time preview, immediate, fallback only
- Gemini: Official transcription source for auto-submit flow

## Functional Components

#### VoiceRecorder
Audio capture component with three submission flows and real-time preview.

**Features**:
- Microphone capture with permission handling
- Real-time audio level visualization (Canvas-based)
- Real-time Web Speech API preview during recording
- Three submission buttons (Stop, To Text, Clear)
- Processing state tracking via `onProcessingStateChange` callback

**Usage**:
```tsx
<VoiceRecorder 
  onToTextReview={(text) => appendToForm(text)}
  onProcessingStateChange={(entryId, isProcessing) => updateState(entryId, isProcessing)}
/>
```

### ManualEntryForm
Text-based entry form with AI analysis and optional duration override.

**Features**:
- Rich textarea for content entry
- Optional duration input (overrides automatic timing)
- AI analysis always enabled
- Processing state tracking
- Submit button with loading states

**Usage**:
```tsx
<ManualEntryForm 
  initialText={voiceTranscriptionText}
  onSubmit={createJournalEntry}
/>
```

#### TextOnlyManualEntryForm
Lightweight inline entry form for quick day-level entries (no AI).

**Features**:
- Minimal inline textarea
- No AI analysis (manual action weighting only)
- Quick entry for time-sensitive logging

## Data Flow

### Entry Creation Pipelines

#### Auto-Submit Flow (Voice → Auto Entry)
```
User clicks "Stop" button
    ↓
VoiceRecorder calls stopRecording() → gets audioBlob
    ↓
VoiceRecorder calls submitVoiceRecording(audioBlob) hook
    ↓
useVoiceAutoSubmit STAGE 1: Create dummy entry
    ├─ Content: "🎤 Transcribing..."
    ├─ Metadata: { aiAnalyzed: false, timePosted: "...", duration: undefined }
    └─ Store updated immediately (user sees placeholder)
    ↓
useVoiceAutoSubmit STAGE 2: Transcribe audio
    ├─ Try: Gemini API (official transcription)
    ├─ Fallback: Web Speech API text (from concurrent preview)
    ├─ Entry content updated with transcription
    └─ Store updated with real text
    ↓
useVoiceAutoSubmit STAGE 3: AI analysis (ONLY if Stage 2 succeeded)
    ├─ Extract skills/actions from transcribed text
    ├─ Calculate experience propagation
    ├─ Call onProcessingStateChange(entryId, true) → parent shows "Analyzing..."
    ├─ Update entry with final actions, results, duration
    ├─ Call onProcessingStateChange(entryId, false) → clear "Analyzing..." state
    └─ Store updated with complete entry
    ↓
User sees final entry with skills and experience breakdown
```

#### To-Text Review Flow (Voice → Preview → Manual Submit)
```
User clicks "To Text" button
    ↓
VoiceRecorder calls stopRecording() to finalize MediaRecorder
    ↓
VoiceRecorder uses captured webSpeechText (from real-time preview)
    ├─ No API call (instant)
    ├─ Quality: Live preview, may be less accurate than Gemini
    └─ Fallback: If no preview text, show error
    ↓
VoiceRecorder calls onToTextReview(webSpeechText) callback
    ↓
Parent (JournalFeature) handles callback:
    └─ Sets voiceTranscriptionText state
        ↓
        ManualEntryForm receives initialText prop
            ├─ useEffect detects change
            └─ Appends Web Speech text to existing content
                └─ setContent(prev => `${prev.trim()} ${initialText}`)
        ↓
        User edits text in textarea
        ↓
        User clicks "Submit" button
            ↓
            useCreateEntryPipeline orchestrator runs AI analysis:
                ├─ Extract skills/actions from edited text
                ├─ Calculate experience
                ├─ Update entry with final data
                └─ Show "Analyzing..." state during processing
                ↓
                Entry created with user-edited content
```

#### Manual Entry Flow (Type → Manual Submit)
```
User types text in ManualEntryForm
    ↓
Optional: User specifies duration override
    ↓
User clicks "Submit" button
    ↓
useCreateEntryPipeline orchestrator runs:
    ├─ Create entry immediately with placeholder
    ├─ Extract skills/actions via AI analysis
    ├─ Calculate experience propagation
    └─ Update entry with final data
    ↓
Entry created with AI-extracted skills and experience
```

### Processing State Tracking

For visibility into "Analyzing..." AI processing state:

```
Parent Component (JournalFeature):
    ├─ State: processingEntries = Set<string> (entry IDs currently processing)
    └─ useCallback: onProcessingStateChange(entryId, isProcessing)
        ├─ if isProcessing: processingEntries.add(entryId)
        ├─ if !isProcessing: processingEntries.delete(entryId)
        └─ setProcessingEntries([...])

Child Components use processingEntries:
    ├─ VoiceRecorder passes callback to useVoiceAutoSubmit hook
    ├─ useVoiceAutoSubmit Stage 3 (useAnalyzeVoiceEntry)
    │   ├─ Before analysis: onProcessingStateChange(entryId, true)
    │   └─ After analysis: onProcessingStateChange(entryId, false)
    └─ JournalEntryItem displays "Analyzing..." button state
        └─ if (processingEntries.has(entryId)) → disable buttons, show spinner
```

**Why This Pattern**:
- Keeps processing state with parent (single source of truth)
- Children call parent callback for state updates
- Parent updates its state and re-renders all children
- UI shows per-entry processing indicators

## Performance Tracking

### Neural Impact Analysis

Every processed entry calculates its contribution to the user's growth, stored in the `result` object:

- **levelsGained**: Number of nodes that leveled up from this entry
- **totalExpIncrease**: Total EXP awarded across all affected nodes
- **nodeIncreases**: Detailed breakdown showing which nodes received how much EXP

The `EntryResults` component displays this breakdown when the user expands an entry's results section.

### Action Weighting System

**AI Mode**: Semantic analysis determines proportional weights based on entry content
- Example: "Spent 3 hours debugging, then wrote documentation" → `{ "Debugging": 0.8, "Technical writing": 0.2 }`
- Weights always sum to ~1.0 (normalized automatically)

**Manual Mode**: User-specified actions default to weight 1
- Example: Tags "Exercise, Reading" → `{ "Exercise": 1, "Reading": 1 }`
- System treats multiple manual actions equally

### Automatic Generalization

If you log an activity that falls under a new category, the AI automatically generates a bridge to the "progression" root node. This ensures the Concept Graph always remains a connected, single-root system.

### Deterministic Classification

- **Zero-Temperature Logic**: AI classification is deterministic. This means your "Player Stats" are a rigorous mathematical reflection of your logged activities, free from the randomness of typical LLM outputs.
- **Audit Trail**: Performance data is persisted within the entry's `result` object for historical analysis.

## API Layer

### Voice Orchestration Hooks

#### useVoiceAutoSubmit
```typescript
const submitVoiceRecording = useVoiceAutoSubmit(
  webSpeechFallback: string,                                    // Web Speech preview text
  setFeedback: (message: string) => void,                       // Update feedback display
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
);

await submitVoiceRecording(audioBlob: Blob);
```

**What it does**:
1. Creates dummy entry immediately (Stage 1)
2. Transcribes audio with cascade fallback (Stage 2)
3. Analyzes with AI (Stage 3)
4. Tracks processing state for parent UI

**Used by**: VoiceRecorder component's "Stop" button

---

#### useTranscribeAudio
```typescript
const transcribeAudio = useTranscribeAudio(
  webSpeechFallback: string,
  setFeedback: (message: string) => void
);

const transcription = await transcribeAudio(audioBlob, entryId);
```

**Transcription Strategy**:
- Primary: Gemini API (official source)
- Fallback: Web Speech API text (captured during recording)
- Error: Return empty string if both fail

**Used by**: useVoiceAutoSubmit (Stage 2)

---

#### useAnalyzeVoiceEntry
```typescript
const analyzeVoiceEntry = useAnalyzeVoiceEntry(
  setFeedback: (message: string) => void,
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
);

await analyzeVoiceEntry(entryId, transcription);
```

**What it does**:
1. Extracts skills/actions from transcription
2. Calculates experience propagation
3. Updates entry with final data
4. Tracks processing state

**Used by**: useVoiceAutoSubmit (Stage 3)

---

### Entry Creation Pipeline

#### useCreateEntryPipeline
```typescript
const { 
  createDummyEntry,           // Create placeholder immediately
  updateWithTranscription,    // Update with transcribed text
  upsertEntry                 // Direct entry update
} = useCreateEntryPipeline();

// Create dummy entry
const entryId = createDummyEntry(
  content: string,            // Display text ("🎤 Transcribing..." or "✍️ Processing...")
  duration?: string,          // Optional
  dateInfo?: DateInfo         // Auto-generated if undefined
);

// Update with transcription
await updateWithTranscription(entryId, transcription, updateWith);

// Direct upsert
upsertEntry(dateKey: string, entryData: JournalEntryData);
```

**Used by**: All entry creation flows (voice auto-submit, manual entry)

---

### Component Integration

#### VoiceRecorder Props
```typescript
interface VoiceRecorderProps {
  onToTextReview?: (transcription: string) => void;  // Called when user clicks To Text
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void;
}
```

#### ManualEntryForm Props
```typescript
interface ManualEntryFormProps {
  initialText?: string;                              // Pre-filled text (from to-text)
  onSubmit: (entry: JournalEntryData) => Promise<void>;
}
```

---

### Accessing Journal Data

```typescript
import { useJournalStore } from '@/stores/journal';

function MyComponent() {
  const journal = useJournalStore((state) => state.journal);
  const entries = journal[year]?.[month]?.[day] || {};
  
  // Or use actions
  const { upsertEntry } = useJournalActions();
}

import { useAppDataStore } from '@/stores/app-data';

function MyComponent() {
  const appData = useAppDataStore((state) => state.appData);
  const allEntries = appData.journal;  // Flat object structure
}
```

## Integration Points

The journal feature provides callbacks for external integrations:

```typescript
interface JournalFeatureProps {
  onIntegrationEvent?: (eventName: string, payload: any) => Promise<void>;
}

<JournalFeature onIntegrationEvent={handleIntegration} />
```

**Events Fired**:
- `JOURNAL_AI_PROCESSED`: After entry is created with AI analysis complete
  - Payload: `{ entryId, originalText, timestamp, skills, experience }`

**Use Cases**:
- Webhook notifications
- Obsidian sync
- External analytics
- Custom automation

## Usage Examples

### Basic Integration

```typescript
import { JournalFeature } from '@/features/journal';

function App() {
  const handleIntegration = async (eventName: string, payload: any) => {
    if (eventName === 'JOURNAL_AI_PROCESSED') {
      await sendWebhook(webhookUrl, payload);
    }
  };

  return <JournalFeature onIntegrationEvent={handleIntegration} />;
}
```

### Accessing Journal Data

```typescript
import { useAppDataStore } from '@/stores/app-data';

function MyComponent() {
  const appData = useAppDataStore((state) => state.appData);
  const allEntries = appData.journal; // Flat hierarchical structure
  
  // Access specific entry
  const entry = allEntries["2026"]["February"]["03"]["14:30:45.123"];
}
```

### Getting Processing State in Child Components

```typescript
// Parent (JournalFeature)
const [processingEntries, setProcessingEntries] = useState<Set<string>>(new Set());

// Child (JournalView)
function JournalView({ processingEntries }) {
  return (
    <button disabled={processingEntries.has(entryId)}>
      {processingEntries.has(entryId) ? 'Analyzing...' : 'Edit'}
    </button>
  );
}
```

## File Structure

```
features/journal/
├── components/
│   ├── journal-feature.tsx              # Main orchestrator & parent state
│   ├── journal-view.tsx                 # Display entries with hierarchical navigation
│   ├── manual-entry-form.tsx            # Rich text entry form with AI
│   ├── textonly-manual-entry-form.tsx   # Lightweight inline form (no AI)
│   ├── voice-recorder/
│   │   ├── voice-recorder.tsx           # Audio recording UI (3 submission buttons)
│   │   ├── audio-visualization.tsx      # Real-time frequency visualization
│   │   ├── web-speech-preview.tsx       # Real-time Web Speech API preview
│   │   └── index.ts                     # Re-export
│   ├── journal-entry-item/
│   │   ├── journal-entry-item.tsx       # Entry display with processing state
│   │   ├── entry-results.tsx            # Performance breakdown display
│   │   └── index.ts                     # Re-export
│   └── index.ts                         # Component exports
│
├── hooks/
│   ├── create-entry/
│   │   ├── use-create-entry-pipeline.ts # Entry creation orchestrator
│   │   └── index.ts                     # Re-export
│   │
│   ├── voice/
│   │   ├── use-voice-auto-submit.ts     # Stage 1-3 orchestrator (Gemini transcription)
│   │   ├── use-transcribe-audio.ts      # Stage 2 (Gemini → Web Speech fallback)
│   │   ├── use-analyze-voice-entry.ts   # Stage 3 (AI analysis + processing state)
│   │   └── index.ts                     # Re-export all voice hooks
│   │
│   └── index.ts                         # Hook exports
│
├── api/
│   └── create-entry.ts                  # Legacy API layer (optional)
│
├── types/
│   └── index.ts                         # TypeScript interfaces
│       ├─ VoiceRecorderProps
│       ├─ JournalEntryData
│       ├─ EntryResults
│       └─ etc.
│
├── utils/
│   ├── journal-entry-utils.ts           # Utility functions (minutesToText, etc)
│   ├── time-utils.ts                    # Date/time helpers
│   └── index.ts                         # Utility exports
│
└── index.ts                             # Feature exports
```

### Voice Hooks Organization

The three atomic voice hooks live in `hooks/voice/`:

1. **use-voice-auto-submit.ts** - Orchestrator
   - Coordinates Stages 1-3 sequentially
   - Used by: VoiceRecorder (Stop button)

2. **use-transcribe-audio.ts** - Stage 2
   - Transcription with cascade fallback
   - Used by: useVoiceAutoSubmit

3. **use-analyze-voice-entry.ts** - Stage 3
   - AI analysis + processing state tracking
   - Used by: useVoiceAutoSubmit, ManualEntryForm

## Performance Optimization

### Optimistic UI Updates

All three entry creation flows use optimistic updates:

1. **Immediate Display**: Entry shown with placeholder content while processing
2. **Background Processing**: AI analysis happens asynchronously
3. **Progressive Enhancement**: UI updates when processing completes

**Benefits**:
- Zero perceived latency for user
- Responsive UI even with slow transcription/analysis
- Fallback display if processing fails

### Bundle Size

- **Voice recorder module**: ~20 KB (with Web Speech API, MediaRecorder)
- **AI analysis hooks**: ~15 KB (Gemini API integration)
- **Total feature**: ~35 KB gzipped

### Processing Times (Typical)

- **Voice Stop → Placeholder Display**: < 100 ms
- **Gemini Transcription**: 1-3 seconds (depends on audio length)
- **Web Speech Preview**: Real-time (concurrent with recording)
- **AI Analysis**: 1-2 seconds (depends on text length)
- **Total for Auto-Submit**: 3-5 seconds (with optimistic update at start)

### Real-Time Preview Benefits

By using Web Speech API preview concurrently:
- Users see live transcription feedback while recording
- To-Text button provides instant preview (Web Speech text, no API call)
- Fallback for auto-submit if Gemini API fails
- Reduced API dependency for preview use case

## Troubleshooting

### Issue: "No text captured from Web Speech" in To-Text button
**Cause**: Web Speech API preview didn't capture any text during recording.

**Solutions**:
1. Record longer (Web Speech API needs sufficient audio to transcribe)
2. Speak more clearly and at normal volume
3. Check browser's microphone permissions
4. Use Auto-Submit instead (uses Gemini API with higher accuracy)

**Debug**:
- Check browser console for `[WebSpeechPreview]` logs
- Verify `webSpeechText` state in VoiceRecorder component

---

### Issue: Entry shows "🎤 Transcribing..." forever
**Cause**: Gemini API call timed out or failed, and Web Speech API wasn't available.

**Solutions**:
1. Check network connection
2. Verify Gemini API key in environment variables
3. Check API quota usage
4. Use To-Text instead (uses Web Speech directly, no API)

**Debug**:
- Check `[useTranscribeAudio]` logs in browser console
- Verify `VITE_GOOGLE_API_KEY` is set correctly

---

### Issue: Auto-Submit creates entry but processing state never clears
**Cause**: `onProcessingStateChange` callback not firing correctly.

**Solutions**:
1. Verify callback is passed to VoiceRecorder component
2. Check that parent component updates `processingEntries` state
3. Ensure entry ID matches between callback and storage

**Debug**:
- Add console logs to `onProcessingStateChange` callback
- Check `[useAnalyzeVoiceEntry]` logs in console

---

### Issue: Manual entry form doesn't append to-text result
**Cause**: `initialText` prop change not detected by `useEffect`.

**Solutions**:
1. Ensure `onToTextReview` callback properly calls `setVoiceTranscriptionText`
2. Check that ManualEntryForm receives the updated `initialText` prop
3. Verify textarea ref is properly mounted

**Debug**:
- Log `initialText` prop changes in ManualEntryForm
- Check that `lastAppendedRef` is tracking correctly

---

### Issue: Microphone permission denied
**Cause**: Browser permission for microphone not granted.

**Solutions**:
1. Check browser microphone permissions in settings
2. Reload page and grant permission when prompted
3. Try different browser if issue persists
4. Use manual entry as fallback

**Debug**:
- Check browser console for `NotAllowedError` or `NotFoundError`
- Verify microphone is working in other apps

## Related Documentation

- [Voice Recorder Architecture](features-voice-recorder.md) - Deep dive into voice recording, Web Speech, and orchestration hooks
- [Entry Pipeline: Orchestration Pattern](features-entry-pipeline.md) - Complete guide to entry creation flows and state management
- [State Management](../state-management/state-management-README.md) - Global vs local state patterns
- [AI and Gamification](../ai-and-gamification.md) - AI analysis pipeline
- [Architecture](../architecture/architecture.md) - System-wide architecture overview