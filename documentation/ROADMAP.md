# Persistence Roadmap: Future Schema Migrations & Sync

**Date**: February 10, 2026  
**Status**: Planned (Not Yet Implemented)  
**Priority**: Low (design document for Phase 2)

MANY OF THESE CHANGES WILL SLOW DOWN DEVELOPMENT. 
DO NOT IMPLEMENT THESE CHANGES UNTIL PRODUCTION PHASE. 

---

## Overview

This roadmap documents the planned evolution of the persistence layer to support:
1. **Non-destructive schema migrations** (data transformation without clearing)
2. **Conflict resolution** (handling local vs. server changes)
3. **Selective sync** (sync only changed stores)

---

## Phase 1: Current State (V2.1) ✅ COMPLETE

### Implemented
- ✅ IndexedDB backend with idb-keyval
- ✅ Independent store persistence (7 stores)
- ✅ Automatic hydration on app startup
- ✅ Version management (clear on mismatch)
- ✅ Firebase Read-Aside sync (journal, graph, player stats, user settings)
- ✅ Google Auth + Anonymous guest with profile seeding
- ✅ Graph manifest-first hydration pipeline with 30-min TTL

### Limitations
- ❌ No data transformation on schema changes
- ❌ No conflict resolution
- ❌ Data cleared on version mismatch

---

## Phase 2: Non-Destructive Migrations (Planned)

### Problem Statement

Currently, when store schema changes (version increment), all persisted data is cleared. This is destructive and loses user data. A production system needs migration logic.

### Solution: Transform-Based Migrations

Instead of clearing data, transform it to the new schema.

```typescript
// Example: Adding a new field to UserInformation
export const useUserInformationStore = create<UserInformationStoreState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'user-information-store-v2', // ← Version incremented
      storage: indexedDBStorage,
      version: 2,
      migrate: (state: any, version: number) => {
        // v1 → v2 migration
        if (version < 2) {
          return {
            info: {
              ...state.info,
              createdAt: new Date().toISOString(), // ← New field with default
            },
          };
        }
        // v2 → v3 migration
        if (version < 3) {
          return {
            info: {
              ...state.info,
              preferences: { theme: 'dark' }, // ← Another new field
            },
          };
        }
        return state;
      },
    }
  )
);
```

### Implementation Steps

1. **Define migration function**
   - Compare `version` parameter against store's current version
   - Apply transformations sequentially (v1→v2→v3→v4)
   - Return transformed state

2. **Update store version** in name: `{store}-v2` or `{store}-v3`

