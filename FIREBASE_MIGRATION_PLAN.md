# Firebase Migration Plan: Journal & Graph AI Backend Integration

**Date**: February 3, 2026  
**Status**: 📋 PLANNED  
**Architecture**: Local-First → Local-First + Cloud Sync  
**AI Optimization**: ✅ Structured for AI code generation, modular phases, clear abstractions

---

## Executive Summary

Migrate the Journal & Graph AI application from **pure local-first (IndexedDB)** to **local-first + Firebase sync** while:
- ✅ Maintaining all local-first guarantees (instant UI, no network dependency)
- ✅ Preserving existing Zustand + IndexedDB architecture (minimum refactoring)
- ✅ Adding cloud persistence, cross-device sync, and backup capabilities
- ✅ Enabling collaborative features (future-proof)

**Key Principle**: Firebase is a *background sync layer*, not the primary truth.

---

## Phase 0: Foundation & Setup (Days 1-2)

### 0.1 Firebase Project Configuration

**What**: Set up Firebase backend infrastructure  
**Who**: Human (one-time setup)  
**Files to Create/Modify**:
- `src/lib/firebase/config.ts` — Firebase initialization
- `.env.local` — Firebase credentials (gitignored)
- `tsconfig.json` — Firebase SDK type defs

**Actions**:
```bash
# 1. Create Firebase project at https://console.firebase.google.com
#    - Enable Firestore Database (EU region recommended for GDPR)
#    - Enable Storage (for voice file backups)
#    - Enable Authentication (Email/Anonymous for now)
#    - Set up Security Rules (default: deny all, then auth-gated)

# 2. Add Firebase SDK (already in package.json ✅)
npm install firebase --save

# 3. Create environment file
cat > .env.local << EOF
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
EOF
```

**Deliverable**: `src/lib/firebase/config.ts` (Firebase client configured, no schemas yet)

---

### 0.2 Data Schema Design (Firestore)

**What**: Map current IndexedDB stores to Firestore collections  
**Who**: Human + AI (schema design, then AI generates boilerplate)  
**Mapping Strategy**:

| IndexedDB Store | Firestore Collection | Key Structure | Sync Strategy |
|---|---|---|---|
| `journal-store-v1` | `/users/{uid}/entries` | `{dateKey}` → document | Real-time sync on write |
| `cdag-topology-store-v1` | `/users/{uid}/topology` | Single doc, nested arrays | Optimistic update + merge-on-sync |
| `player-statistics-store-v1` | `/users/{uid}/stats` | Single doc | Calculate server-side (no client sync) |
| `user-information-store-v1` | `/users/{uid}/profile` | Single doc | Real-time sync |
| `ai-config-store-v1` | `/users/{uid}/settings/ai` | Single doc | Real-time sync |
| `user-integrations-store-v1` | `/users/{uid}/integrations` | Single doc | Real-time sync |

**Firestore Security Rules (Draft)**:
```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
      match /entries/{entryId} {
        allow read, write: if request.auth.uid == uid;
      }
      match /topology {
        allow read, write: if request.auth.uid == uid;
      }
      match /stats {
        allow read: if request.auth.uid == uid;
        allow write: if false;  // Server-only
      }
    }
  }
}
```

**Deliverable**: `documentation/firebase-schema.md` + Firestore rules file

---

## Phase 1: Sync Infrastructure (Days 3-5)

### 1.1 Create Firebase Sync Abstraction Layer

**What**: New module `lib/firebase/sync-engine.ts` — handles all Firestore operations  
**Why**: Decouple Firebase from store logic; enables testing, swapping backends  
**Who**: AI code generation (structure provided by human)

