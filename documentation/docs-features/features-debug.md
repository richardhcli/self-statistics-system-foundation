# Feature: Debug Console

The Debug Console provides low-level access to the application's engine and persistence layer. **All debug utilities strictly adhere to the Separated Selector Facade Pattern** defined in [GLOBAL_STATE.MD](../state-management/GLOBAL_STATE.MD).

## Routing
- Base route: `/app/debug`
- Sub-routes: `/app/debug/console`, `/app/debug/graph`, `/app/debug/manual-journal-entry`
- Layout: [src/features/debug/components/debug-view.tsx](../../src/features/debug/components/debug-view.tsx) renders the tab bar and an `Outlet` for nested panels.

## Architecture Compliance

### State Access Pattern
Debug utilities access state using two methods:

**1. React Components (use hooks):**
```typescript
const nodes = useGraphNodes();  // State selector
const { addNode } = useGraphActions();  // Actions
```

**2. Non-React Utilities (use getState):**
```typescript
// Direct state access for serialization
const entries = useJournalStore.getState().entries;

// Direct action access for mutations
useJournalStore.getState().actions.upsertEntry(key, data);
```

### ❌ Anti-Pattern (Never Do This)
```typescript
// WRONG - Getter methods don't exist
const data = useStore.getState().actions.getData();  // ❌ Error
const data = useStore.getState().getData();  // ❌ Error

// CORRECT - Direct property access
const data = useStore.getState().data;  // ✅
```

## Components

### 1. PersistenceView
**File:** `src/features/debug/components/persistence-view.tsx`

Displays serialized JSON of all application stores.

**Implementation:**
- Uses `serializeRootState()` from `@/stores/root`
- Accesses state directly: `useStore.getState().dataProperty`
- Never uses non-existent getter methods

### 2. TopologyManager
**File:** `src/features/debug/components/topology-manager.tsx`

Interactive graph node management.

**Features:**
- Add new nodes with custom labels
- Remove existing nodes
- View all nodes with type indicators

**Implementation:**
```typescript
const nodes = useGraphNodes();  // Read state
const { addNode, removeNode } = useGraphActions();  // Write actions
```

### 3. DebuggingManualJournalEntryForm
**File:** `src/features/debug/components/debugging-manual-journal-entry-form.tsx`

Debug-only manual journal entry form for testing AI and manual action pipelines.

**Features:**
- Direct action tagging (comma-separated)
- AI toggle for forcing analysis vs manual actions
- Optional time and duration overrides

**Usage:**
- Accessible via Debug Console → Manual Journal Entry tab

### 4. TestInjections
**File:** `src/features/debug/api/test-injections.ts`

Batch data injection utilities for testing.

**Functions:**
- `injectSampleJournalEntries()` - Adds mock journal data
- `injectSampleTopology()` - Creates sample graph structure
- `injectSamplePlayerStats()` - Injects XP values

## Tools
- **Batch Data Injection**:
    - **AI Dataset**: Injects raw strings for pipeline verification.
    - **Manual Dataset**: Injects pre-tagged JSON entries.
    - **Complex Set**: Injects a 15-node multi-root hierarchy to test layout stability.
- **Experience Injector**: Manually add EXP to any node to verify back-propagation math.
- **Raw Data Browser**: Live JSON view of all IndexedDB tables.
- **Neural Wipe**: Catastrophic reset button that clears all local storage.

## Migration History

### February 1, 2026 - Fixed Getter Method Violations

**Problem:** Debug utilities were calling non-existent getter methods:
```typescript
useJournalStore.getState().getEntries()  // ❌ Caused TypeError
```

**Root Cause:** Stores had getter methods in actions object, violating the Separated Selector Facade Pattern.

**Solution:** Removed all getter methods from stores. Updated all serialization APIs to access data properties directly:
```typescript
useJournalStore.getState().entries  // ✅ Direct access
```

**Files Fixed:**
- `src/stores/journal/api/journal.ts`
- `src/stores/player-statistics/api/stats.ts`
- `src/stores/user-information/index.ts`
- `src/stores/user-integrations/index.ts`
- `src/stores/ai-config/index.ts`

**Stores Updated:**
- All stores now have only data and actions properties
- No getter methods exist anywhere
- Serialization uses direct property access

## Usage Guidelines

### Adding New Debug Tools

When creating new debug utilities:

1. **Use Hooks in Components:**
   ```typescript
   const data = useFeatureData();
   const { update } = useFeatureActions();
   ```

2. **Use getState() in Utilities:**
   ```typescript
   const data = useFeatureStore.getState().data;
   useFeatureStore.getState().actions.update(newData);
   ```

3. **Never Create Getters:**
   ```typescript
   // ❌ DON'T do this
   export const getData = () => useStore.getState().actions.getData();
   
   // ✅ DO this
   export const getData = () => useStore.getState().data;
   ```

## Related Documentation

- [GLOBAL_STATE.MD](../state-management/GLOBAL_STATE.MD) - **Immutable** pattern specification
- [ORCHESTRATOR_PATTERN.MD](../state-management/ORCHESTRATOR_PATTERN.MD) - Cross-store coordination
- [State Management README](../state-management/state-management-README.md) - Architecture overview