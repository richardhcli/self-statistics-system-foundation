# Entry Creation Pipeline: Orchestration Pattern

**Last updated**: 2026-02-03 - Comprehensive entry pipeline documentation

The entry creation pipeline uses an orchestration pattern with three sequential stages, supporting multiple submission flows (voice auto-submit, to-text review, manual entry) through a unified interface.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    JOURNAL FEATURE                              │
│  (Parent: Holds global/local state, processingEntries Set)     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  VoiceRecorder   │  │ ManualEntryForm  │  │ JournalView  │  │
│  │  (UI Layer)      │  │  (UI Layer)      │  │ (Display)    │  │
│  │                  │  │                  │  │              │  │
│  │  ┌─────────────┐ │  │  ┌────────────┐  │  │ Shows entries│  │
│  │  │ Stop button │ │  │  │Submit btn  │  │  │ w/ "Analyz.."│  │
│  │  │ (Auto)      │ │  │  │            │  │  │              │  │
│  │  └──────┬──────┘ │  │  └────────┬───┘  │  │              │  │
│  │         │        │  │          │      │  │              │  │
│  │  ┌──────▼──────┐ │  │  ┌───────▼───┐  │  │              │  │
│  │  │To Text btn  │ │  │  │AI Analysis│  │  │              │  │
│  │  │(Preview)    │ │  │  │(useAnalyz)│  │  │              │  │
│  │  └──────┬──────┘ │  │  └───────────┘  │  │              │  │
│  └─────────┼────────┘  └──────────────┘  └──────────────┘  │
│           │                                                   │
│           └──────────────────┬──────────────────────────────┘  │
│                              │                                  │
│                    (Callbacks & Props Pass)                    │
│                                                                │
├─────────────────────────────────────────────────────────────────┤
│               ORCHESTRATION HOOKS (Business Logic)             │
│                                                                 │
│  useVoiceAutoSubmit                   useCreateEntryPipeline   │
│  ├─ Stage 1: createDummyEntry         ├─ createDummyEntry    │
│  ├─ Stage 2: transcribeAudio          ├─ updateWithTranscr.  │
│  └─ Stage 3: analyzeVoiceEntry        └─ upsertEntry         │
│                                                                 │
│  useTranscribeAudio (Gemini + fallback)                        │
│                                                                 │
│  useAnalyzeVoiceEntry (AI + state tracking)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Global Store    │
                    │  (IndexedDB)     │
                    │                  │
                    │  journal: {      │
                    │    "2026": {      │
                    │      "February": {│
                    │        "03": {    │
                    │          entries  │
                    │        }          │
                    │      }            │
                    │    }              │
                    │  }                │
                    └──────────────────┘
```

## Three Entry Creation Flows

### Flow 1: Voice Auto-Submit

**UI Path**: VoiceRecorder "Stop" button

**Hook Path**: useVoiceAutoSubmit (Stages 1-3)

```
User Recording Audio
    ↓
Click "Stop" Button
    ↓
VoiceRecorder.stopRecordingAndSubmitAuto()
    ├─ Get audioBlob from MediaRecorder
    └─ Call submitVoiceRecording(audioBlob) hook
        ↓
        useVoiceAutoSubmit ORCHESTRATOR
        │
        ├─ STAGE 1: Create Placeholder
        │  └─ createDummyEntry("🎤 Transcribing...")
        │     ├─ Entry stored immediately
        │     └─ User sees placeholder in journal
        │
        ├─ STAGE 2: Transcribe (await)
        │  └─ useTranscribeAudio(audioBlob)
        │     ├─ Try: Gemini API (official)
        │     ├─ Fallback: Web Speech API text
        │     └─ Update entry with real transcription
        │
        └─ STAGE 3: Analyze (only if Stage 2 succeeded)
           └─ useAnalyzeVoiceEntry(entryId, transcription)
              ├─ Signal: onProcessingStateChange(id, true)
              ├─ Extract skills via AI
              ├─ Calculate experience
              ├─ Update entry
              └─ Signal: onProcessingStateChange(id, false)
                ↓
                Entry Complete with Skills + Results
```

**Total Time**: 3-5 seconds (user sees placeholder immediately)

---

### Flow 2: Voice to-Text Review

**UI Path**: VoiceRecorder "To Text" button → Manual Edit → Submit

**Hook Path**: useVoiceAutoSubmit (N/A) → useCreateEntryPipeline (Stage 1 + 3)

```
User Recording Audio + Real-time Preview
    ↓
Click "To Text" Button
    ↓
