# Plan of Action: Journal Refactor using Global Storage Blueprint

**Date**: February 7, 2026
**Merged from**: `journal-blueprint.md`
**Implements**: `documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md`
**Status**: Phase 6 Complete

This document outlines the specifics for refactoring the **Journal** feature to use the new **Read-Aside Storage Architecture**.

---

## 🛑 Feature Specifics (Journal)

1.  **Data Model**:
    - **Entries**: "Heavy" content items (text, analysis, metadata). Fetched by Month (Lazy).
    - **Tree**: "Light" index (Year/Month/Day stats). Fetched on boot.
    
2.  **ID Strategy**:
    - Format: `YYYYMMDD-HHmmss-[nanoid]`.
    - Purpose: Allows time-based sorting without reading the document field.

3.  **Pipeline**:
    - "Draft-First" integrity check (Save Local -> Sync Cloud).
    - **Draft**: Saved immediately to IDB + Firebase.
    - **Analysis**: Async process updates the record later.

---

## Phase 1: Foundation (Complete)

### 1.1. ID Generator (Complete)
*   **File**: `src/features/journal/utils/id-generator.ts` (Implemented).
*   **Implementation**:
    ```typescript
    import { nanoid } from 'nanoid';
    
    export const generateEntryId = (date: Date = new Date()) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      const sec = String(date.getSeconds()).padStart(2, '0');
      const timestamp = `${yyyy}${mm}${dd}-${hh}${min}${sec}`;
      const suffix = nanoid(4); 
      return `${timestamp}-${suffix}`;
    };

    export const getDateFromId = (id: string): Date => {
      const year = parseInt(id.substring(0, 4), 10);
      const month = parseInt(id.substring(4, 6), 10) - 1;
      const day = parseInt(id.substring(6, 8), 10);
      const hour = parseInt(id.substring(9, 11), 10);
      const minute = parseInt(id.substring(11, 13), 10);
      const second = parseInt(id.substring(13, 15), 10);

      return new Date(year, month, day, hour, minute, second);
    };
    ```

### 1.2. Strict Type Definitions (Complete)
*   **File**: `src/stores/journal/types.ts`
*   **Scope**:
  - `JournalEntryStatus`, `JournalEntryData`, `JournalEntryResult`, `JournalEntryMetadata`
  - `JournalTreeStructure` with Year/Month/Day summaries
  - `JournalCacheInfo` for cache TTL tracking

---

## Phase 2: Firebase Service (The "Read Side") (Complete)

### 2.1. Schema Design
*   **Entries Collection** (`users/{uid}/journal_entries/{entryId}`):
    ```typescript
    {
      id: "20260207-143000-xyz",
      content: "Debugged the auth system...",
      status: "COMPLETED", 
      actions: { "Debugging": 0.8 }, 
      result: { totalExpIncrease: 45 },
      metadata: { duration: 120 }
    }
    ```
*   **Tree Document** (`users/{uid}/journal_meta/tree_structure`):
    ```typescript
    {
      "2026": {
        "totalExp": 1500,
        "months": {
          "02": { 
            "totalExp": 400,
            "days": {
              "07": { "totalExp": 45, "entries": ["20260207..."] }
            }
          }
        }
      }
    }
    ```

### 2.2. Journal Service (Complete)
*   **File**: `src/lib/firebase/journal.ts`
*   **Methods**:
  - `subscribeToTree(uid, onUpdate)`: Real-time listener for the nav structure.
  - `fetchMonthEntries(uid, year, month)`: Uses document ID range for month fetches.
  - `createEntryBatch(uid, entry, treeUpdate)`: Batch write entry + tree update.
  - `updateJournalTree(uid, treeUpdate)`: Merge tree updates.
  - **Note**: Month fetches rely on the sortable ID prefix `YYYYMMDD-HHmmss-`.

---

## Phase 3: Store & Cache (The "Store Side") (Complete)