**Interface to implement**:
```typescript
// src/lib/firebase/sync-engine.ts
export interface SyncOperation {
  collection: string;        // e.g., "entries"
  action: 'set' | 'update' | 'delete' | 'merge';
  path: string;             // Full Firestore path including user ID
  data: Record<string, any>;
  timestamp?: number;       // Client timestamp for conflict resolution
}

export interface SyncBatch {
  operations: SyncOperation[];
  clientVersion: number;    // Version tracking for ordering
}

export class FirebaseSync {
  private userId: string | null = null;
  private db: Firestore;
  private isSyncing = false;
  private syncQueue: SyncBatch[] = [];

  constructor(firebaseApp: FirebaseApp) {
    this.db = getFirestore(firebaseApp);
  }

  async authenticate(user: User): Promise<void> {
    this.userId = user.uid;
    await this.syncStoreStates();  // Initial hydration from cloud
  }

  async queueSync(operation: SyncOperation): Promise<void> {
    // Queue locally first, push to cloud in background
    this.syncQueue.push({ operations: [operation], clientVersion: Date.now() });
    this.pushToCloud().catch(console.error);  // Fire-and-forget
  }

  async pushToCloud(): Promise<void> {
    if (this.isSyncing || !this.userId || this.syncQueue.length === 0) return;
    this.isSyncing = true;

    try {
      // Batch operations for atomicity
      const batch = writeBatch(this.db);
      for (const { operations } of this.syncQueue) {
        for (const op of operations) {
          const docRef = doc(this.db, op.path);
          if (op.action === 'set') batch.set(docRef, op.data);
          else if (op.action === 'update') batch.update(docRef, op.data);
          else if (op.action === 'delete') batch.delete(docRef);
        }
      }
      await batch.commit();
      this.syncQueue = [];  // Clear queue after success
    } finally {
      this.isSyncing = false;
    }
  }

  async syncStoreStates(): Promise<Record<string, any>> {
    // Hydrate local stores from Firestore snapshot
    const snapshot = await getDoc(doc(this.db, `users/${this.userId}/profile`));
    return snapshot.data() || {};
  }
}
```

**Deliverable**: `src/lib/firebase/sync-engine.ts` with full implementation

---

### 1.2 Create Firebase Store Integration

**What**: New hook `hooks/use-firebase-sync.ts` — bridges Zustand ↔ Firebase  
**Who**: AI code generation

**Implementation pattern**:
```typescript
// hooks/use-firebase-sync.ts
export const useFirebaseSync = () => {
  const { syncEngine } = useFirebaseContext();
  const journalData = useJournalData();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

  // Hook into store updates (only data changes trigger sync)
  useEffect(() => {
    const handleSync = async () => {
      setSyncStatus('syncing');
      try {
        // Serialize only data portion (matching Zustand partialize strategy)
        const operation: SyncOperation = {
          collection: 'entries',
          action: 'set',
          path: `users/${currentUserId}/entries`,
          data: journalData,
          timestamp: Date.now(),
        };
        await syncEngine.queueSync(operation);
        setSyncStatus('idle');
      } catch (err) {
        setSyncStatus('error');
      }
    };

    // Debounced sync (2s after last change)
    const timer = setTimeout(handleSync, 2000);
    return () => clearTimeout(timer);
  }, [journalData, syncEngine]);

  return { syncStatus };
};
```

**Deliverable**: `src/hooks/use-firebase-sync.ts`

---

### 1.3 Setup Firebase Authentication Flow

**What**: Auth state management + anonymous/email sign-up  
**Who**: AI code generation

**Implementation**:
```typescript
// src/lib/firebase/auth.ts
export const authService = {
  async signUpAnonymous(): Promise<User> {
    const auth = getAuth();
    const { user } = await signInAnonymously(auth);
    return user;
  },

  async signUpEmail(email: string, password: string): Promise<User> {
    const auth = getAuth();
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    return user;
  },

  async signIn(email: string, password: string): Promise<User> {
    const auth = getAuth();
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    const auth = getAuth();
    return onAuthStateChanged(auth, callback);
  },

  async signOut(): Promise<void> {
    const auth = getAuth();
    await auth.signOut();
  },
};
```

**Deliverable**: `src/lib/firebase/auth.ts` + update `src/app/app.tsx` to initialize auth

---

## Phase 2: Integration with Existing Stores (Days 6-9)

### 2.1 Wrap Zustand Actions with Firebase Sync

**What**: Minimal modifications to existing stores to trigger Firebase sync  
**Strategy**: Non-invasive — intercept only mutations, preserve all existing logic  
**Who**: AI code generation + human review

**Pattern to apply to each store**:

**Before** (current):
```typescript
export const useJournalStore = create<JournalStoreState>()(
  persist((set, get) => ({
    data: {},
    actions: {
      upsertEntry: (dateKey: string, entry: JournalEntryData) =>
        set(state => ({
          data: { ...state.data, [dateKey]: entry }
        })),
    },
  }), {
    name: 'journal-store-v1',
    storage: indexedDBStorage,
    partialize: state => ({ data: state.data }),
  })
);
```