VoiceRecorder.handleToTextClick()
    ├─ Stop recording (finalize MediaRecorder)
    └─ Use captured webSpeechText (INSTANT)
        ├─ No API call needed
        └─ Call onToTextReview(webSpeechText) callback
            ↓
            Parent (JournalFeature) handles
            └─ setVoiceTranscriptionText(webSpeechText)
                ↓
                ManualEntryForm receives initialText prop
                ├─ useEffect detects change
                └─ Append text to textarea
                    └─ Text now visible in form
                        ↓
                        User Can Edit
                        ├─ Modify text
                        ├─ Add/remove content
                        └─ Click "Submit" when ready
                            ↓
                            useCreateEntryPipeline
                            │
                            ├─ STAGE 1: Create Placeholder
                            │  └─ createDummyEntry(editedText)
                            │
                            └─ STAGE 3: Analyze Edited Text
                               ├─ Signal: onProcessingStateChange(id, true)
                               ├─ Extract skills from edited content
                               ├─ Calculate experience
                               └─ Signal: onProcessingStateChange(id, false)
                                   ↓
                                   Entry Complete with Skills + Results
```

**Total Time**: < 100 ms for preview + user edit time + 1-2 s for AI

**Advantages**:
- User sees immediately what was captured
- Can edit before AI analysis
- No Gemini API call (faster)
- Better control over final entry

---

### Flow 3: Manual Text Entry

**UI Path**: Type in ManualEntryForm → Click "Submit"

**Hook Path**: useCreateEntryPipeline (Stage 1 + 3)

```
User Types Text
    ↓
Click "Submit" Button
    ↓
ManualEntryForm.onSubmit()
    ├─ Get content from textarea
    ├─ Get duration (or auto-calculate)
    └─ Call useCreateEntryPipeline orchestrator
        │
        ├─ STAGE 1: Create Placeholder
        │  └─ createDummyEntry(typedText)
        │     ├─ Entry stored immediately
        │     └─ User sees placeholder in journal
        │
        └─ STAGE 3: Analyze
           ├─ Signal: onProcessingStateChange(id, true)
           ├─ Extract skills from typed text
           ├─ Calculate experience
           ├─ Update entry with final data
           └─ Signal: onProcessingStateChange(id, false)
               ↓
               Entry Complete with Skills + Results
```

**Total Time**: 1-2 seconds (AI analysis only, no transcription)

---

## Orchestration Hooks: Deep Dive

### useVoiceAutoSubmit (Orchestrator for Voice Flow)

**Purpose**: Coordinate Stages 1-3 sequentially for voice auto-submit.

**File**: `hooks/voice/use-voice-auto-submit.ts`

**API**:
```typescript
const submitVoiceRecording = useVoiceAutoSubmit(
  webSpeechFallback: string,
  setFeedback: (message: string) => void,
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
);

await submitVoiceRecording(audioBlob: Blob): Promise<string>;
```

**Returns**: Entry ID (for tracking)

**Dependencies**:
- `useCreateEntryPipeline` - Stage 1 (create dummy entry)
- `useTranscribeAudio` - Stage 2 (transcription)
- `useAnalyzeVoiceEntry` - Stage 3 (AI analysis)

**Key Logic**:
```typescript
export const useVoiceAutoSubmit = (
  webSpeechFallback,
  setFeedback,
  onProcessingStateChange
) => {
  const { createDummyEntry } = useCreateEntryPipeline();
  const transcribeAudio = useTranscribeAudio(webSpeechFallback, setFeedback);
  const analyzeVoiceEntry = useAnalyzeVoiceEntry(setFeedback, onProcessingStateChange);

  return useCallback(async (audioBlob) => {
    // Stage 1: Placeholder
    console.log('[Stage 1] Creating dummy entry...');
    const entryId = createDummyEntry('🎤 Transcribing...');

    // Stage 2: Transcription (must complete first)
    console.log('[Stage 2] Transcribing audio...');
    const transcription = await transcribeAudio(audioBlob, entryId);

    // Stage 3: Analysis (only if transcription succeeded)
    if (transcription?.trim()) {
      console.log('[Stage 3] Analyzing with AI...');
      await analyzeVoiceEntry(entryId, transcription);
    } else {
      console.error('[Stage 3] Skipped - no valid transcription');
      setFeedback('❌ Could not transcribe audio');
    }

    return entryId;
  }, [createDummyEntry, transcribeAudio, analyzeVoiceEntry, setFeedback]);
};
```

**Why This Pattern**:
- ✅ Sequential execution (Stage 2 awaited before Stage 3)
- ✅ Cascade fallback at Stage 2
- ✅ Processing state visibility via callback
- ✅ Single orchestrator knows complete flow
- ✅ Component stays UI-focused

---

### useTranscribeAudio (Stage 2: Transcription)

**Purpose**: Handle audio transcription with cascade fallback.

**File**: `hooks/voice/use-transcribe-audio.ts`

**API**:
```typescript
const transcribeAudio = useTranscribeAudio(
  webSpeechFallback: string,
  setFeedback: (message: string) => void
);

