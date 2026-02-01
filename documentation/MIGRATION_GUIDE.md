# Migration Guide: AppData → Independent Stores

## Overview

This guide helps migrate from the legacy monolithic `AppData` pattern to the new independent store architecture with orchestrator hooks.

## Breaking Changes

### 1. Store Access Pattern

**Before:**
```typescript
import { useAppDataStore } from '@/stores/app-data';
const data = useAppDataStore(state => state.data);
const setData = useAppDataStore(state => state.setData);
```

**After:**
```typescript
// Import specific store hooks
import { useJournal, useJournalActions } from '@/stores/journal';
import { usePlayerStatistics, usePlayerStatisticsActions } from '@/stores/player-statistics';
import { useCdagTopology, useCdagTopologyActions } from '@/stores/cdag-topology';
import { useUserInformation, useUserInformationActions } from '@/stores/user-information';
import { useAiConfig, useAiConfigActions } from '@/stores/ai-config';
import { useUserIntegrations, useUserIntegrationsActions } from '@/stores/user-integrations';

// Read state with selectors
const journal = useJournal();
const stats = usePlayerStatistics();

// Dispatch actions
const { upsertEntry } = useJournalActions();
const { updateStats } = usePlayerStatisticsActions();
```

### 2. AppData Parameter Passing

**Before (Deprecated):**
```typescript
export const myFunction = (data: AppData) => {
  const result = applyScaledProgression(data, actions, duration);
  return { ...data, playerStatistics: result.data.playerStatistics };
};
```

**After (Pure Functions):**
```typescript
export const myFunction = (
  topology: CdagTopology,
  stats: PlayerStatistics,
  actions: string[],
  duration?: string
) => {
  return calculateScaledProgression(topology, stats, actions, duration);
};
```

**After (Orchestrator Hooks):**
```typescript
export const useMyFeature = () => {
  const { applyEntryUpdates } = useEntryOrchestrator();
  
  const handleAction = useCallback(() => {
    const result = applyEntryUpdates(dateKey, entry, actions, duration);
    return result;
  }, [applyEntryUpdates]);
  
  return { handleAction };
};
```

### 3. Visual Graph State

**Before:**
```typescript
// Part of AppData
interface AppData {
  visualGraph: VisualGraph;
  // ...
}
```

**After:**
```typescript
// Local feature state
import { useVisualGraph } from '@/features/visual-graph/store';

const MyComponent = () => {
  const { graph, updateNode, addEdge } = useVisualGraph();
  // ...
};
```

### 4. Persistence & Serialization

**Before:**
```typescript
import { getCurrentData } from '@/stores/app-data';
const data = getCurrentData();
await db.put('appData', data);
```

**After:**
```typescript
import { serializeRootState, deserializeRootState } from '@/stores/root';

// Serialize all stores
const rootState = serializeRootState();
await db.put('rootState', rootState);

// Deserialize into all stores
const loaded = await db.get('rootState');
deserializeRootState(loaded);

// Or save individually
import { getJournalEntries } from '@/stores/journal';
await db.put('journal', getJournalEntries());
```

## Step-by-Step Migration

### Step 1: Identify AppData Usage

Search codebase for:
- `AppData` type imports
- `getCurrentData()` calls
- `useAppDataStore()` usage
- `setData()` / `updateData()` calls

### Step 2: Determine Pattern

For each usage, decide:

**Pattern A: Pure Utility Function**
- No side effects
- Returns calculated data
- Example: `calculateScaledProgression()`

**Pattern B: Component with State**
- Uses store hooks
- Renders based on state
- Example: Statistics dashboard

**Pattern C: Orchestrator Hook**
- Coordinates multiple stores
- Cross-domain logic
- Example: `useEntryOrchestrator()`

### Step 3: Refactor Utilities

**Before:**
```typescript
export const dataUpdater = (data: AppData, context, useAI) => {
  const result = applyScaledProgression(data, actions, duration);
  return { data: result.data, entryData };
};
```

**After:**
```typescript
// Pure function - no store access
export const calculateEntryMetadata = (
  topology: CdagTopology,
  stats: PlayerStatistics,
  entry: string,
  actions: string[],
  duration?: string
) => {
  const progression = calculateScaledProgression(topology, stats, actions, duration);
  return {
    totalExp: progression.totalIncrease,
    levelsGained: progression.levelsGained,
    nodeIncreases: progression.nodeIncreases
  };
};
```

### Step 4: Refactor Components

**Before:**
```typescript
const MyComponent = () => {
  const data = useAppDataStore(state => state.data);
  const setData = useAppDataStore(state => state.setData);
  
  const handleUpdate = () => {
    setData({ ...data, journal: newJournal });
  };
};
```

**After:**
```typescript
const MyComponent = () => {
  // Separate state and actions
  const journal = useJournal();
  const { upsertEntry } = useJournalActions();
  
  const handleUpdate = () => {
    upsertEntry(dateKey, entryData);
  };
};
```