**After** (Firebase-aware, still local-first):
```typescript
export const useJournalStore = create<JournalStoreState>()(
  persist((set, get) => {
    let syncEngine: FirebaseSync | null = null;

    // Allow sync engine injection from app initialization
    window.__setSyncEngine = (engine: FirebaseSync) => {
      syncEngine = engine;
    };

    return {
      data: {},
      actions: {
        upsertEntry: (dateKey: string, entry: JournalEntryData) => {
          set(state => ({
            data: { ...state.data, [dateKey]: entry }
          }));
          // Fire-and-forget sync (no await, no UI blocking)
          if (syncEngine) {
            syncEngine.queueSync({
              collection: 'entries',
              action: 'set',
              path: `users/{uid}/entries/${dateKey}`,
              data: entry,
            }).catch(console.error);
          }
        },
      },
    };
  }), {
    name: 'journal-store-v1',
    storage: indexedDBStorage,
    partialize: state => ({ data: state.data }),
  })
);
```

**Deliverable**: Modified store files with sync hooks integrated

---

### 2.2 Conflict Resolution Strategy

**What**: Handle cases where local & cloud diverge (multi-device, offline edits)  
**Who**: Human design + AI implementation

**Strategy: Last-Write-Wins with Metadata**:
```typescript
// Extend all persisted records with metadata
interface PersistedRecord {
  data: any;
  _clientVersion: number;  // Timestamp when last modified locally
  _cloudVersion: number;   // Timestamp when last synced
  _deviceId: string;       // Which device made the change
}

// During cloud sync, compare versions:
if (localRecord._clientVersion > cloudRecord._cloudVersion) {
  // Local is newer → push to cloud, keep local
  await syncEngine.pushToCloud();
} else {
  // Cloud is newer → pull to local (rare, multi-device scenario)
  await hydrateFromCloud();
}
```

**Deliverable**: `src/lib/firebase/conflict-resolution.ts`

---

### 2.3 Offline Queue Persistence

**What**: Ensure sync queue survives browser crashes  
**Who**: AI code generation

**Implementation**:
```typescript
// src/lib/firebase/sync-queue-persistence.ts
export const syncQueueStore = {
  async savePending(batch: SyncBatch): Promise<void> {
    const existing = await get('sync-queue') || [];
    await set('sync-queue', [...existing, batch]);
  },

  async getPending(): Promise<SyncBatch[]> {
    return (await get('sync-queue')) || [];
  },

  async clearPending(): Promise<void> {
    await del('sync-queue');
  },
};

// On app boot, before rendering:
useEffect(() => {
  const resumePendingSync = async () => {
    const pending = await syncQueueStore.getPending();
    for (const batch of pending) {
      await syncEngine.pushToCloud();
    }
  };
  resumePendingSync();
}, []);
```

**Deliverable**: `src/lib/firebase/sync-queue-persistence.ts`

---

## Phase 3: Real-Time Sync & Multi-Device (Days 10-13)

### 3.1 Setup Firestore Real-Time Listeners

**What**: Two-way sync — cloud updates → local stores instantly  
**Who**: AI code generation

**Implementation**:
```typescript
// src/lib/firebase/realtime-listeners.ts
export class RealtimeSync {
  private unsubscribers: Array<() => void> = [];

  setupListeners(userId: string, stores: {
    journal: typeof useJournalStore;
    topology: typeof useCdagTopologyStore;
    // ... etc
  }): void {
    // Listen to entries collection
    this.unsubscribers.push(
      onSnapshot(
        collection(db, `users/${userId}/entries`),
        (snapshot) => {
          const newData = {};
          snapshot.docs.forEach(doc => {
            newData[doc.id] = doc.data();
          });
          // Merge cloud data into local store
          stores.journal.setState(state => ({
            data: { ...state.data, ...newData }
          }));
        },
        (error) => console.error('Sync error:', error)
      )
    );

    // Similar listeners for other stores...
  }

  cleanup(): void {
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];
  }
}
```

**Deliverable**: `src/lib/firebase/realtime-listeners.ts`

---

### 3.2 Cross-Device Synchronization Test Suite

**What**: Verify sync works across 2+ browser sessions  
**Who**: Human + AI  
**Test Scenarios**:
- ✅ Device A creates entry → Device B sees it in real-time
- ✅ Offline edit on A, then go online → syncs to B
- ✅ Conflict: A & B edit same entry simultaneously → last-write-wins resolves
- ✅ Device A deletes → B gets deletion
- ✅ Long offline period on A → queued changes batch-synced

**Deliverable**: `src/testing/firebase-sync.test.ts`

---

## Phase 4: Admin & Analytics (Days 14-15)

### 4.1 Firebase Admin Dashboard Integration

