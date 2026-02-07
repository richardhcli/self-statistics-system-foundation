# Blueprint: Global Storage Architecture (Read-Aside Pattern)

**Date**: February 7, 2026
**Status**: Approved / Pending Execution
**Supersedes**: `documentation/architecture/architecture.md` (Local-First Section)

## 1. Core Philosophy Change

We are shifting from a **Local-First (IndexedDB is Source of Truth)** model to a **Hybrid Read-Aside (Firebase is Source of Truth, Zustand is Smart Cache)** model.

| Feature | Old Architecture | New Architecture |
| :--- | :--- | :--- |
| **Source of Truth** | Local IndexedDB | Firebase Firestore |
| **Zustand Role** | Primary Database | Temporary / Persistent Cache |
| **Offline Support** | Native (it was local-only) | Supported via `persist` middleware (Read-Only) |
| **Writes** | Synchronous to Memory + IDB | Optimistic UI -> Async Background Sync |
| **Reads** | All data loaded on boot | Lazy Loaded (Summary First -> Detailed on Demand) |
| **Cost Strategy** | N/A (Local) | Minimize Reads (Cache-First Logic) |

---

## 2. The "Read-Aside" Pattern

To minimize Firestore read costs while ensuring data consistency, all stores will implement the **Smart Fetch** pattern.

### 2.1. Read Flow
1. **Component Request**: Component asks generic hook for data (e.g., `useJournalEntries('2026-02')`).
2. **Cache Check**: Hook checks `store.metadata[key].lastFetched`.
3. **Decision**:
   - **Hit**: Return data from `store.entries`. (0 Reads)
   - **Stale/Miss**: Trigger `store.actions.fetch(key)`.
4. **Fetch**: Service calls Firestore.
5. **Update**: Result is saved to `store.entries` and `store.metadata[key]` is updated.

### 2.2. Write Flow (Atomic/Optimistic)
1. **User Action**: User submits data.
2. **Optimistic Update**: `store.actions.add(data)` updates local state immediately. UI is responsive.
3. **Background Sync**: Service calls Firestore (Batch or Transaction).
4. **Reconciliation**:
   - **Success**: Update local entry status (e.g., remove "pending" flag).
   - **Failure**: Rollback or flag element as "Sync Failed" (Retry allowed).

---

## 3. Standardized Store Structure

All Zustand stores (Journal, CDAG, UserInfo) will eventually migrate to this shape:

```typescript
interface StandardStoreState<T> {
  // THE DATA (Normalized)
  items: Record<string, T>;
  
  // THE STRUCTURE (Lightweight Index)
  // Example: Tree for Journal, Adjacency List for Graphs
  structure: any; 

  // THE METADATA (Cache Control)
  metadata: {
    [key: string]: {
      lastFetched: number; // Timestamp
      isDirty: boolean;    // If true, force re-fetch
    }
  };

  // ACTIONS
  actions: {
    // Sync
    fetchStructure: () => Promise<void>;
    fetchItems: (ids: string[]) => Promise<void>;
    
    // Optimistic
    add: (item: T) => void;
    update: (id: string, updates: Partial<T>) => void;
    remove: (id: string) => void;
  }
}
```

---

## 4. Persistence Layer Strategy

We will retain `indexedDB` (via `idb-keyval`) but its role changes.

- **Old Role**: Permanent Storage.
- **New Role**: **Offline Cache**.
- **Mechanism**: Zustand `persist` middleware.
- **Boot Process**:
  1. App loads.
  2. Zustand rehydrates from IDB (User sees data instantly).
  3. Effect runs `fetchStructure()` to check if local data is stale compared to Cloud.

---

## 5. Migration Roadmap

1. **Phase 1**: Journal Store (Pilot Implementation).
2. **Phase 2**: User Information & Integrations.
3. **Phase 3**: CDAG Topology (Graph Data).
4. **Phase 4**: Player Statistics.

*Note: The Journal Refactor (Plan B) is the immediate next step to prove this architecture.*
