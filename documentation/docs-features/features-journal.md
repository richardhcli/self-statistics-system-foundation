# Feature: Journal

**Last updated**: 2026-02-02 - Schema refactor to user-centric model

The Journal is the primary data ingestion point, transforming raw input into structured neural data. As of the latest refactor, the journal feature uses a user-centric schema that reflects what the user sees rather than how the system generates it.

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
[Immediate Store Update with Loading Placeholder]
    ↓
{
  content: "...",
  actions: { "loading": 1 },
  metadata: { flags: { aiAnalyzed: useAI }, timePosted: "...", duration: "loading" }
}
    ↓
[AI Processing / Manual Topology Creation] (async)
    ↓
Entry Orchestrator:
  1. Analyze entry (if AI) → extract actionWeights
  2. Merge topology fragment into graph store
  3. Calculate experience propagation
  4. Scale based on duration
  5. Update player statistics
    ↓
[Store Update with Final Data]
    ↓
{
  content: "...",
  actions: { "Debugging": 0.7, "Code review": 0.3 },
  result: { levelsGained: 2, totalExpIncrease: 45.3, nodeIncreases: {...} },
  metadata: { flags: { aiAnalyzed: true }, timePosted: "...", duration: "120" }
}
    ↓
[Display Final Entry with Results]
```

**Critical**: The store is updated **twice**:
1. **Immediately** with a loading placeholder (for responsiveness)
2. **After processing** with final data (including performance results)

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