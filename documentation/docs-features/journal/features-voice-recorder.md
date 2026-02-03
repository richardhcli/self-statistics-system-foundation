# Voice Recorder Architecture

**Last updated**: 2026-02-03 - Refactored to atomic hooks with Web Speech integration

The voice recorder is a sophisticated audio capture system with three independent submission flows and real-time preview. It uses sequential processing with orchestration hooks for clean separation of concerns.

## Quick Overview

**Three Submission Flows**:
1. **Stop Button** → Auto-Submit (Gemini transcription + AI analysis)
2. **To Text Button** → Review (Web Speech preview → manual edit → submit)
3. **Clear Button** → Reset and try again

**Real-Time Features**:
- Audio level visualization (Canvas-based frequency analysis)
- Web Speech API preview (live transcription feedback)
- Per-entry processing state tracking ("Analyzing..." indicators)

**Sequential Processing**:
- Stage 1: Create placeholder entry immediately
- Stage 2: Transcribe audio (Gemini → Web Speech fallback)
- Stage 3: AI analysis (only on real text, never placeholder)

## Component Hierarchy

```
VoiceRecorder (UI Layer)
├─ AudioVisualization (modular)
│  └─ Canvas frequency visualization
├─ WebSpeechPreview (modular)
│  └─ Real-time Web Speech capture
└─ State & Handlers
   └─ isRecording, webSpeechText, recordingTime

useVoiceAutoSubmit (Orchestrator Hook)
├─ useCreateEntryPipeline (Stage 1)
│  └─ Create dummy entry
├─ useTranscribeAudio (Stage 2)
│  ├─ Gemini API (primary)
│  └─ Web Speech API (fallback)
└─ useAnalyzeVoiceEntry (Stage 3)
   ├─ AI analysis
   └─ Processing state callback
```

## Entry Creation Flows in Detail

### Flow 1: Auto-Submit (Stop Button)

**User Action**: Click "Stop" button after recording

**Step-by-step**:
```
1. VoiceRecorder.stopRecordingAndSubmitAuto()
   ├─ Call stopRecording() → get audioBlob
   └─ Call submitVoiceRecording(audioBlob)

2. useVoiceAutoSubmit STAGE 1
   ├─ Create dummy entry
   ├─ Content: "🎤 Transcribing..."
   ├─ Store updated immediately
   └─ User sees placeholder in journal

3. useVoiceAutoSubmit STAGE 2 (await)
   ├─ Try: transcribeWebmAudio(audioBlob) → Gemini API
   ├─ If fails: Use webSpeechText (captured during recording)
   ├─ Entry content updated with transcription
   └─ Store updated with real text

4. useVoiceAutoSubmit STAGE 3 (only if Stage 2 succeeded)
   ├─ Call onProcessingStateChange(entryId, true)
   ├─ Analyze text → extract skills, calculate experience
   ├─ Call onProcessingStateChange(entryId, false)
   └─ Entry fully populated with actions and results

5. Result
   ├─ Entry created with transcribed content
   ├─ Skills/actions extracted
   ├─ Experience calculated and applied
   └─ User sees complete entry in journal
```

**Processing Time**: 3-5 seconds total (optimistic update at start)

---

### Flow 2: To-Text Review (To Text Button)

**User Action**: Click "To Text" button during or after recording

**Step-by-step**:
```
1. VoiceRecorder.handleToTextClick()
   ├─ Call stopRecording() to finalize MediaRecorder
   └─ No API call (immediate)

2. Use captured webSpeechText from real-time preview
   ├─ Text was captured during recording
   ├─ No transcription API needed
   └─ Quality: Good for preview, may be less accurate than Gemini

3. VoiceRecorder calls onToTextReview(webSpeechText) callback
   └─ Callback passed from parent component

4. Parent (JournalFeature) handles callback
   └─ setVoiceTranscriptionText(webSpeechText)

5. ManualEntryForm receives initialText prop
   ├─ useEffect detects change
   ├─ Appends text to existing textarea content
   │  └─ setContent(prev => `${prev.trim()} ${initialText}`)
   └─ User sees transcribed text in form

6. User edits text in textarea
   └─ Can modify, add, or remove content

7. User clicks "Submit" button
   ├─ Call useCreateEntryPipeline orchestrator
   ├─ Stage 1: Create dummy entry with edited text
   ├─ Stage 2: N/A (text already provided)
   └─ Stage 3: AI analysis on edited text

8. Result
   ├─ Entry created with user-edited content
   ├─ Skills/actions extracted via AI
   ├─ Experience calculated
   └─ User has full control over content before submission
```

