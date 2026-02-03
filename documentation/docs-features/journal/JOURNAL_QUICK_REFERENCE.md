# Journal Feature: Quick Reference Guide

**Last updated**: 2026-02-03 - Complete voice integration with atomic hooks

TL;DR - Three ways to create journal entries, all with AI analysis and experience tracking.

## Three Entry Creation Flows at a Glance

| Flow | Trigger | Speed | Quality | Use Case |
|------|---------|-------|---------|----------|
| **Auto-Submit** | Click "Stop" button | 3-5s | Excellent (Gemini) | Quick logging of major activities |
| **To-Text Review** | Click "To Text" button | Instant | Good (Web Speech) | Quick preview, then edit & submit |
| **Manual Entry** | Type + Click "Submit" | 1-2s | Excellent (AI) | When typing is faster |

## Component Structure

```
VoiceRecorder (Audio capture UI)
├─ Stop button → Auto-Submit flow
├─ To Text button → Review flow
└─ AudioVisualization + WebSpeechPreview (display)

ManualEntryForm (Text input UI)
└─ Submit button → AI analysis

JournalView (Display)
└─ Shows entries with processing state
```

## Hook Structure

```
useVoiceAutoSubmit (Orchestrator)
├─ useCreateEntryPipeline (Stage 1: Create placeholder)
├─ useTranscribeAudio (Stage 2: Gemini + Web Speech fallback)
└─ useAnalyzeVoiceEntry (Stage 3: AI analysis + state tracking)

useCreateEntryPipeline (Direct API for manual flow)
└─ Called directly by ManualEntryForm + To-Text flow
```

## State Management

### Parent (JournalFeature)
```typescript
const [processingEntries, setProcessingEntries] = useState<Set<string>>(new Set());
const handleProcessingStateChange = (entryId, isProcessing) => { /* ... */ };
```

### Child (VoiceRecorder, ManualEntryForm)
- Pass `onProcessingStateChange` callback to hooks
- Hooks call it during AI analysis (Stage 3)

### Display (JournalView, JournalEntryItem)
- Receive `processingEntries` Set from parent
- Show "Analyzing..." when entry ID in Set

## Data Flow Quick View

### Auto-Submit (Voice → Automatic Entry)
```
User records audio
    ↓
Click "Stop"
    ↓
Stage 1: Create placeholder (🎤 Transcribing...)
    ↓
Stage 2: Transcribe audio (Gemini → Web Speech fallback)
    ↓
Stage 3: AI analysis + experience
    ↓
Entry complete with skills & results
```

### To-Text Review (Voice → Preview → Edit → Submit)
```
User records audio
    ↓
Click "To Text"
    ↓
Use Web Speech preview text (INSTANT, no API)
    ↓
Append to manual form
    ↓
User edits text
    ↓
Click "Submit"
    ↓
Stage 1: Create placeholder with edited text
    ↓
Stage 3: AI analysis on edited text
    ↓
Entry complete
```

### Manual Entry (Type → Submit)
```
User types text
    ↓
Click "Submit"
    ↓
Stage 1: Create placeholder
    ↓
Stage 3: AI analysis
    ↓
Entry complete
```

## Web Speech API Usage

**Two Uses**:
1. **To-Text Button**: Uses Web Speech text directly (instant preview, no Gemini API)
2. **Auto-Submit Fallback**: If Gemini fails, use Web Speech as backup

**Quality Trade-off**:
- Web Speech: Good quality, immediate feedback
- Gemini: Excellent quality, 1-3s latency
- To-Text: Uses Web Speech (fast preview)
- Auto-Submit: Uses Gemini primarily (accurate transcription)

## Common Issues & Solutions

### "No text captured from Web Speech"
→ Try Auto-Submit instead (uses Gemini)

### Entry shows "🎤 Transcribing..." forever
→ Check network, Gemini API key, or use To-Text

### "Analyzing..." doesn't disappear
→ Verify processing state callback is wired correctly

### Microphone permission denied
→ Check browser permissions, reload page, or use manual entry

## File Locations

```
Voice Components:
├─ src/features/journal/components/voice-recorder/
├─ src/features/journal/components/manual-entry-form.tsx

Voice Hooks:
├─ src/features/journal/hooks/voice/
│  ├─ use-voice-auto-submit.ts (orchestrator)
│  ├─ use-transcribe-audio.ts (Stage 2)
│  └─ use-analyze-voice-entry.ts (Stage 3)

Entry Pipeline:
├─ src/features/journal/hooks/create-entry/
│  └─ use-create-entry-pipeline.ts (Stage 1 + API)

Parent Component:
├─ src/features/journal/components/journal-feature.tsx
```

## Key Concepts

### Orchestration Pattern
- Single orchestrator hook (useVoiceAutoSubmit) knows complete flow
- Delegates to specialized hooks for each stage
- Component stays UI-focused

### Sequential Execution
- Stage 2 (transcription) waits for completion before Stage 3
- Ensures AI never analyzes placeholder text
- Guarantees data consistency

### Processing State Tracking
- Parent maintains Set of processing entry IDs
- Children call callback to update state
- Display uses state to show "Analyzing..." indicators

### Cascade Fallback
- Transcription tries Gemini first, falls back to Web Speech
- Ensures entries can be created even if API fails
- Trade-off: Lower accuracy vs no entry

### Optimistic UI Updates
- Entry displayed immediately with placeholder
- Processing happens in background
- UI progressively enhanced when complete

## API Quick Reference

### useVoiceAutoSubmit
```typescript
const submitVoiceRecording = useVoiceAutoSubmit(webSpeechFallback, setFeedback, onProcessingStateChange);
await submitVoiceRecording(audioBlob);  // Returns entryId
```

### useTranscribeAudio
```typescript
const transcribeAudio = useTranscribeAudio(webSpeechFallback, setFeedback);
const text = await transcribeAudio(audioBlob, entryId);
```

### useAnalyzeVoiceEntry
```typescript
const analyzeVoiceEntry = useAnalyzeVoiceEntry(setFeedback, onProcessingStateChange);
await analyzeVoiceEntry(entryId, transcription);
```

### useCreateEntryPipeline
```typescript
const { createDummyEntry, updateWithTranscription, upsertEntry } = useCreateEntryPipeline();
const entryId = createDummyEntry(content, duration, dateInfo);
await updateWithTranscription(entryId, transcription, updateData);
upsertEntry(dateKey, entryData);
```

## Debugging Commands

### Check Web Speech API
```typescript
const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
console.log('Web Speech available:', !!recognition);
```

### View Processing State
- Open React DevTools → Select JournalFeature
- View props → Look for `processingEntries` Set
- Entry IDs in Set are currently processing

### Enable Console Logs
- Filter by `[VoiceRecorder]`, `[useVoiceAutoSubmit]`, `[useTranscribeAudio]`, `[useAnalyzeVoiceEntry]`
- Full flow visible in console

## Performance Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| To-Text button click | < 100ms | Uses Web Speech, no API |
| Gemini transcription | 1-3s | Depends on audio length |
| AI analysis | 1-2s | Depends on text length |
| Total auto-submit | 3-5s | Optimistic update at start |
| Total manual entry | 1-2s | AI analysis only |

## Next Steps

- **Want details?** Read [Voice Recorder Architecture](features-voice-recorder.md)
- **Deep dive on flows?** Read [Entry Pipeline: Orchestration Pattern](features-entry-pipeline.md)
- **Main overview?** Read [Features: Journal](features-journal.md)
- **State patterns?** Read [State Management](../state-management/state-management-README.md)
