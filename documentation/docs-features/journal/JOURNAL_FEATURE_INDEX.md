# Journal Feature Documentation Index

**Updated**: 2026-02-03 - Complete documentation for voice recording, entry creation, and AI analysis

Welcome! This is the comprehensive documentation for the Journal feature. Start here to find what you need.

## 📚 Documentation Map

### For Quick Overview
- **[JOURNAL_QUICK_REFERENCE.md](JOURNAL_QUICK_REFERENCE.md)** ⭐ START HERE
  - TL;DR summary of all three entry flows
  - Quick reference tables and code snippets
  - Common issues & solutions
  - Perfect for getting oriented quickly

### For Main Feature Understanding
- **[features-journal.md](features-journal.md)** - Main Feature Documentation
  - Journal entry schema (data structure)
  - Architecture overview (three flows)
  - Store architecture (global vs local state)
  - Performance tracking & AI analysis
  - Integration points & usage examples
  - Troubleshooting guide
  - **Read this for**: Understanding the big picture

### For Voice Recording Details
- **[features-voice-recorder.md](features-voice-recorder.md)** - Voice Recorder Architecture
  - Voice recording component internals
  - Three orchestration hooks (atomic architecture)
  - Web Speech API integration
  - Processing state tracking
  - Edge cases & debugging
  - **Read this for**: How voice recording works, Web Speech, real-time preview

### For Entry Creation Pipeline
- **[features-entry-pipeline.md](features-entry-pipeline.md)** - Orchestration Pattern
  - Complete visual flowcharts for all three flows
  - Deep dive into each hook (useVoiceAutoSubmit, useTranscribeAudio, useAnalyzeVoiceEntry)
  - Entry creation pipeline stages (1-3)
  - Processing state callback pattern
  - Error handling & cascade fallback
  - **Read this for**: How entries are created, hook orchestration, data flow

---

## 🎯 Reading Paths by Role

### I'm a New Developer
1. Read **JOURNAL_QUICK_REFERENCE.md** (5 min)
2. Skim **features-journal.md** § Architecture Overview (10 min)
3. Read **features-voice-recorder.md** § Quick Overview (10 min)
4. Explore code in `src/features/journal/components/` and `src/features/journal/hooks/voice/`

### I'm Debugging a Voice Issue
1. Check **JOURNAL_QUICK_REFERENCE.md** § Common Issues (2 min)
2. Check **features-journal.md** § Troubleshooting (5 min)
3. Check **features-voice-recorder.md** § Debugging Tips (5 min)
4. Enable console logs and trace the issue

### I'm Adding a Feature
1. Read **features-entry-pipeline.md** § Orchestration Hooks (20 min)
2. Check **features-journal.md** § API Layer (10 min)
3. Identify which hook to extend or which flow to modify
4. Reference the flow diagrams in **features-entry-pipeline.md**

### I'm Troubleshooting Processing State
1. Check **JOURNAL_QUICK_REFERENCE.md** § "Analyzing... doesn't disappear" (1 min)
2. Read **features-voice-recorder.md** § Processing State Tracking (10 min)
3. Read **features-entry-pipeline.md** § Processing State Callback Pattern (10 min)
4. Check parent component has `processingEntries` state wired correctly

### I Need to Understand the Entire System
1. Start with **JOURNAL_QUICK_REFERENCE.md** (5 min)
2. Read **features-journal.md** § Architecture Overview + Data Flow (15 min)
3. Read **features-voice-recorder.md** (25 min)
4. Read **features-entry-pipeline.md** (30 min)
5. Explore code in `src/features/journal/`

---

## 🔑 Key Concepts Quick Links