**Processing Time**: < 100 ms for preview (instant)

---

### Flow 3: Manual Entry (Type & Submit)

**User Action**: Type text directly in manual entry form, click "Submit"

**Step-by-step**:
```
1. ManualEntryForm receives user typing
   └─ Text updates in textarea via onChange

2. Optional: User specifies duration override
   └─ Default: Auto-calculated from entry time

3. User clicks "Submit" button
   ├─ Call useCreateEntryPipeline orchestrator
   ├─ Stage 1: Create dummy entry with typed text
   ├─ Stage 2: N/A (text already provided)
   └─ Stage 3: AI analysis on typed text

4. Processing state tracking
   ├─ Call onProcessingStateChange(entryId, true)
   ├─ Show "Analyzing..." button state
   └─ Disable form during processing

5. Result
   ├─ Entry created with typed content
   ├─ Skills/actions extracted
   ├─ Experience calculated
   └─ Form cleared for next entry
```

**Processing Time**: 1-2 seconds (AI analysis only)

## Voice Orchestration Hooks

### useVoiceAutoSubmit (Orchestrator)

**Purpose**: Coordinate Stages 1-3 sequentially for voice auto-submit flow.

**Signature**:
```typescript
const submitVoiceRecording = useVoiceAutoSubmit(
  webSpeechFallback: string,                                    // Web Speech text
  setFeedback: (message: string) => void,                       // UI feedback
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
);

await submitVoiceRecording(audioBlob);
```

**Implementation**:
```typescript
async function submitVoiceRecording(audioBlob: Blob) {
  // Stage 1
  const entryId = createDummyEntry('🎤 Transcribing...');
  
  // Stage 2 (await)
  const transcription = await transcribeAudio(audioBlob, entryId);
  
  // Stage 3 (only if transcription succeeded)
  if (transcription?.trim()) {
    await analyzeVoiceEntry(entryId, transcription);
  }
  
  return entryId;
}
```

**Why Orchestrator Pattern**:
- Centralized voice logic (not scattered across components)
- Sequential execution guarantees
- Clear separation: Component (UI) vs Hook (Orchestration)
- Easy to test and maintain

---

### useTranscribeAudio (Stage 2)

**Purpose**: Handle audio transcription with cascade fallback strategy.

**Signature**:
```typescript
const transcribeAudio = useTranscribeAudio(
  webSpeechFallback: string,              // Fallback text
  setFeedback: (message: string) => void  // UI feedback
);

const transcription = await transcribeAudio(audioBlob, entryId);
```

**Transcription Strategy**:
```
Try Gemini API
  ├─ Success: Use Gemini transcription (official)
  ├─ Fail: Fall back to Web Speech
  │   └─ Success: Use Web Speech text
  │       └─ Note: Less accurate, but available
  └─ Fail: Return empty string + error feedback
```

**When Used**:
- Auto-Submit flow only (via `useVoiceAutoSubmit` Stage 2)
- To-Text does NOT use this (uses Web Speech directly for speed)
- Manual entry does NOT use this (text already provided)

---

### useAnalyzeVoiceEntry (Stage 3)

**Purpose**: AI analysis of transcribed text with processing state tracking.

**Signature**:
```typescript
const analyzeVoiceEntry = useAnalyzeVoiceEntry(
  setFeedback: (message: string) => void,
  onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
);

await analyzeVoiceEntry(entryId, transcription);
```

