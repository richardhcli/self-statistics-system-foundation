# Persistence Architecture: Local-First, Sync-Behind

**Date**: February 1, 2026  
**Status**: ✅ COMPLETE  
**Version**: 1.0

---

## Executive Summary

This application uses a **Local-First, Sync-Behind** architecture where IndexedDB serves as the primary source of truth. All data is immediately persisted to IndexedDB (no network wait), ensuring the UI is always optimistic and responsive.

### Key Design Principles

- **Primary Source**: IndexedDB (local)
- **Secondary Source**: Backend API (remote, optional)
- **UI Philosophy**: Optimistic (never waits for network)
- **Write Flow**: UI → Zustand → IndexedDB (Immediate) → Sync to Server (Background)
- **Read Flow**: UI → Zustand → IndexedDB (Immediate)
- **Conflict Resolution**: Local data is authoritative until server explicitly rejects a change

---

## Architecture Layers

### 1. **Zustand Stores (State Management)**
- 6 independent stores, each with its own persistence
- Pattern C: Separated state/action hooks for optimal re-renders
- Each store uses `persist` middleware with IndexedDB backend

### 2. **Persist Middleware** (`lib/persist-middleware.ts`)
- Wraps all stores with automatic persistence
- Uses `idb-keyval` for async, non-blocking IndexedDB operations
- Handles version management for schema migrations
- Stores independently: `journal-store-v1`, `cdag-topology-store-v1`, etc.

### 3. **IndexedDB Storage Engine** (`idb-keyval`)
- Asynchronous, non-blocking IndexedDB access
- Prevents UI freezing on large data writes
- Automatically handles JSON serialization