**What**: (Optional) Server-side functions for stats calculation, backups  
**Who**: Human (outside main app, separate Firebase Functions project)

**Use Cases**:
- Calculate `player-statistics` server-side (immutable, never client-writable)
- Scheduled backups to Storage
- User data export/deletion for GDPR compliance

**Deliverable**: `functions/calculateStats.ts`, `functions/scheduleBackup.ts`

---

### 4.2 Analytics & Error Tracking

**What**: (Optional) Firebase Crashlytics for bug tracking, GA4 for usage  
**Who**: AI code generation (boilerplate)

**Setup**:
```typescript
// src/lib/firebase/analytics.ts
import { getAnalytics, logEvent } from 'firebase/analytics';
import { initializeAppCheck } from 'firebase/app-check';

export const analyticsService = {
  logEntryCreated: (wordCount: number) => {
    logEvent(analytics, 'entry_created', { word_count: wordCount });
  },
  logGraphUpdate: (nodeCount: number) => {
    logEvent(analytics, 'graph_updated', { node_count: nodeCount });
  },
};
```

**Deliverable**: `src/lib/firebase/analytics.ts`

---

## Phase 5: UI & Testing (Days 16-18)

### 5.1 Add Sync Status Indicator to UI

**What**: Show users when data is syncing, queued, or offline  
**Where**: Top-right corner or settings panel  
**Who**: AI code generation

**Component**:
```typescript
// src/components/sync-status-badge.tsx
export const SyncStatusBadge = () => {
  const { syncStatus, queueSize } = useSyncStatus();

  return (
    <div className="flex items-center gap-2">
      {syncStatus === 'syncing' && <Spinner className="w-4 h-4" />}
      {syncStatus === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
      {queueSize > 0 && <span className="text-xs text-amber-600">{queueSize} pending</span>}
      {syncStatus === 'idle' && <Cloud className="w-4 h-4 text-green-500" />}
    </div>
  );
};
```

**Deliverable**: `src/components/sync-status-badge.tsx`

---

### 5.2 Settings UI for Cloud Integration

**What**: User-facing controls for sync preferences, sign-in, export/import  
**Where**: Settings feature  
**Who**: AI code generation

**Features**:
- Sign in with Email / Anonymous
- Toggle auto-sync on/off
- Manual "Sync Now" button
- Export full state as JSON
- Import from JSON backup
- Logout & clear local data option
- View last sync timestamp

**Deliverable**: Update `src/features/settings/` with Firebase controls

---

### 5.3 Migration Path & Data Portability

**What**: Existing users → Firebase (no data loss)  
**Who**: Human (design) + AI (implementation)

**Strategy**:
1. On first app boot, offer: "Backup to Cloud" or "Stay Local"
2. If user chooses backup → serialize full IndexedDB state → upload as Firestore doc
3. Subsequent boots detect cloud presence → offer "Restore from Cloud" or "Use Local"
4. Full `exportState()` / `importState()` functionality (JSON format, human-readable)

**Deliverable**: `src/hooks/use-data-migration.ts`

---

## Phase 6: Optimization & Hardening (Days 19-20)

### 6.1 Bandwidth & Storage Optimization

**What**: Compress data, batch requests, implement pagination  
**Who**: AI code generation

**Strategies**:
- Compress large graph topology before sending (gzip)
- Paginate entry list (load last 30 days, lazy-load older)
- Index frequently-queried fields in Firestore (e.g., `dateKey`)
- TTL on sync queue (drop events older than 7 days if stuck)

**Deliverable**: `src/lib/firebase/compression.ts`, Firestore indexes

---

### 6.2 Security & Rate Limiting

**What**: Prevent abuse, enforce data validation  
**Who**: AI code generation + human review

**Firestore Rules (Enhanced)**:
```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;

      // Limit entry writes: max 1000 entries/day
      match /entries/{entryId} {
        allow read, write: if request.auth.uid == uid
          && request.resource.data.size() < 1000000  // 1MB per entry
          && request.resource.data.keys().hasAll(['createdAt', 'content']);
      }

      match /topology {
        allow read, write: if request.auth.uid == uid
          && request.resource.data.size() < 5000000;  // 5MB for full topology
      }

      // Stats read-only from client
      match /stats {
        allow read: if request.auth.uid == uid;
        allow write: if false;
      }
    }
  }
}
```

**Deliverable**: Hardened Firestore security rules + validation middleware

---

### 6.3 Error Handling & Retry Logic

