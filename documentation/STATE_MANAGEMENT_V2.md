# State Management Architecture v2.0

## Overview

This project uses a sophisticated layered approach to state management following **Bulletproof React** principles with independent Zustand stores and orchestrator patterns.

## Architecture Patterns

### Pattern C: Separated Selector Facades

All global stores follow **Pattern C** (Hybrid Selector/Action Separation):

```typescript
// ❌ NEVER: Direct store access
const stats = useStatsStore();

// ✅ ALWAYS: Separated hooks
const stats = usePlayerStatistics();           // State Hook (fine-grained selector)
const { updateStats } = usePlayerStatisticsActions();  // Actions Hook (stable functions)
```

**Why Pattern C?**
- **Prevents unnecessary re-renders**: Components using only actions won't re-render on data changes
- **Action stability**: Functions are stable references, ideal for button/dispatch components
- **Fine-grained control**: Selector pattern allows precise subscriptions

## Global Store Structure

All global stores are located in `/stores/` and follow this structure:

```
stores/
├── journal/              # Journal entries store
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # Type exports
│   ├── index.ts          # Public API
│   └── api/              # Serialization helpers
├── player-statistics/    # Experience and levels
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # NodeStats, PlayerStatistics
│   ├── index.ts          # Public API
│   ├── api/              # Serialization helpers
│   └── utils/            # Pure calculation functions
├── cdag-topology/        # Logical hierarchy (Second Brain)
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # CdagTopology, NodeType
│   ├── index.ts          # Public API
│   └── api/              # Serialization helpers
├── user-information/     # User profile and identity
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # UserInformation
│   └── index.ts          # Public API
├── ai-config/            # AI processing settings
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # AIConfig
│   └── index.ts          # Public API
├── user-integrations/    # External API configs and logs
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # IntegrationStore
│   └── index.ts          # Public API
└── root/                 # Composition for serialization ONLY
    └── index.ts          # serializeRootState(), deserializeRootState()
```

### Store Isolation Principle

**✅ DO:**
- Each store manages its own domain independently
- Stores never import or depend on other stores
- Cross-store coordination happens via orchestrator hooks

**❌ DON'T:**
- Import one store inside another store
- Create circular dependencies between stores
- Access stores directly from utilities (use pure functions instead)

## Orchestration Pattern

### Orchestrator Hooks for Cross-Store Logic

When operations span multiple stores, use **orchestrator hooks**:

```typescript
// hooks/use-entry-orchestrator.ts
export const useEntryOrchestrator = () => {
  const topology = useCdagTopology();
  const { updateStats } = usePlayerStatisticsActions();
  const { updateMostRecentAction } = useUserInformationActions();
  const { upsertEntry } = useJournalActions();

  const applyEntryUpdates = useCallback((dateKey, entry, actions, duration) => {
    // Coordinate updates across multiple stores
    // React 18+ batches all updates into single render
    const { totalIncrease, levelsGained } = updateStats(scaledExpMap);
    updateMostRecentAction(actions[0]);
    upsertEntry(dateKey, entryData);
    
    return { totalIncrease, levelsGained };
  }, [topology, updateStats, updateMostRecentAction, upsertEntry]);

  return { applyEntryUpdates };
};
```

**Key Principles:**
- Utilities are **pure functions** (Data In → Data Out)
- Orchestrators consume multiple stores via hooks
- React 18+ automatic batching ensures atomic updates
- Keeps stores decoupled and testable

## Feature-Specific State

### Local State with React Hooks

Features that don't need global sharing use local state:

```typescript
// features/visual-graph/store/index.ts
export const useVisualGraph = () => {
  const [graph, setGraph] = useState<VisualGraph>({ nodes: [], edges: [] });
  
  const updateNode = useCallback((nodeId, updates) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n)
    }));
  }, []);

  return { graph, updateNode, addNode, removeNode };
};
```

**When to use local state:**
- UI-only state (animations, toggles, form inputs)
- Feature-specific data not shared across features
- Derived/computed visualization data (D3 graphs)

## Root Composition Store

The root store aggregates all stores **ONLY for serialization**:

```typescript
// stores/root/index.ts
export const serializeRootState = (): RootState => {
  return {
    journal: getJournalEntries(),
    cdagTopology: getCdagTopology(),
    playerStatistics: getPlayerStatistics(),
    userInformation: getUserInformation(),
    aiConfig: getAiConfig(),
    integrations: getUserIntegrations(),
  };
};
```

