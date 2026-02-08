# Voice Recorder (Journal)

**Updated**: 2026-02-07

## Role
UI-only recorder that delegates all entry creation to the unified pipeline.

## Primary File
- [src/features/journal/components/voice-recorder/voice-recorder.tsx](../../../src/features/journal/components/voice-recorder/voice-recorder.tsx)

## Flow Summary
- **Stop**: audio -> pipeline (transcribe + analyze)
- **To Text**: Web Speech preview -> manual edit -> submit

## Dependencies
- Unified pipeline: [src/features/journal/hooks/use-journal-entry-pipeline.ts](../../../src/features/journal/hooks/use-journal-entry-pipeline.ts)
- Web Speech preview: [src/features/journal/components/voice-recorder/web-speech-preview.tsx](../../../src/features/journal/components/voice-recorder/web-speech-preview.tsx)
- Audio visual: [src/features/journal/components/voice-recorder/audio-visualization.tsx](../../../src/features/journal/components/voice-recorder/audio-visualization.tsx)

## Processing State
- `onProcessingStateChange(entryId, isProcessing)` is used to show "Analyzing..." on entries.