**What**: Graceful degradation if Firebase unavailable  
**Who**: AI code generation

**Pattern**:
```typescript
export const withRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await delay(Math.pow(2, i) * 1000);  // Exponential backoff
    }
  }
};

// Usage in sync engine:
await withRetry(() => syncEngine.pushToCloud());
```

**Deliverable**: `src/lib/firebase/retry-logic.ts`

---

## Implementation Roadmap (Timeline)

| Phase | Days | Task | Complexity | AI-Ready |
|-------|------|------|-----------|----------|
| **0** | 1-2 | Firebase setup, schema design | 🟢 Low | ✅ Config template |
| **1** | 3-5 | Sync engine, auth, integration layer | 🟡 Medium | ✅ Boilerplate |
| **2** | 6-9 | Store integration, conflict resolution | 🟠 High | ✅ Pattern-based |
| **3** | 10-13 | Real-time listeners, multi-device tests | 🟠 High | ✅ Template listeners |
| **4** | 14-15 | Admin functions, analytics | 🟢 Low | ✅ Optional boilerplate |
| **5** | 16-18 | UI components, migration UX | 🟡 Medium | ✅ React components |
| **6** | 19-20 | Optimization, security hardening | 🟠 High | ✅ Reusable patterns |

**Total Estimate**: ~20 days of development (8h/day) = 160 hours  
**Parallelizable**: Phases 0-1 (foundation), then 2-6 (components can overlap)

---

## Success Criteria (Testing & Validation)

✅ **Phase 1 Checkpoint**: Firebase admin console shows documents after first sync  
✅ **Phase 2 Checkpoint**: All stores sync locally & to cloud without UI blocking  
✅ **Phase 3 Checkpoint**: Two browser tabs stay in sync in real-time  
✅ **Phase 4 Checkpoint**: Server stats reflect client changes after 2s  
✅ **Phase 5 Checkpoint**: New user can sign up, old user can migrate data  
✅ **Phase 6 Checkpoint**: App still works 100% offline; syncs on reconnect  

---

## Rollback Strategy

If Firebase integration breaks:
1. All data stays in IndexedDB (primary source unaffected)
2. Disable Firebase sync module without touching stores
3. Revert commits back to pre-migration state
4. Users experience zero data loss (local-first guarantees)

```bash
# If needed:
git revert <commit-range>
npm uninstall firebase
```

---

## Key Design Principles (Maintain Throughout)

| Principle | Why | How |
|-----------|-----|-----|
| **Local-First** | No network = app still works | IndexedDB primary, Firebase async |
| **Optimistic UI** | Never wait for cloud | Write local first, sync background |
| **Sync-Behind** | Reduces latency jank | Debounced (2s), batched writes |
| **Data, Not Logic** | Persist only facts, not code | `partialize` whitelist + clean architecture |
| **Conflict-Free** | Multi-device safety | Last-Write-Wins + timestamp metadata |
| **Type-Safe** | Catch bugs early | Strict TypeScript throughout |

---

## AI Prompting Guidelines (For Code Generation)

When asking AI to implement each phase, use this structure:

```
Generate [Feature] for Firebase migration phase [N]:
- Pattern: [Design pattern to follow]
- Related files: [Dependencies/imports needed]
- Types: [TypeScript interfaces required]
- Edge cases: [Offline, concurrent writes, large datasets]
- Testing: [Unit test scenarios]
- Rollback: [How to disable without breaking existing]
```

**Example Prompt**:
```
Generate the sync engine for Phase 1.1:
- Pattern: Async queue with exponential backoff
- Related files: types/firebase.ts, lib/firebase/config.ts
- Types: SyncOperation, SyncBatch, FirebaseSync class
- Edge cases: Offline mode (queue persists), concurrent mutations, network errors
- Testing: Unit tests for queueing, deduplication, retry logic
- Rollback: Sync engine disabled if Firebase unavailable, no store mutations affected
```

---

## Next Steps

1. **Human**: Review this plan, adjust timelines/priorities
2. **Human**: Set up Firebase project (Phase 0.1)
3. **AI**: Generate `src/lib/firebase/config.ts` + types
4. **AI**: Generate Phase 1 infrastructure (sync engine, auth)
5. **Human + AI**: Pair program Phase 2 (store integration)
6. **Continue** iteratively, testing at each checkpoint

---

**Status**: Ready for human review → AI generation → Testing → Deployment  
**Last Updated**: February 3, 2026  
**Owner**: Self-Statistics System Team
