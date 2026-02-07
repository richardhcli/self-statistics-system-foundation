# Plan of Action: Journal Refactor using Global Storage Blueprint

**Date**: February 7, 2026
**Merged from**: `journal-blueprint.md`
**Implements**: `documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md`
**Status**: Phase 2 Complete

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

## Phase 3: Store & Cache (The "Store Side")

### 3.1. Journal Storage Refactor
*   **File**: `src/stores/journal/store.ts`
*   **Interface**:
    ```typescript
    interface JournalState {
      entries: Record<string, JournalEntryData>; // Normalized ID -> Data
      tree: JournalTreeStructure; // The structure from Firebase
      metadata: Record<string, { lastFetched: number }>; // Cache TTL
      
      actions: {
        addEntryPlaceholder: (entry: JournalEntryData) => void;
        updateEntryStatus: (id: string, status: string, data?: any) => void;
        setTree: (tree: JournalTreeStructure) => void;
        fetchMonthEntries: (year: string, month: string) => Promise<void>;
      }
    }
    ```

### 3.2. Persistence (Optimization)
*   **Mechanism**: `persist` middleware with `idb-keyval`.
*   **Config**:
    ```typescript
    storage: createJSONStorage(() => idbStorage),
    partialize: (state) => ({ entries: state.entries, metadata: state.metadata, tree: state.tree }),
    ```

---

## Phase 4: The Orchestrator (The "Write Side")

### 4.1. Orchestrator Hook (`useJournalEntryPipeline`)
*   **Logic**: "Traffic Controller" for Voice, Manual, and Text inputs.
*   **Flow Stages**:
    1.  **Draft & Persist**: Generates ID, updates Store Optimistically, writes "Draft" to Firebase.
    2.  **Transcribe** (Voice only): Updates Draft text.
    3.  **Analyze**: Calls AI, updates Entry with stats, updates Tree totals.

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

### 4.3. Visual State Mapping
| Status | Visual Indicator | User Action |
| :--- | :--- | :--- |
| `DRAFT` | Normal text, gray badge | **Analyze** button valid |
| `TRANSCRIBING` | Skeleton Pulse | None (Wait) |
| `ANALYZING` | Spinner | None (Wait) |
| `COMPLETED` | Colored Badges | Edit / Delete |
| `ANALYSIS_FAILED` | ⚠️ Warning Icon | **Retry** button valid |

---

## Phase 5: UI Integration

### 5.1. Smart Fetch Hook (`useCachedFetch`)
*   **Logic**:
    ```typescript
    const useJournalEntries = (year, month) => {
      const cacheKey = `${year}-${month}`;
      const lastFetched = metadata[cacheKey]?.lastFetched || 0;
      const isStale = (Date.now() - lastFetched) > (1000 * 60 * 5); // 5 mins

      useEffect(() => {
        if (!metadata[cacheKey] || isStale) {
          fetchEntries(year, month);
        }
      }, [year, month]);
      
      return getEntriesForMonth(entries, year, month);
    };
    ```

### 5.2. Component Refactor
*   **JournalView**: Renders `tree` (Lightweight).
*   **MonthContainer**: Rendered by View. Calls `useCachedFetch` on mount.
*   **EntryItem**: Atomic component. Uses `useFeatureItem(id)`.

---

## Phase 6: Migration Utility

### 6.1. Wipe & Reset
*   **Script**: One-time utility to purge legacy `YYYY/MM/DD` IDB keys.
*   **Trigger**: Run on app boot if "v2_migration_complete" flag is missing.