### 3.1. Journal Storage Refactor (Complete)
*   **File**: `src/stores/journal/store.ts`
*   **Interface**:
    ```typescript
    interface JournalStoreState {
      entries: Record<string, JournalEntryData>;
      tree: JournalTreeStructure;
      metadata: Record<string, JournalCacheInfo>;

      actions: {
        setSnapshot: (snapshot: JournalPersistedState) => void;
        setTree: (tree: JournalTreeStructure) => void;
        cacheEntries: (entries: JournalEntryData[]) => void;
        optimisticAdd: (entry: JournalEntryData, treeUpdate?: Partial<JournalTreeStructure>) => void;
        updateEntry: (entryId: string, updates: Partial<JournalEntryData>) => void;
        fetchMonthEntries: (uid: string, year: string, month: string, force?: boolean) => Promise<void>;
      }
    }
    ```

### 3.2. Persistence (Optimization) (Complete)
*   **Mechanism**: `persist` middleware with `idb-keyval`.
*   **Config**:
    ```typescript
    storage: createJSONStorage(() => idbStorage),
  partialize: (state) => ({ entries: state.entries, metadata: state.metadata, tree: state.tree }),
    ```

---

## Phase 4: The Orchestrator (The "Write Side") (Complete)

### 4.1. Orchestrator Hook (`useJournalEntryPipeline`) (Complete)
*   **File**: `src/features/journal/hooks/use-journal-entry-pipeline.ts`
*   **Logic**: "Traffic Controller" for Voice, Manual, and Text inputs.
*   **Flow Stages**:
  1.  **Draft & Persist**: Generates ID, optimistic add to store, batch write to Firebase + tree append.
  2.  **Transcribe** (Voice only): Updates draft content + status in store + Firebase.
  3.  **Analyze**: Uses `useEntryOrchestrator` to compute results, updates entry + tree totals in Firebase.

### 4.2. Implementation Blueprint
```typescript
const processVoiceEntry = async (audioBlob: Blob) => {
  // 1. Create Draft
  const entryId = generateEntryId();
  optimisticAdd(createDraftEntry(entryId, "🎤 Transcribing..."));

  // 2. Transcribe
  const text = await transcribeAudio(audioBlob);
  updateEntry(entryId, { content: text, status: 'PENDING_ANALYSIS' });

  // 3. Analyze
  await runAnalysisPipeline(entryId, text);
};
```

### 4.3. Firebase Write Helpers (Complete)
*   **File**: `src/lib/firebase/journal.ts`
*   **Adds**: `updateJournalEntry`, `appendEntryToTree`, `incrementTreeTotals` for atomic updates.

### 4.4. Visual State Mapping
| Status | Visual Indicator | User Action |
| :--- | :--- | :--- |
| `DRAFT` | Normal text, gray badge | **Analyze** button valid |
| `TRANSCRIBING` | Skeleton Pulse | None (Wait) |
| `ANALYZING` | Spinner | None (Wait) |
| `COMPLETED` | Colored Badges | Edit / Delete |
| `ANALYSIS_FAILED` | ⚠️ Warning Icon | **Retry** button valid |

---

## Phase 5: UI Integration (Complete)

### 5.1. Smart Fetch Hook (`useCachedFetch`) (Complete)
*   **File**: `src/features/journal/hooks/use-cached-fetch.ts`
*   **Behavior**: Watches expanded months and triggers `fetchMonthEntries` only on cache miss.

### 5.2. Component Refactor (Complete)
*   **JournalView**: Renders `tree` and calls `useCachedFetch` for expanded months.
*   **EntryItem**: Atomic component renders from normalized `entries` map.

---

## Phase 6: Migration Utility (Complete)

### 6.1. Wipe & Reset
*   **File**: `src/stores/journal/migration.ts`
*   **Behavior**: Removes legacy `journal-store-v1` and `journal-store-v2` keys and marks completion.
*   **Trigger**: Runs on JournalFeature boot if migration flag is missing.