**What It Does**:
1. Call `onProcessingStateChange(entryId, true)` → parent shows "Analyzing..."
2. Extract skills/actions from transcribed text
3. Calculate experience propagation through graph
4. Update entry with final data
5. Call `onProcessingStateChange(entryId, false)` → parent clears "Analyzing..."

**When Used**:
- Auto-Submit flow (after Stage 2 succeeds)
- Manual entry submit (when user clicks "Submit")
- To-Text flow (when user clicks "Submit" on edited text)

---

### useCreateEntryPipeline (Stage 1)

**Purpose**: Create entry placeholders and manage store updates.

**Signature**:
```typescript
const { createDummyEntry, updateWithTranscription, upsertEntry } = useCreateEntryPipeline();

// Create placeholder
const entryId = createDummyEntry(
  content: string,            // "🎤 Transcribing..." or user text
  duration?: string,          // Optional
  dateInfo?: DateInfo         // Auto-generated if undefined
);

// Update after transcription (Stage 2)
await updateWithTranscription(entryId, transcription, updateData);

// Direct entry update
upsertEntry(dateKey, entryData);
```

**Entry Storage Format**:
```typescript
// After Stage 1 (placeholder)
{
  content: "🎤 Transcribing...",
  actions: {},
  metadata: {
    flags: { aiAnalyzed: false },
    timePosted: "2026-02-03T14:30:00Z",
    duration: undefined
  }
}

// After Stage 3 (complete)
{
  content: "Spent time debugging authentication system",
  actions: { "Debugging": 0.8, "System design": 0.2 },
  result: {
    levelsGained: 2,
    totalExpIncrease: 45.3,
    nodeIncreases: { "Debugging": 18.2, "Software engineering": 15.1 }
  },
  metadata: {
    flags: { aiAnalyzed: true },
    timePosted: "2026-02-03T14:30:00Z",
    duration: "120"
  }
}
```

## Web Speech API Integration

### WebSpeechPreview Component

**Purpose**: Capture real-time Web Speech preview during recording.