const transcription = await transcribeAudio(audioBlob: Blob, entryId: string): Promise<string>;
```

**Returns**: Transcription text (or empty string if failed)

**Transcription Strategy**:
```
Try Gemini API
  ├─ Success → Use Gemini transcription ✅
  └─ Fail
      └─ Try Web Speech API (captured text)
          ├─ Success → Use Web Speech ✅ (lower quality)
          └─ Fail → Return empty string ❌
```

**Implementation Logic**:
```typescript
export const useTranscribeAudio = (webSpeechFallback, setFeedback) => {
  return useCallback(async (audioBlob, entryId) => {
    setFeedback('🔄 Transcribing...');

    // Try Gemini (primary)
    try {
      const base64Audio = await convertBlobToBase64(audioBlob);
      const result = await transcribeWebmAudio(base64Audio);
      
      if (result?.trim()) {
        setFeedback('✅ Transcription complete');
        await updateWithTranscription(entryId, result);
        return result;
      }
    } catch (error) {
      console.error('[useTranscribeAudio] Gemini failed:', error);
    }

    // Fallback to Web Speech
    if (webSpeechFallback?.trim()) {
      console.warn('[useTranscribeAudio] Using Web Speech fallback');
      setFeedback('⚠️ Using preview text as fallback');
      await updateWithTranscription(entryId, webSpeechFallback);
      return webSpeechFallback;
    }

    // Both failed
    setFeedback('❌ Transcription failed');
    return '';
  }, [webSpeechFallback, setFeedback]);
};
```

**When Used**:
- Auto-Submit flow (via useVoiceAutoSubmit)
- NOT used by To-Text (uses Web Speech directly)
- NOT used by Manual entry (no audio)

---

### useAnalyzeVoiceEntry (Stage 3: Analysis + State Tracking)

**Purpose**: AI analysis of transcribed text with processing state callbacks.

**File**: `hooks/voice/use-analyze-voice-entry.ts`

**API**:
```typescript
const analyzeVoiceEntry = useAnalyzeVoiceEntry(
  setFeedback: (message: string) => void,
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
);

await analyzeVoiceEntry(entryId: string, transcription: string): Promise<void>;
```

**Key Features**:
1. Processing state callback (for "Analyzing..." UI)
2. AI analysis (extract skills, calculate experience)
3. Entry update with final data

**Implementation Logic**:
```typescript
export const useAnalyzeVoiceEntry = (setFeedback, onProcessingStateChange) => {
  return useCallback(async (entryId, transcription) => {
    // Signal: Start processing
    onProcessingStateChange?.(entryId, true);
    setFeedback('🔄 Analyzing with AI...');

    try {
      // AI analysis (orchestrator handles this)
      const { actions, result } = await analyzeEntryContent(transcription);

      // Update entry with final data
      const updateData = {
        actions,
        result,
        metadata: { flags: { aiAnalyzed: true } }
      };
      
      await updateEntryData(entryId, updateData);
      
      setFeedback('✅ Analysis complete');
    } catch (error) {
      console.error('[useAnalyzeVoiceEntry] Analysis failed:', error);
      setFeedback('❌ Analysis failed');
    } finally {
      // Signal: Processing complete
      onProcessingStateChange?.(entryId, false);
    }
  }, [setFeedback, onProcessingStateChange]);
};
```

**When Used**:
- Auto-Submit (after transcription succeeds)
- Manual Entry (when user submits)
- To-Text Review (when user submits edited text)

---

### useCreateEntryPipeline (Entry Creation API)

**Purpose**: Provide interface for creating/updating entries in global store.

**File**: `hooks/create-entry/use-create-entry-pipeline.ts`

**API**:
```typescript
const {
  createDummyEntry,
  updateWithTranscription,
  upsertEntry
} = useCreateEntryPipeline();

// Create placeholder
const entryId = createDummyEntry(
  content: string,            // What to display
  duration?: string,          // Optional
  dateInfo?: DateInfo         // Auto-generated if undefined
): string;                     // Returns entry ID

// Update with transcription
await updateWithTranscription(
  entryId: string,
  transcription: string,
  updateData?: Partial<JournalEntryData>
): Promise<void>;