### Step 5: Create Orchestrator Hooks

For cross-store coordination:

```typescript
// hooks/use-entry-orchestrator.ts
export const useEntryOrchestrator = () => {
  // Read state
  const topology = useCdagTopology();
  
  // Get actions (stable, no re-renders)
  const { updateStats } = usePlayerStatisticsActions();
  const { updateMostRecentAction } = useUserInformationActions();
  const { upsertEntry } = useJournalActions();
  
  const applyEntryUpdates = useCallback((dateKey, entry, actions, duration) => {
    // Calculate progression
    const progression = calculateScaledProgression(topology, stats, actions, duration);
    
    // Update stores (batched by React 18+)
    updateStats(progression.nodeIncreases);
    updateMostRecentAction(actions[0]);
    upsertEntry(dateKey, entryData);
    
    return progression;
  }, [topology, updateStats, updateMostRecentAction, upsertEntry]);
  
  return { applyEntryUpdates };
};
```

## Common Patterns

### Pattern 1: Reading Multiple Stores

**Before:**
```typescript
const data = useAppDataStore(state => state.data);
const journal = data.journal;
const stats = data.playerStatistics;
```

**After:**
```typescript
const journal = useJournal();
const stats = usePlayerStatistics();
```

### Pattern 2: Updating Multiple Stores

**Before:**
```typescript
setData({
  ...data,
  journal: newJournal,
  playerStatistics: newStats
});
```

**After:**
```typescript
const { upsertEntry } = useJournalActions();
const { updateStats } = usePlayerStatisticsActions();

// Updates are automatically batched
upsertEntry(dateKey, entry);
updateStats(expMap);
```

### Pattern 3: Exporting State

**Before:**
```typescript
const data = getCurrentData();
downloadJSON(data);
```

**After:**
```typescript
const rootState = serializeRootState();
downloadJSON(rootState);
```

## Deprecation Timeline

### Phase 1: New Code (Current)
- ✅ All new features use independent stores
- ✅ All new utilities are pure functions
- ✅ All new components use Pattern C hooks
- ⚠️ Legacy code still uses AppData (deprecated)

### Phase 2: Migration (In Progress)
- 🔄 Update existing components to use store hooks
- 🔄 Convert utilities to pure functions
- 🔄 Replace AppData parameters with individual values
- ⚠️ Keep deprecated functions for backward compatibility

### Phase 3: Cleanup (Future)
- ❌ Remove `stores/app-data`
- ❌ Remove `stores/user-data`
- ❌ Remove deprecated utilities
- ✅ All code uses new patterns

## Checklist

- [ ] Replace `AppData` type with individual store types
- [ ] Replace `getCurrentData()` with individual getters
- [ ] Replace `useAppDataStore()` with specific store hooks
- [ ] Convert utilities to pure functions
- [ ] Create orchestrator hooks for cross-store logic
- [ ] Update imports from `@/stores/app-data` to specific stores
- [ ] Update persistence code to use `serializeRootState()`
- [ ] Move visual-graph state to local component state
- [ ] Test all features after migration
- [ ] Update tests to use new store patterns

## Troubleshooting

### Issue: "Cannot read property of undefined"

**Cause:** Store not hydrated yet.

**Solution:** Ensure stores are initialized before component render:
```typescript
if (!journal) return <Loading />;
```

### Issue: "Too many re-renders"

**Cause:** Using state hook instead of actions hook.

**Solution:** Separate state and actions:
```typescript
// ❌ Causes re-renders on every data change
const { updateStats } = usePlayerStatistics();

// ✅ Stable, no re-renders
const { updateStats } = usePlayerStatisticsActions();
```

### Issue: "Hook called in non-React function"

**Cause:** Using hooks in utilities.

**Solution:** Convert to pure function:
```typescript
// ❌ Don't use hooks
export const myUtility = () => {
  const data = useAppDataStore.getState().getData(); // Wrong!
};

// ✅ Accept data as parameters
export const myUtility = (topology: CdagTopology, stats: PlayerStatistics) => {
  // Pure calculation
};
```

## Benefits

### Before (Monolithic AppData)
- ❌ Single massive object for all state
- ❌ Parameter drilling through functions
- ❌ Tight coupling between domains
- ❌ Difficult to test utilities
- ❌ Re-renders on any state change

### After (Independent Stores)
- ✅ Modular, domain-specific stores
- ✅ Hook-based composition
- ✅ Loose coupling via orchestrators
- ✅ Pure, testable utilities
- ✅ Fine-grained subscriptions

## Questions?

See:
- [STATE_MANAGEMENT_V2.md](./STATE_MANAGEMENT_V2.md) - Complete architecture guide
- [architecture.md](./architecture.md) - Overall application structure
- Individual store files in `/stores/` - Implementation examples