**Features**:
- Continuous listening during recording
- Captures final + interim results
- Non-blocking (doesn't interfere with MediaRecorder)
- Updates parent via callback

**Implementation**:
```typescript
<WebSpeechPreview
  isRecording={isRecording}
  onPreviewChange={(text) => setWebSpeechText(text)}
/>
```

**Lifecycle**:
```
Mount → isRecording = true
├─ Start Web Speech listener
└─ onPreviewChange fires as user speaks

Update → Text received
└─ setWebSpeechText(newText) in parent

Unmount or isRecording = false
├─ Stop Web Speech listener
└─ Clean up resources
```

### Uses of Web Speech Text

**1. To-Text Button (Primary)**
- User clicks "To Text"
- Use captured `webSpeechText` directly (instant, no API)
- Append to manual form
- User edits before submitting

**2. Auto-Submit Fallback (Secondary)**
- Gemini API fails or times out
- Fall back to captured `webSpeechText`
- Proceed with AI analysis on fallback text
- Entry created with less accurate transcription

**Quality Trade-offs**:
| Scenario | Accuracy | Speed | Use Case |
|----------|----------|-------|----------|
| To-Text (Web Speech) | Good | Instant | Preview/review |
| Auto-Submit (Gemini) | Excellent | 1-3s | Official entry |
| Auto-Submit (Web Speech fallback) | Good | < 100ms | API failure |

## Processing State Tracking

### Architecture

```
Parent (JournalFeature)
├─ State: processingEntries = Set<string>
├─ Handler: onProcessingStateChange(entryId, isProcessing)
└─ Pass to children via props

Child 1: VoiceRecorder
├─ Receives: onProcessingStateChange callback
└─ Passes to: useVoiceAutoSubmit hook

Child 2: ManualEntryForm
├─ Receives: onProcessingStateChange callback
└─ Passes to: useAnalyzeVoiceEntry hook

Child 3: JournalEntryItem
├─ Receives: processingEntries Set from parent
└─ Displays: "Analyzing..." when entryId in Set
```

### Implementation

**Parent State**:
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

**Hook Callback (Stage 3)**:
```typescript
// In useAnalyzeVoiceEntry
onProcessingStateChange?.(entryId, true);  // Start
// ... AI analysis ...
onProcessingStateChange?.(entryId, false); // Complete
```

**Display Logic (Child)**:
```typescript
// In journal-entry-item.tsx
if (processingEntries.has(entryId)) {
  return <button disabled>Analyzing...</button>;
}
```

## Common Patterns

### Pattern 1: Cascade Fallback
Used for transcription to ensure robustness:
```typescript
try {
  const result = await geminiTranscribe(audio);
  return result; // Success
} catch (error) {
  // Fallback to Web Speech
  if (webSpeechText?.trim()) {
    return webSpeechText;
  }
  // Both failed
  throw new Error('No transcription available');
}
```

### Pattern 2: Sequential Processing
Ensures each stage completes before next:
```typescript
// Stage 1 (immediate)
const entryId = createDummyEntry(placeholder);

// Stage 2 (await)
const transcription = await transcribeAudio(audio);

// Stage 3 (only if Stage 2 succeeded)
if (transcription?.trim()) {
  await analyzeVoiceEntry(entryId, transcription);
}
```

### Pattern 3: Processing State Tracking
Provides visual feedback during async operations:
```typescript
// Before processing
onProcessingStateChange?.(entryId, true);

// During processing
const result = await complexOperation();

// After processing
onProcessingStateChange?.(entryId, false);
```

## Edge Cases & Solutions

### Edge Case 1: No audio captured
**Cause**: User clicks Stop immediately without speaking.

**Solution**:
```typescript
const audioBlob = await stopRecording();
if (!audioBlob || audioBlob.size === 0) {
  setUserFeedback('⚠️ No audio recorded');
  return;
}
```

### Edge Case 2: Web Speech text empty in To-Text button
**Cause**: No interim results captured, or browser doesn't support Web Speech.

**Solution**:
```typescript
if (!webSpeechText?.trim()) {
  setUserFeedback('❌ No text captured from Web Speech');
  alert('No text was captured. Try Auto-Submit instead.');
  return;
}
```

### Edge Case 3: Gemini API fails, Web Speech not available
**Cause**: API rate limit or network error, plus Web Speech API unavailable.

**Solution**:
```typescript
if (!transcription?.trim()) {
  setUserFeedback('❌ Could not transcribe audio');
  // Stage 3 skipped, entry remains with placeholder
  // User can manually edit the placeholder entry
}
```

### Edge Case 4: Recording exceeds max duration
**Cause**: User records for > 60 seconds.

**Solution**:
```typescript
const timerRef = useRef<NodeJS.Timeout | null>(null);

timerRef.current = setInterval(() => {
  setRecordingTime(prev => {
    if (prev >= 60) {
      stopRecordingAndSubmitAuto();
      return 0;
    }
    return prev + 1;
  });
}, 1000);
```

## Debugging Tips

### Enable Console Logging
All components and hooks use prefixed console logs:
```typescript
console.log('[VoiceRecorder] Starting recording...');
console.log('[useVoiceAutoSubmit] Stage 1: Creating dummy entry...');
console.log('[useTranscribeAudio] Attempting Gemini transcription...');
console.log('[useAnalyzeVoiceEntry] Beginning AI analysis...');
```

**View logs**: Open browser DevTools console and filter by the component name.

### Check Processing State
In browser DevTools React tab:
1. Select JournalFeature component
2. View props, look for `processingEntries` Set
3. Entry IDs in the Set are currently processing

### Verify Web Speech API
In browser console:
```typescript
const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
console.log('Web Speech API available:', !!recognition);
```

### Monitor Gemini API
Enable API logging:
```typescript
// In environment setup
VITE_DEBUG_GEMINI=true
```

## Related Documentation

- [Features: Journal](features-journal.md) - Main journal feature overview
- [State Management](../state-management/ORCHESTRATOR_PATTERN.md) - State patterns
- [Architecture](../architecture/architecture.md) - System architecture
- [AI and Gamification](../ai-and-gamification.md) - AI analysis pipeline