// Direct upsert
upsertEntry(
  dateKey: string,            // "2026/February/03/14:30:00.000"
  entryData: JournalEntryData
): void;
```

**Entry ID Format**:
```typescript
// Normalized date key
"2026/February/03/14:30:45.123"
```

**Internal Operations**:

1. **createDummyEntry**:
```typescript
const createDummyEntry = (content, duration, dateInfo) => {
  const dateKey = getNormalizedDate(dateInfo);
  
  const dummyEntry = {
    content,
    actions: {},
    metadata: {
      flags: { aiAnalyzed: false },
      timePosted: new Date().toISOString(),
      duration
    }
  };
  
  upsertEntry(dateKey, dummyEntry);
  return dateKey;  // Entry ID
};
```

2. **updateWithTranscription**:
```typescript
const updateWithTranscription = (entryId, transcription, updateData = {}) => {
  const entry = getEntry(entryId);
  
  const updated = {
    ...entry,
    content: transcription,
    ...updateData
  };
  
  upsertEntry(entryId, updated);
};
```

3. **upsertEntry**:
```typescript
const upsertEntry = (dateKey, entryData) => {
  // Update Zustand store
  journalStore.setState(state => ({
    journal: {
      ...state.journal,
      [dateKey]: entryData
    }
  }));
  
  // Trigger persistence (if configured)
  persistToIndexedDB();
};
```

**When Used**:
- All three flows use Stage 1 (createDummyEntry)
- Auto-Submit uses Stage 2 (updateWithTranscription for transcription)
- Voice Review & Manual use custom updateWithTranscription

---

## Processing State Callback Pattern

### Why Needed

During AI analysis (Stage 3), users need to know the entry is processing. Without visual feedback, they might think the app froze.

### Implementation

**1. Parent State** (JournalFeature):
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

**2. Pass to Child**:
```typescript
<VoiceRecorder onProcessingStateChange={handleProcessingStateChange} />
<ManualEntryForm onProcessingStateChange={handleProcessingStateChange} />
```

**3. Hook Uses Callback**:
```typescript
// In useAnalyzeVoiceEntry
onProcessingStateChange?.(entryId, true);  // Start
// ... AI analysis ...
onProcessingStateChange?.(entryId, false); // Complete
```

**4. Display Uses State**:
```typescript
// In journal-entry-item.tsx
if (processingEntries.has(entryId)) {
  return <button disabled>Analyzing...</button>;
}
```

**Data Flow**:
```
Stage 3 Starts
    ├─ onProcessingStateChange(entryId, true) ← Hook calls
    │   ├─ Parent receives callback
    │   ├─ Parent updates state: processingEntries.add(entryId)
    │   └─ Parent re-renders all children with new state
    │
    ├─ All children re-render
    │   ├─ JournalEntryItem checks if entryId in processingEntries
    │   └─ Yes → Display "Analyzing..." button
    │
Stage 3 Ends
    ├─ onProcessingStateChange(entryId, false) ← Hook calls
    │   ├─ Parent receives callback
    │   ├─ Parent updates state: processingEntries.delete(entryId)
    │   └─ Parent re-renders all children with new state
    │
    └─ All children re-render
        └─ JournalEntryItem: "Analyzing..." button now hidden
```

---

## Error Handling Strategy

### Stage 1 Errors (Create Placeholder)
- **Rare**: Entry ID generation or store access issue
- **Recovery**: Show error, don't proceed to Stage 2
- **User Impact**: Entry not created

### Stage 2 Errors (Transcription)
- **Common**: Gemini API timeout or rate limit
- **Recovery**: Cascade to Web Speech API fallback
- **User Impact**: Lower accuracy transcription (but entry still created)

### Stage 3 Errors (AI Analysis)
- **Occasional**: AI analysis fails or timeout
- **Recovery**: Keep entry with transcription (no skills/results)
- **User Impact**: Entry created but no performance data

### Cascade Fallback Example
```typescript
Stage 2: Transcribe
├─ Try Gemini API
│   ├─ Success → Entry updated with Gemini text ✅
│   └─ Fail (timeout/quota)
│       └─ Try Web Speech API
│           ├─ Success → Entry updated with Web Speech text ⚠️
│           └─ Fail → Entry stays with placeholder ❌
```

---

## Related Documentation

- [Features: Journal](features-journal.md) - Journal feature overview
- [Features: Voice Recorder](features-voice-recorder.md) - Voice recorder details
- [State Management](../state-management/state-management-README.md) - State patterns
- [Architecture](../architecture/architecture.md) - System overview