### Entry Creation Flows
- **Auto-Submit**: Voice → Automatic (Stop button) — [features-entry-pipeline.md](features-entry-pipeline.md#flow-1-voice-auto-submit)
- **To-Text Review**: Voice → Preview → Edit → Submit (To Text button) — [features-entry-pipeline.md](features-entry-pipeline.md#flow-2-voice-to-text-review)
- **Manual Entry**: Type → Submit (Manual form) — [features-entry-pipeline.md](features-entry-pipeline.md#flow-3-manual-entry)

### Orchestration Hooks
- **useVoiceAutoSubmit**: Coordinates Stages 1-3 — [features-entry-pipeline.md](features-entry-pipeline.md#usevoiceautosubmit-orchestrator-for-voice-flow)
- **useTranscribeAudio**: Handles transcription with fallback — [features-entry-pipeline.md](features-entry-pipeline.md#usetranscribeaudio-stage-2-transcription)
- **useAnalyzeVoiceEntry**: AI analysis + state tracking — [features-entry-pipeline.md](features-entry-pipeline.md#useanalyzeevoiceentry-stage-3-analysis--state-tracking)
- **useCreateEntryPipeline**: Entry creation API — [features-entry-pipeline.md](features-entry-pipeline.md#usecreatentrypipeline-entry-creation-api)

### Web Speech API
- **What it is**: Real-time browser speech recognition — [features-voice-recorder.md](features-voice-recorder.md#webspeechpreview-component)
- **How it's used**: To-Text preview + auto-submit fallback — [features-voice-recorder.md](features-voice-recorder.md#uses-of-web-speech-text)
- **Why not Gemini**: Speed - Web Speech is instant for preview — [JOURNAL_QUICK_REFERENCE.md](JOURNAL_QUICK_REFERENCE.md)

### Processing State Tracking
- **Why needed**: Visual feedback during AI analysis — [features-entry-pipeline.md](features-entry-pipeline.md#why-needed)
- **How it works**: Parent Set + callback pattern — [features-entry-pipeline.md](features-entry-pipeline.md#implementation)
- **Data flow**: From hook to parent to display — [features-entry-pipeline.md](features-entry-pipeline.md#data-flow)

### Entry Schema
- **Structure**: What data is stored — [features-journal.md](features-journal.md#current-structure-v2---user-centric)
- **Examples**: Real entry data — [features-journal.md](features-journal.md#examples)

---

## 📁 File Locations

### Components
```
src/features/journal/components/
├─ journal-feature.tsx              # Parent component & state
├─ voice-recorder/
│  ├─ voice-recorder.tsx            # Audio capture UI (3 buttons)
│  ├─ audio-visualization.tsx       # Frequency visualization
│  ├─ web-speech-preview.tsx        # Web Speech API integration
│  └─ index.ts                      # Re-exports
├─ manual-entry-form.tsx            # Text entry form
├─ textonly-manual-entry-form.tsx   # Lightweight inline form
├─ journal-view.tsx                 # Display entries
├─ journal-entry-item/              # Entry display + results
│  ├─ journal-entry-item.tsx
│  ├─ entry-results.tsx
│  └─ index.ts
└─ index.ts                         # Component exports
```

### Hooks (Orchestration)
```
src/features/journal/hooks/
├─ voice/
│  ├─ use-voice-auto-submit.ts      # Stages 1-3 orchestrator
│  ├─ use-transcribe-audio.ts       # Stage 2: Transcription
│  ├─ use-analyze-voice-entry.ts    # Stage 3: AI analysis
│  └─ index.ts                      # Re-exports
├─ create-entry/
│  ├─ use-create-entry-pipeline.ts  # Stage 1 + API
│  └─ index.ts                      # Re-exports
└─ index.ts                         # Hook exports
```

### Documentation
```
documentation/docs-features/
├─ features-journal.md              # Main feature docs
├─ features-voice-recorder.md       # Voice architecture (NEW)
├─ features-entry-pipeline.md       # Pipeline orchestration (NEW)
├─ JOURNAL_QUICK_REFERENCE.md       # Quick ref (NEW)
└─ JOURNAL_FEATURE_INDEX.md         # This file (NEW)
```

---

## 🔄 Three Submission Flows at a Glance

### Flow 1: Auto-Submit (Stop Button)
```
Record → Stop → Transcribe (Gemini) → AI Analyze → Entry Created
```
- Time: 3-5 seconds
- Quality: Excellent
- Best for: Quick logging

### Flow 2: To-Text Review (To Text Button)
```
Record → To Text → Preview (Web Speech) → Edit → Submit → Entry Created
```
- Time: Instant preview + user edit time
- Quality: Good
- Best for: Review before submit

### Flow 3: Manual Entry (Type & Submit)
```
Type → Submit → AI Analyze → Entry Created
```
- Time: 1-2 seconds
- Quality: Excellent
- Best for: No audio available

---

## 🚀 Getting Started

### To Use the Journal Feature
```typescript
import { JournalFeature } from '@/features/journal';

function App() {
  return (
    <JournalFeature 
      onIntegrationEvent={handleIntegration}
    />
  );
}
```

### To Access Journal Data
```typescript
import { useAppDataStore } from '@/stores/app-data';

function MyComponent() {
  const appData = useAppDataStore((state) => state.appData);
  const allEntries = appData.journal;
}
```

### To Debug
1. Enable console logs: Filter by `[VoiceRecorder]`, `[useVoiceAutoSubmit]`, etc.
2. Check processing state in React DevTools
3. Check browser microphone permissions
4. Verify Gemini API key is set

---

## ✅ Verification Checklist

Before starting, verify:
- ✅ All three submission buttons appear in VoiceRecorder
- ✅ Web Speech preview text appears while recording
- ✅ Auto-Submit creates entry and shows "Analyzing..." state
- ✅ To-Text button appends to manual form
- ✅ Manual entry form submits with AI analysis
- ✅ Processing state clears after analysis completes

---

## 📞 Common Questions

**Q: How do I disable To-Text button?**  
A: Set `webSpeechText` state to empty string in VoiceRecorder

**Q: Can I use only Gemini (no Web Speech)?**  
A: To-Text wouldn't work, but Auto-Submit would. Edit `handleToTextClick` to use Gemini API instead

**Q: What if Gemini API fails?**  
A: Cascade fallback to Web Speech API. Entry still created with lower accuracy

**Q: How do I show entry is processing?**  
A: Parent uses `processingEntries` Set from `onProcessingStateChange` callback

**Q: Can I extend the three flows?**  
A: Yes! Create new submission flow by:
  1. Creating new handler in VoiceRecorder or ManualEntryForm
  2. Using `useCreateEntryPipeline` or `useVoiceAutoSubmit` hooks
  3. Wiring up `onProcessingStateChange` callback

---

## 📖 External References

- [Voice Recorder Architecture](features-voice-recorder.md) - Detailed voice recording guide
- [Entry Pipeline Orchestration](features-entry-pipeline.md) - Complete flow documentation
- [Main Journal Features](features-journal.md) - Feature overview
- [Quick Reference](JOURNAL_QUICK_REFERENCE.md) - TL;DR summary

---

## 🔄 Documentation Updates

| Date | Update |
|------|--------|
| 2026-02-03 | Created comprehensive voice architecture docs, quick reference, and pipeline orchestration guide |
| 2026-02-03 | Updated main features-journal.md with current architecture |
| 2026-02-02 | Previous updates to entry pipeline and processing state |

---

**Ready to start?** Pick a documentation file above based on your needs!
