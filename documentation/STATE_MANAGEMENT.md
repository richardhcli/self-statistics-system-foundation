# State Management Architecture

This project uses a layered approach to state management following [Bulletproof React](https://github.com/alan2207/bulletproof-react) principles:

## State Categories

### 1. **Server State** (React Query)
- **Location**: Features with async API operations
- **Use Case**: Data fetched from remote sources, webhook logs, integrations
- **Pattern**: Query hooks with automatic caching and synchronization
- **Examples**: User settings from server, sync logs, integration histories

### 2. **Global State** (Zustand)
- **Location**: `stores/app-data/` folder (canonical store)
- **Use Case**: Application-wide data that affects multiple features
- **Pattern**: Single Zustand store with typed getters and setters
- **Store Structure**:
  - `stores/app-data`: ⭐ **Canonical Zustand store** - Contains entire AppData state
    - Manages: topology, journal, stats, user info, integrations, AI config
    - API: `getData()`, `setData()`, `updateData()`, slice getters
  - `stores/cdag-topology`: Types and topology-specific utilities only
  - `stores/player-statistics`: Types and progression utilities (logic in `utils/player-data-update/`)
  - `stores/user-data`: ⚠️ **DEPRECATED** - Compatibility layer, re-exports from app-data

**Why Zustand over Context?**
- Simpler API for complex state
- No provider boilerplate
- Better performance (only subscribed components re-render)
- Easier to persist to IndexedDB
- Cleaner for utilities that need state access (non-React functions)
- Direct `getState()` API for non-component code (no hook rules violations)

### 3. **Local State** (useState)
- **Location**: Individual React components
- **Use Case**: UI-only state (form inputs, toggles, animations, view state)
- **Examples**: `isProcessing`, `view`, form values, modal open/close

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ App.tsx (Local State: view, isProcessing)               │
├─────────────────────────────────────────────────────────┤
│ Feature Components (Local State: form, UI)              │
├─────────────────────────────────────────────────────────┤
│ API Layer (useAppDataStore.getData/setData)             │
├─────────────────────────────────────────────────────────┤
│ Zustand Store (Global: topology, stats, journal)        │
├─────────────────────────────────────────────────────────┤
│ Persistence (IndexedDB via usePersistence hook)         │
└─────────────────────────────────────────────────────────┘
```

## Usage Patterns

### Accessing Global State in Components
```typescript
import { useAppDataStore } from '@/stores/app-data';

const MyComponent = () => {
  // Hook API - causes re-renders on changes
  const data = useAppDataStore(state => state.data);
  const setData = useAppDataStore(state => state.setData);
  
  const handleClick = () => {
    setData({ ...data, someField: 'updated' });
  };
  
  // Or use slice selectors for better performance
  const journal = useAppDataStore(state => state.data.journal);
};
```

### Accessing Global State in Utilities (Non-React)
```typescript
import { useAppDataStore } from '@/stores/app-data';
import { getCurrentData } from '@/stores/app-data';

export const myUtilityFunction = async () => {
  // Method 1: Using getCurrentData helper
  const data = getCurrentData();
  
  // Method 2: Direct getState() access (no hook rules)
  const { getData, setData } = useAppDataStore.getState();
  const currentData = getData();
  
  // Update the store
  setData({ ...currentData, field: newValue });
};
```

### Entry Pipeline Pattern (AI Processing)
```typescript
// 1. Create loading placeholder immediately
const loadingEntry = { content: 'loading', duration: 'loading', ... };
setData(updateJournalHTML(data, date, loadingEntry));

// 2. Run async processing (orchestrator updates store internally)
await entryOrchestrator({ entry, actions, useAI, duration, dateInfo });

// 3. Component re-renders automatically when store updates
```

### Hydration Strategy
1. Component mounts → `useAppData` hook loads from IndexedDB
2. IndexedDB data → Zustand store via `setData`
3. Persistence hook watches store changes → auto-saves to IndexedDB
4. Components subscribe to store updates → re-render on changes

## Inconsistencies to Avoid

- ❌ Don't pass `AppData` and `setData` as parameters through multiple function layers
- ✅ Do use store getters/setters where needed (`getCurrentData()` or `getState()`)
- ❌ Don't use Zustand for temporary UI state
- ✅ Do use `useState` for local component state
- ❌ Don't make Zustand stores for data that should come from a server
- ✅ Do consider React Query for async/server data
- ❌ Don't call `useAppDataStore()` hook in utility functions (causes hook rule violations)
- ✅ Do use `useAppDataStore.getState()` in non-React code
- ❌ Don't import from `@/stores/user-data` (deprecated)
- ✅ Do import from `@/stores/app-data` (canonical)

## Migration Path

### From Context/useState to Zustand (Completed)
1. ✅ Created `stores/app-data` Zustand store
2. ✅ Moved all types to `app-data/types.ts`
3. ✅ Moved constants to `app-data/constants.ts`
4. ✅ Created `getCurrentData()` helper in `app-data/utils/`
5. ✅ Updated all imports to use `app-data`
6. ✅ Deprecated `user-data` as compatibility layer

### From user-data to app-data (In Progress)
Any remaining imports from `stores/user-data` should be updated:

```typescript
// Before (deprecated)
import { AppData } from '@/stores/user-data/types';
import { getCurrentData } from '@/stores/user-data';
import { INITIAL_APP_DATA } from '@/stores/user-data/constants';

// After (canonical)
import { AppData } from '@/stores/app-data'; // or '@/types'
import { getCurrentData } from '@/stores/app-data';
import { INITIAL_APP_DATA } from '@/stores/app-data';
```

### Utility Function Pattern
```typescript
// ❌ Before (parameter drilling)
export const processEntry = async (
  entry: string,
  currentData: AppData,
  setData: (data: AppData) => void
) => {
  const result = await analyze(entry);
  setData({ ...currentData, updated: result });
}

// ✅ After (Zustand getState)
export const processEntry = async (entry: string) => {
  const { getData, setData } = useAppDataStore.getState();
  const currentData = getData();
  
  const result = await analyze(entry);
  setData({ ...currentData, updated: result });
}
```

## Current Architecture Status

### ✅ Completed
- Zustand store implementation in `app-data`
- Type consolidation
- `getCurrentData()` helper
- Store write-back in `entryOrchestrator`
- Loading placeholder pattern in `createJournalEntry`
- Hook-based journal subscription with `useJournalStore`

### 🔄 Ongoing
- Migrating remaining `user-data` imports to `app-data`
- Cleaning up deprecated compatibility layer
