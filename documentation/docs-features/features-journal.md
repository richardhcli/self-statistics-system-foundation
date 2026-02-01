# Feature: Journal

The Journal is the primary data ingestion point, transforming raw input into structured neural data. As of the latest refactor, the journal feature is a fully self-contained, modular React feature following modern architectural patterns.

## Architecture Overview

### Three Core Responsibilities

1. **Getting User Input**
   - Display voice recorder component for audio-based input
   - Display manual entry form for text-based input
   - Support both quick inline entries and detailed form submissions

2. **Updating Global Journal Store**
   - Update journal store **immediately** upon user input (before AI processing)
   - Create loading placeholders to ensure UI always displays something
   - Maintain global journal state in `stores/app-data`

3. **Displaying Journal Store**
   - Render journal entries using `journal-entry-item` and related components
   - Use **local UI store** for ephemeral UI state (dropdowns, form state, processing flags)
   - Separate persistent data (journal entries) from transient UI state

### Store Architecture

The journal feature uses a clean separation of concerns:

**Global Store** (`stores/app-data`):
- Persistent journal entries
- Serializable, saved to IndexedDB
- Source of truth for journal data

**Local Component State** (React useState):
- Dropdown expansion states (journal-view)
- Form input states (journal-view)
- Processing flags (journal-feature)
- Ephemeral, component-scoped

**Key Principle**: Use global Zustand store for persistent data, local useState for component UI state. Simple and straightforward.

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
- Recursive dropdown navigation
- Inline quick entry forms
- Loading states during processing
- Uses local UI store for dropdown states

## Functional Components

### VoiceRecorder
Captures audio with real-time level visualization. Transcribes via Gemini.

**Features**:
- Microphone capture with visualization
- Waveform display using Canvas
- Base64 audio encoding
- Async processing with loading states

### ManualEntryForm
Allows for text logging with optional duration and custom action tags.

**Features**:
- Rich text entry
- Optional time/duration inputs
- Manual action tags
- AI toggle (on/off)

## Data Flow

### Entry Creation Flow

```
User Input (Voice/Text)
    ↓
[Immediate Store Update]
    ↓
upsertJournalEntry(date, { content: 'loading', ... })
    ↓
[Display Loading State]
    ↓
[AI Processing] (async)
    ↓
entryOrchestrator
    ↓
[Store Update with Results]
    ↓
upsertJournalEntry(date, { content, actions, metadata, ... })
    ↓
[Display Final Entry]
```

**Critical**: The store is updated **twice**:
1. **Immediately** with a loading placeholder (for responsiveness)
2. **After AI processing** with final data

This ensures the UI always displays something to the user while processing happens in the background.

## Neural Impact Analysis

Every processed entry calculates its contribution to the user's growth:

- **Impact Breakdown**: The `EntryResults` component lists every node (Action, Skill, and Characteristic) that received EXP.
- **Automatic Generalization**: If you log an activity that falls under a new category, the AI automatically generates a bridge to the "progression" root node. This ensures the Concept Graph always remains a connected, single-root system.

## Deterministic Classification

- **Zero-Temperature Logic**: AI classification is deterministic. This means your "Player Stats" are a rigorous mathematical reflection of your logged activities, free from the randomness of typical LLM outputs.
- **Metadata Tracking**: Impact data is persisted within the entry's `metadata.nodeIncreases` field for historical auditing.

## API Layer

### Key Functions

#### createJournalEntry
```typescript
export const createJournalEntry = async (
  context: { 
    entry: string; 
    actions?: string[]; 
    useAI?: boolean; 
    dateInfo?: any;
    duration?: string;
  },
): Promise<void>
```

Creates a journal entry with immediate UI feedback followed by async processing.

#### upsertJournalEntry
```typescript
export const upsertJournalEntry = (
  date: { year: string; month: string | number; day: string; time: string },
  entryData: JournalEntryData
): void
```

Updates or inserts a journal entry at the specified date. Automatically recalculates XP totals.

#### entryOrchestrator
```typescript
export const entryOrchestrator = async (
  context: EntryOrchestratorContext
): Promise<EntryPipelineResult>
```

Orchestrates the full entry processing pipeline:
1. AI analysis (if enabled)
2. Topology merging
3. XP calculation
4. Store updates

## Usage

### Basic Integration

```typescript
import { JournalFeature } from '@/features/journal';

function App() {
  const handleIntegration = async (eventName: string, payload: any) => {
    // Handle webhooks, Obsidian sync, etc.
    await sendWebhook(webhookUrl, payload);
  };

  return <JournalFeature onIntegrationEvent={handleIntegration} />;
}
```

### Accessing Journal Data

```typescript
import { useJournalStore } from '@/features/journal/hooks/use-journal-store';

function MyComponent() {
  const { journal, setJournal } = useJournalStore();
  const entry = journal[year]?.[month]?.[day]?.[time];
}
```

### Component State

UI state is managed locally within components using React useState:

```typescript
// In journal-view.tsx
const [expanded, setExpanded] = useState<Record<string, boolean>>({});
const [manualText, setManualText] = useState('');

// In journal-feature.tsx
const [isProcessing, setIsProcessing] = useState(false);
```

## Integration Points

The journal feature provides callbacks for external integrations:

```typescript
onIntegrationEvent?: (eventName: string, payload: any) => Promise<void>
```

**Events**:
- `JOURNAL_AI_PROCESSED`: Triggered after AI analyzes an entry
  - Payload: `{ originalText, timestamp, source, duration?, actions? }`

**Use Cases**:
- Webhook notifications
- Obsidian sync
- External analytics
- Custom automation

## File Structure

```
features/journal/
├── components/
│   ├── journal-feature.tsx          # Main orchestrator
│   ├── journal-view.tsx             # Display entries
│   ├── voice-recorder.tsx           # Voice input
│   ├── manual-entry-form.tsx        # Text input
│   └── journal-entry-item/          # Entry display
├── api/
│   ├── create-entry.ts              # Create entries
│   ├── get-journal.ts               # Fetch journal
│   └── update-journal.ts            # Update journal
├── hooks/
│   └── use-journal-store.ts         # Global journal store hook
├── utils/
│   ├── journal-entry-utils.ts       # Entry utilities
│   └── time-utils.ts                # Date/time helpers
└── index.ts                         # Feature exports
```

## Performance

### Optimistic UI Updates

- Immediate feedback with loading placeholders
- Background AI processing
- Progressive enhancement when processing completes

### Store Optimization

- Selective re-renders via hooks
- Local UI state kept separate from global store
- Memoization where appropriate

## Testing

The journal feature should be tested at multiple levels:

1. **Unit Tests**: Test individual utilities and API functions
2. **Integration Tests**: Test full entry creation flow
3. **Component Tests**: Test UI interactions and state management

## Related Documentation

- [State Management](../STATE_MANAGEMENT.md) - Global store architecture
- [Data Model](../data-model.md) - Journal data structure
- [AI and Gamification](../ai-and-gamification.md) - AI analysis pipeline
- [Integration Overview](../integrations/overview.md) - External integrations