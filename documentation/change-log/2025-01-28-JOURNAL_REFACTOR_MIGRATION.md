# Journal Feature Refactor - Migration Guide

**Date**: January 28, 2026  
**Phase**: Phase 3 - Component Migration

## Overview

The journal feature has been refactored to be a fully self-contained, modular React feature. This guide explains the changes and how to work with the new architecture.

## What Changed

### Before: Scattered Logic
```typescript
// ❌ Old pattern: Logic spread across app.tsx
const [isProcessing, setIsProcessing] = useState(false);

const handleVoice = async (audioBase64: string) => {
  setIsProcessing(true);
  // ... processing logic ...
  setIsProcessing(false);
};

const handleManual = async (y, m, d, content) => {
  // ... entry logic ...
};

return (
  <>
    <VoiceRecorder onProcessed={handleVoice} />
    <ManualEntryForm onSubmit={handleManual} />
    <JournalView data={journal} />
  </>
);
```

### After: Self-Contained Feature
```typescript
// ✅ New pattern: Single self-contained component
import { JournalFeature } from '@/features/journal';

return (
  <JournalFeature onIntegrationEvent={handleIntegration} />
);
```

## Key Architectural Changes

### 1. Dual-Store Pattern

**Global Store** (`stores/app-data`):
- Journal entries (persistent data)
- Player statistics
- Topology data

**Local Component State** (React useState):
- Dropdown states (in journal-view)
- Form input values (in journal-view)
- Processing flags (in journal-feature)

### 2. Immediate Store Updates

```typescript
// Step 1: Immediate placeholder (NEW!)
upsertJournalEntry(date, { content: 'loading', ... });

// Step 2: Async processing
await entryOrchestrator({ ... });

// Step 3: Final update
upsertJournalEntry(date, { content, actions, metadata });
```

This ensures the UI always displays something while processing happens.

### 3. Clean Integration Interface

```typescript
interface JournalFeatureProps {
  onIntegrationEvent?: (eventName: string, payload: any) => Promise<void>;
}
```

Events:
- `JOURNAL_AI_PROCESSED`: Triggered after AI analysis

## Migration Steps

### 1. Update Imports

**Before**:
```typescript
import { 
  JournalView, 
  VoiceRecorder, 
  ManualEntryForm,
  createJournalEntry 
} from '@/features/journal';
```

**After**:
```typescript
import { JournalFeature } from '@/features/journal';
// Or for granular access:
import { useJournalStore } from '@/features/journal';
```

### 2. Replace Multiple Components with Feature Component

**Before**:
```typescript
<div>
  <VoiceRecorder onProcessed={handleVoice} isProcessing={isProcessing} />
  <ManualEntryForm onSubmit={handleManual} isProcessing={isProcessing} />
  <JournalView 
    data={journal} 
    onAddManualEntry={handleManual} 
    onParseEntry={handleParseEntry}
    isProcessing={isProcessing}
  />
</div>
```

**After**:
```typescript
<JournalFeature onIntegrationEvent={handleIntegrationEvent} />
```

### 3. Move Handler Logic to Integration Callback

**Before**:
```typescript
const handleVoice = async (audioBase64: string) => {
  // ... processing ...
  await triggerWebhook(data);
};
```

**After**:
```typescript
const handleIntegrationEvent = async (eventName: string, payload: any) => {
  if (eventName === 'JOURNAL_AI_PROCESSED') {
    await triggerWebhook(payload);
  }
};
```

### 4. Simplified State Management

**The journal feature now uses simple React useState for UI state:**

```typescript
// Local component state - no Zustand needed
const [expanded, setExpanded] = useState<Record<string, boolean>>({});
const [isProcessing, setIsProcessing] = useState(false);
```

State is scoped to the component that needs it, making the code simpler and easier to understand.

## Benefits

### 1. Better Modularity
- Feature is self-contained
- Clear boundaries and interfaces
- Easier to test and maintain

### 2. Improved Performance
- Local UI state doesn't trigger global re-renders
- Immediate feedback with loading states
- Optimistic UI updates

### 3. Cleaner Code
- Separation of concerns
- Single source of truth for journal data
- Clear data flow

### 4. Better DX
- TypeScript types are clearer
- Easier to understand and modify
- Better documentation

## Common Patterns

### Accessing Journal Data

```typescript
import { useJournalStore } from '@/features/journal';

function MyComponent() {
  const { journal } = useJournalStore();
  
  // Read data
  const entry = journal[year]?.[month]?.[day]?.[time];
  
  return <div>{entry?.content}</div>;
}
```

### Creating Entries Programmatically

```typescript
import { createJournalEntry } from '@/features/journal';

await createJournalEntry({
  entry: 'I coded for 2 hours',
  useAI: true,
  duration: '2 hours',
  dateInfo: { year: '2026', month: 'January', day: '15' }
});
```

### Updating Entries Directly

```typescript
import { upsertJournalEntry } from '@/features/journal';

upsertJournalEntry(
  { year: '2026', month: 'January', day: '15', time: '10:30' },
  { content: 'Updated content', metadata: { totalExp: 100 } }
);
```

## Troubleshooting

### Issue: Entry not appearing
**Solution**: Check that date is properly normalized and dropdown is expanded.

### Issue: Processing never completes
**Solution**: Check console for errors in AI processing pipeline.

### Issue: UI state not updating
**Solution**: Check component re-rendering and useState dependencies.

## Questions?

See full documentation at:
- [features-journal.md](../documentation/docs-features/features-journal.md)
- [STATE_MANAGEMENT.md](../documentation/STATE_MANAGEMENT.md)