**⚠️ CRITICAL: Root store usage restrictions**
- ✅ Persistence (IndexedDB save/load)
- ✅ Import/Export operations
- ✅ Initial backend hydration
- ❌ NEVER use during runtime operations
- ❌ NEVER pass around as function parameter

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Component Layer (React)                                  │
│  - Local state (useState)                                │
│  - Feature hooks (useVisualGraph)                        │
├─────────────────────────────────────────────────────────┤
│ Orchestrator Layer (Custom Hooks)                       │
│  - useEntryOrchestrator                                  │
│  - Coordinates cross-store updates                       │
├─────────────────────────────────────────────────────────┤
│ Store Layer (Zustand - Pattern C)                       │
│  - useJournal() / useJournalActions()                    │
│  - usePlayerStatistics() / usePlayerStatisticsActions()  │
│  - useCdagTopology() / useCdagTopologyActions()          │
│  - useUserInformation() / useUserInformationActions()    │
│  - useAiConfig() / useAiConfigActions()                  │
│  - useUserIntegrations() / useUserIntegrationsActions()  │
├─────────────────────────────────────────────────────────┤
│ Utilities Layer (Pure Functions)                        │
│  - calculateScaledProgression()                          │
│  - parseDurationToMultiplier()                           │
│  - updatePlayerStatsState()                              │
├─────────────────────────────────────────────────────────┤
│ Persistence Layer (IndexedDB)                           │
│  - serializeRootState()                                  │
│  - deserializeRootState()                                │
└─────────────────────────────────────────────────────────┘
```

## Usage Patterns

### Pattern 1: Reading State in Components

```typescript
// Fine-grained selector (only re-renders when specific data changes)
const progression = usePlayerStatistics(s => s.progression);
const userName = useUserInformation(s => s.name);

// Full state (re-renders on any change)
const journal = useJournal();
```

### Pattern 2: Dispatching Actions

```typescript
const { updateStats, addExperience } = usePlayerStatisticsActions();
const { updateName } = useUserInformationActions();

// These components ONLY re-render when clicked, not when data changes
<button onClick={() => updateName('New Name')}>Update</button>
```

### Pattern 3: Orchestrated Updates

```typescript
const { applyEntryUpdates } = useEntryOrchestrator();

// Coordinates journal, stats, and user info updates atomically
const handleSubmit = async () => {
  const result = applyEntryUpdates(dateKey, entry, actions, duration);
  console.log(`Gained ${result.totalIncrease} EXP`);
};
```

### Pattern 4: Utilities (Non-React)

```typescript
// ✅ Pure function - accepts data, returns data
export const calculateScaledProgression = (
  topology: CdagTopology,
  stats: PlayerStatistics,
  actions: string[],
  duration?: string
) => {
  // Pure calculation
  return { nextStats, totalIncrease, levelsGained };
};

// ❌ DON'T use hooks in utilities
// ❌ DON'T access stores directly
```

## Persistence & Hydration

### Independent Store Persistence

Each store can be persisted to its own IndexedDB table:

```typescript
// Save individual store
await db.put('journal', getJournalEntries());
await db.put('playerStatistics', getPlayerStatistics());

// Load individual store
const journal = await db.get('journal');
setJournalEntries(journal);
```

### Atomic State Export/Import

For full state operations, use root composition:

```typescript
// Export all state
const rootState = serializeRootState();
downloadJSON(rootState, 'backup.json');

// Import all state
const imported = parseJSON(fileContent);
deserializeRootState(imported);
```

## Migration from Legacy AppData

### Before (Deprecated)

```typescript
// ❌ Old pattern: AppData parameter passing
const result = applyScaledProgression(appData, actions, duration);
const updated = dataUpdater(appData, context, useAI);
```

### After (Current)

```typescript
// ✅ New pattern: Hook-based orchestration
const { applyEntryUpdates } = useEntryOrchestrator();
const result = applyEntryUpdates(dateKey, entry, actions, duration);

// ✅ New pattern: Pure utilities
const result = calculateScaledProgression(topology, stats, actions, duration);
```

## Best Practices

### ✅ DO

- Use Pattern C (separated selector/action hooks) for all global stores
- Keep utilities as pure functions
- Use orchestrator hooks for cross-store coordination
- Access stores via hooks in components
- Use `getState()` in non-React serialization code only

### ❌ DON'T

- Pass AppData/RootState as function parameters
- Call hooks inside utilities
- Create circular dependencies between stores
- Use Zustand for temporary UI state
- Access root composition store during runtime

## Why This Architecture?

1. **Modularity**: Each store is independent and testable
2. **Performance**: Fine-grained subscriptions prevent unnecessary re-renders
3. **Scalability**: Add new stores without affecting existing ones
4. **Type Safety**: Full TypeScript support with inference
5. **Debuggability**: Clear data flow and single source of truth
6. **Testability**: Pure functions and isolated stores
7. **Maintainability**: Explicit orchestration patterns