3. **Test migrations**
   - Verify old data transforms correctly
   - Verify new field defaults are reasonable
   - Test backward compatibility (old app doesn't break with new data)

4. **Deploy**
   - Version increment triggers migration on user's next app load
   - Users seamlessly upgrade without data loss

### Migration Patterns

#### Pattern A: Add Field with Default
```typescript
if (version < 2) {
  return {
    ...state,
    newField: 'default-value'
  };
}
```

#### Pattern B: Rename Field
```typescript
if (version < 2) {
  const { oldFieldName, ...rest } = state;
  return {
    ...rest,
    newFieldName: oldFieldName
  };
}
```

#### Pattern C: Transform Nested Structure
```typescript
if (version < 2) {
  return {
    ...state,
    stats: Object.entries(state.oldStats).map(([key, value]) => ({
      id: key,
      ...value
    }))
  };
}
```

#### Pattern D: Remove Field
```typescript
if (version < 2) {
  const { deprecatedField, ...rest } = state;
  return rest;
}
```

---

## Phase 3: Backend Sync Integration (Planned)

### Problem Statement

Currently, all data is local-only. Phase 3 adds backend synchronization while maintaining local-first principles.

### Stale-While-Revalidate Pattern

```typescript
/**
 * Hydration + Revalidation Flow
 */
export const useSyncOrchestrator = () => {
  const { isInitialized } = usePersistence(); // ← Hydrate from IndexedDB
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    // Immediately after hydration, silently fetch fresh data from backend
    const revalidate = async () => {
      setIsSyncing(true);
      try {
        // 1. Fetch fresh data from server
        const response = await api.get('/sync/full');
        
        // 2. Merge into stores (server data overwrites local if fresher)
        deserializeRootState(response.data);
        
        // 3. Persist merged data back to IndexedDB
        // (automatically done by persist middleware)
      } catch (err) {
        console.log('Revalidation failed; keeping local data:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    revalidate();
  }, [isInitialized]);

  return { isInitialized, isSyncing };
};
```

### Sync Flow

```
User opens app
    ↓
[0ms] Load from IndexedDB (instant)
    ↓
[100ms] UI renders with local data
    ↓
[200ms] Background: POST /sync/full with local changes
    ↓
[500ms] Server returns merged state
    ↓
[600ms] Merge and update stores (silent)
    ↓
[700ms] User sees updated data (if server had newer info)
```

### Conflict Resolution

#### Strategy: Timestamp-Based Last-Write-Wins

```typescript
interface StateWithMetadata {
  data: any;
  lastModified: number; // Unix timestamp
  lastModifiedBy: string; // 'local' | 'server'
}

const mergeStates = (local: StateWithMetadata, server: StateWithMetadata) => {
  if (server.lastModified > local.lastModified) {
    return server; // Server is newer
  }
  return local; // Local is newer or equal
};
```

#### Strategy: Operational Transform (Advanced)

For collaborative features, use OT (Yjs, Automerge):
```typescript
// Future: Implement with Yjs for real-time collab
import * as Y from 'yjs';
const ydoc = new Y.Doc();
const yjournal = ydoc.getMap('journal');
```

### API Contract

#### POST /api/sync/full

**Request:**
```json
{
  "journal": { /* full journal state */ },
  "cdagTopology": { /* full topology */ },
  "playerStatistics": { /* full stats */ },
  "userInformation": { /* user info */ },
  "aiConfig": { /* ai config */ },
  "integrations": { /* integrations */ },
  "clientVersion": "1.0.0",
  "lastSyncTime": 1706000000000
}
```

**Response:**
```json
{
  "journal": { /* merged journal */ },
  "cdagTopology": { /* merged topology */ },
  "playerStatistics": { /* merged stats */ },
  "userInformation": { /* merged user info */ },
  "aiConfig": { /* merged ai config */ },
  "integrations": { /* merged integrations */ },
  "serverTime": 1706000100000,
  "conflictResolutions": [
    { "store": "journal", "path": "2026/02/01/10:00", "resolution": "server-won" }
  ]
}
```

#### POST /api/sync/patch (Optimized)

Instead of sending full state, send only changes:
```json
{
  "journal": {
    "added": { "2026/02/02/14:30": { /* entry */ } },
    "updated": { "2026/02/01/10:00": { /* entry */ } },
    "deleted": ["2026/01/31/09:00"]
  },
  "playerStatistics": {
    "added": { "skillName": { /* stats */ } },
    "updated": {}
  }
}
```

---

## Phase 4: Selective Sync & Offline Queue (Planned)

### Problem Statement

Syncing entire state every 5 minutes is wasteful. Phase 4 optimizes to sync only changed stores and maintains queue of offline changes.

### Change Tracking

```typescript
interface StoreMetadata {
  lastSynced: number;
  isDirty: boolean;
  pendingChanges: Map<string, Change>;
}

// Example: Track changes in journal
const journalChanges = new Map();
usJournalStore.subscribe((state) => {
  journalChanges.set(`journal-${Date.now()}`, state);
});
```

### Offline Queue

```typescript
const offlineQueue: Change[] = [];

// On mutation
onMutation((store, path, value) => {
  offlineQueue.push({ store, path, value, timestamp: Date.now() });
  
  // Try to sync immediately; if fails, keep in queue
  syncChanges().catch(err => {
    console.log('Offline; queued change:', { store, path });
  });
});

// On reconnect (using navigator.onOnline)
window.addEventListener('online', async () => {
  console.log('Reconnected; syncing', offlineQueue.length, 'pending changes');
  while (offlineQueue.length > 0) {
    const change = offlineQueue.shift();
    await api.post('/sync/change', change);
  }
});
```

---

## Phase 5: Collaborative Features (Future)

### Planned for Future Versions

- Real-time multi-user editing with Yjs/Automerge
- Presence awareness (who's editing what)
- Comments and annotations
- Change history and audit logs

---

## Implementation Checklist

### Phase 2 (Non-Destructive Migrations)
- [ ] Design migration function API
- [ ] Document migration patterns
- [ ] Implement migration tests
- [ ] Update all stores to use versioning
- [ ] Add UI notification for migrations
- [ ] Test backward compatibility

### Phase 3 (Backend Sync)
- [ ] Design API contract
- [ ] Implement sync endpoint
- [ ] Implement conflict resolution strategy
- [ ] Add sync UI indicators (syncing, failed)
- [ ] Error handling and retry logic
- [ ] Test offline scenario
- [ ] Document sync flow

### Phase 4 (Selective Sync)
- [ ] Implement change tracking
- [ ] Implement offline queue
- [ ] Add queue UI (pending changes)
- [ ] Test with poor network conditions

### Phase 5 (Collaboration)
- [ ] Evaluate Yjs vs. Automerge
- [ ] Design collaboration schema
- [ ] Implement real-time sync
- [ ] Test with multiple clients

---

## Testing Strategy

### Unit Tests
- Migration logic transforms data correctly
- Conflict resolution picks right version
- Change tracking records all mutations

### Integration Tests
- Full sync flow (hydrate → modify → sync → reload)
- Offline scenario (modify → go offline → go online → sync)
- Migration on version bump
- Conflict resolution with server data

### E2E Tests
- User makes changes → Network fails → User continues work → Network resumes → Changes sync
- User opens app → Sees old data briefly → Fresh data loads silently
- Two users edit same data → Server resolves conflict

---

## Performance Targets

- **Hydration**: < 200ms (with 100KB data)
- **Sync latency**: 500ms-2s (background, non-blocking)
- **Storage quota**: Stay under 50MB per store
- **Queue drain**: < 10s with 100 pending changes

---

## Related Files

- [PERSISTENCE_ARCHITECTURE.md](./PERSISTENCE_ARCHITECTURE.md) - Current implementation
- [lib/persist-middleware.ts](../lib/persist-middleware.ts) - Persist config
- [stores/root/index.ts](../stores/root/index.ts) - Root state serialization