### 4. **Hydration** (`use-persistence.ts`)
- Simple hook that waits for stores to hydrate from IndexedDB
- Returns `{ isInitialized: boolean }` for UI loading states
- No manual serialization - Zustand handles everything

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                         │
│                    (Component Events)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   ACTION DISPATCHED                          │
│     (useJournalActions, useCdagTopologyActions, etc)        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               ZUSTAND STORE UPDATED                          │
│         (Synchronous, in-memory state mutation)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          PERSIST MIDDLEWARE TRIGGERED                        │
│    (Zustand detects state change automatically)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    ASYNC: WRITE TO INDEXEDDB (non-blocking)                │
│           (idb-keyval handles async I/O)                    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│          IMMEDIATE: UI RE-RENDERS                            │
│    (Based on Zustand state, no network wait)                │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼ (FUTURE: Optional background sync)
┌─────────────────────────────────────────────────────────────┐
│              BACKGROUND: POST TO BACKEND                     │
│    (Sync orchestrator sends data to server)                 │
│    (Happens independently, doesn't block UI)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Store Persistence Configuration

All 6 stores follow the same persistence pattern using the **Stable Actions Pattern** for optimal performance:

```typescript
interface MyStoreState {
  // State
  data: MyData;

  // Getters
  getData: () => MyData;

  // Actions (nested in stable object for performance)
  actions: {
    setData: (data: MyData) => void;
    updateData: (updates: Partial<MyData>) => void;
  };
}

export const useMyStore = create<MyStoreState>()(
  persist(
    (set, get) => ({
      // State and getters
      data: initialValue,
      getData: () => get().data,
      
      // Actions (stable object reference - never recreated)
      actions: {
        setData: (data: MyData) => set({ data }),
        updateData: (updates: Partial<MyData>) => {
          set((state) => ({ data: { ...state.data, ...updates } }));
        }
      }
    }),
    {
      name: 'my-store-v1',              // Unique key + version
      storage: indexedDBStorage,        // idb-keyval backend
      version: 1,                        // Schema version
      migrate: (state, version) => {
        // Handle schema changes
        if (version !== 1) {
          return { data: initialValue }; // Clear on mismatch
        }
        return state;
      },
    }
  )
);

/**
 * State Hook: Fine-grained selector for data
 * Only re-renders when selected data changes
 */
export const useMyData = (selector?: (data: MyData) => any) => {
  return useMyStore((state) => {
    if (!selector) return state.data;
    return selector(state.data);
  });
};

/**
 * Actions Hook: Returns stable action functions
 * Uses Stable Actions Pattern - state.actions is a single object
 * reference that NEVER changes, preventing unnecessary re-renders.
 * 
 * WHY THIS PATTERN?
 * - ✅ Maximum performance: Single stable reference
 * - ✅ Zero unnecessary re-renders for components that only call actions
 * - ✅ Better for rapid prototyping: Cleaner API than atomic selectors
 * - ✅ TypeScript friendly: Autocomplete works perfectly
 */
export const useMyActions = () => {
  return useMyStore((state) => state.actions);
};
```

### The Stable Actions Pattern Explained

**Key Principle**: All action functions are nested in a single `actions` object that's created once when the store initializes. This object reference **never changes** across re-renders.

**Why It Prevents Infinite Loops**:
```typescript
// ❌ WRONG: Creating new object on every render
export const useMyActions = () => {
  return useMyStore((state) => ({  // New object every time!
    setData: state._setData,
    updateData: state._updateData
  }));
};

// ❌ WRONG: useMemo still re-evaluates on dependencies
export const useMyActions = () => {
  const setData = useMyStore((state) => state._setData);
  const updateData = useMyStore((state) => state._updateData);
  return useMemo(() => ({ setData, updateData }), [setData, updateData]);
};

// ✅ RIGHT: Return single stable object reference
export const useMyActions = () => {
  return useMyStore((state) => state.actions);  // state.actions is stable!
};
```

**Direct Store Access Pattern**:
```typescript
// In API utilities or non-React contexts:
useMyStore.getState().actions.setData(newData);  // ✅ Access via actions object
```

### Version Management

- **Current Version**: 1 (all stores)
- **Naming Convention**: `{store-name}-store-v{version}`
- **Mismatch Behavior**: Clear data if version doesn't match
- **Future**: Non-destructive migrations (see ROADMAP.md)

---

## Hydration Process

### App Startup Sequence

1. **Store Creation** (automatic by Zustand)
   - Persist middleware activates on first store access
   - Checks IndexedDB for saved state with key `{store-name}-store-v{version}`
   - Hydrates store in-memory state from IndexedDB (async, non-blocking)
   - Returns default state if no persisted data found

2. **Component Mount** (`use-persistence` hook)
   ```typescript
   const { isInitialized } = usePersistence();
   if (!isInitialized) return <LoadingScreen />;
   ```
   - Waits one tick for all stores to hydrate
   - Sets `initialized = true` when complete
   - Triggers UI render with loaded data

3. **User Interaction**
   - UI is immediately responsive
   - All mutations save to IndexedDB without network wait

### Timing Characteristics

- **Hydration**: < 100ms (depends on data size and device)
- **User sees data**: Immediately after hydration
- **Write to IndexedDB**: Asynchronous, < 50ms typical
- **UI updates**: Synchronous with Zustand mutation, no network latency

---

## IndexedDB Storage Details

### Database Structure

```
Database: "idb-keyval-store" (default from idb-keyval)
Object Store: "keyval"

Keys:
├── journal-store-v1         → JSON string of JournalStore
├── cdag-topology-store-v1   → JSON string of CdagTopology
├── player-statistics-store-v1 → JSON string of PlayerStatistics
├── user-information-store-v1 → JSON string of UserInformation
├── ai-config-store-v1       → JSON string of AIConfig
└── user-integrations-store-v1 → JSON string of IntegrationStore
```

### Access Pattern

- **Read**: IndexedDB → JSON string → Parse → Zustand hydrate
- **Write**: Zustand mutation → Persist middleware → Serialize → IndexedDB write
- **All operations are async and non-blocking**

### Storage Limits

- **Per-Store Quota**: ~5-50MB typical (browser-dependent)
- **Total IndexedDB**: ~50MB per origin (varies by browser, user settings)
- **Compression**: No compression; consider for future optimization

### Debugging in Browser

```javascript
// View persisted data in DevTools:
// Application → IndexedDB → idb-keyval-store → keyval → browse keys
```

---

## Migration Strategy

### Current Behavior (Version 1)

- **Version Mismatch**: Clear all persisted data for that store
- **Result**: Store reinitializes with defaults on next load

### Future Behavior (Roadmap)

See [ROADMAP.md](./ROADMAP.md) for planned non-destructive migration system.

---

## Performance Considerations

### Optimized for

- ✅ **UI Responsiveness**: No network waits for mutations
- ✅ **Offline Functionality**: Works entirely offline until sync
- ✅ **Battery Life**: Async I/O doesn't block event loop
- ✅ **Large Data**: Handles journal entries, topology nodes, statistics

### Potential Bottlenecks

- Large JSON serialization (> 10MB) may take 100-500ms
- IndexedDB quota exceeded would stop persistence
- Network sync batching needed for efficient server updates

---

## Sync Protocol (Future Implementation)

When backend sync is implemented, it should follow this pattern:

```typescript
// Pseudo-code
orchestrator.sync = async () => {
  // 1. Collect local changes
  const allChanges = {
    journal: getJournalEntries(),
    topology: getCdagTopology(),
    // ... all 6 stores
  };

  // 2. Send to backend (with conflict resolution)
  try {
    const response = await api.post('/sync', allChanges);
    // 3. Merge remote changes back into stores
    deserializeRootState(response.data);
  } catch (err) {
    // Keep local data intact; retry later
    console.log('Sync failed, retrying in background');
  }
};
```

### Conflict Resolution Strategy

- **Local Wins**: Local data is authoritative until server explicitly rejects
- **Timestamp-Based**: Server can enforce `lastModified` ordering if needed
- **Operational Transform**: Consider for collaborative features (future)

---

## API Reference

### `usePersistence()` Hook

```typescript
import { usePersistence } from '@/hooks/use-persistence';

const { isInitialized } = usePersistence();

if (!isInitialized) return <LoadingScreen />;
// Render app with data
```

**Returns:**
- `isInitialized: boolean` - True when stores are hydrated from IndexedDB

### `clearAllPersistedData()` Function

```typescript
import { clearAllPersistedData } from '@/lib/persist-middleware';

// Clears entire IndexedDB (all stores)
await clearAllPersistedData();
```

⚠️ **Warning**: This is destructive and cannot be undone.

### `listPersistedKeys()` Function

```typescript
import { listPersistedKeys } from '@/lib/persist-middleware';

// Lists all persisted keys (for debugging)
const keys = await listPersistedKeys();
// Use browser DevTools for full inspection
```

---

## Testing Guidelines

### Unit Tests

Test store mutations in isolation (no persistence needed):
```typescript
it('should update journal entry', () => {
  const entry = { content: 'test', ... };
  const { actions } = useJournalStore.getState();
  actions.upsertEntry('2026/02/01/10:00', entry);
  
  const state = useJournalStore.getState();
  expect(state.entries['2026']['02']['01']['10:00']).toEqual(entry);
});
```

### Integration Tests

Test persistence and hydration:
```typescript
it('should hydrate from IndexedDB', async () => {
  // 1. Create store, make changes
  const { actions } = useJournalStore.getState();
  actions.upsertEntry(...);
  
  // 2. Wait for IndexedDB write
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 3. Create new store instance (simulates page reload)
  const store2 = create<JournalStoreState>()(persist(...));
  
  // 4. Verify data persisted
  expect(store2.getState().entries).toEqual(useJournalStore.getState().entries);
});
```

### Manual Testing

1. Open DevTools → Application → IndexedDB
2. Make app changes
3. Verify keys update in IndexedDB
4. Reload page
5. Verify data loads from IndexedDB
6. Disconnect network (DevTools → Network → Offline)
7. Make changes
8. Verify data still persists locally

---

## Troubleshooting

### Data Not Persisting

1. **Check IndexedDB quota**: DevTools → Storage → view quota
2. **Check for errors**: DevTools → Console → look for IndexedDB errors
3. **Verify idb-keyval**: `console.log(await get(key))` in DevTools

### Data Cleared on Reload

1. **Version mismatch**: Check store version in `migrate()` function
2. **IndexedDB disabled**: Check browser settings
3. **Private browsing**: IndexedDB may be cleared on session end

### Performance Issues

1. **Large data**: Check serialization time in DevTools Performance tab
2. **Quota issues**: Clear old data or increase quota
3. **Network**: Ensure async writes don't block event loop

---

## Related Documentation

- [stores/README.md](../stores/README.md) - Store architecture and Pattern C pattern
- [ROADMAP.md](./ROADMAP.md) - Future schema migrations and sync protocol
- [documentation/JOURNAL_REFACTOR_MIGRATION.md](./JOURNAL_REFACTOR_MIGRATION.md) - Component migration guide
