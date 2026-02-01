# State Management Architecture

This project uses a layered approach to state management following [Bulletproof React](https://github.com/alan2207/bulletproof-react) principles:

## State Categories

### 1. **Server State** (React Query)
- **Location**: Features with async API operations
- **Use Case**: Data fetched from remote sources, webhook logs, integrations
- **Pattern**: Query hooks with automatic caching and synchronization
- **Examples**: User settings from server, sync logs, integration histories

### 2. **Global State** (Zustand)
- **Location**: `stores/` folder
- **Use Case**: Application-wide data that affects multiple features
- **Pattern**: Store factories with getters and setters
- **Current Stores**:
  - `stores/app-data`: Main AppData state (topology, journal, stats, user info)
  - `stores/player-statistics`: Player progression and leveling
  - `stores/cdag-topology`: CDAG topology structure
  - `stores/user-data`: User identity and configuration

**Why Zustand over Context?**
- Simpler API for complex state
- No provider boilerplate
- Better performance (only subscribed components re-render)
- Easier to persist to IndexedDB
- Cleaner for utilities that need state access (non-React functions)

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
  const { getData, setData } = useAppDataStore();
  
  const handleClick = () => {
    const current = getData();
    setData({ ...current, someField: 'updated' });
  };
};
```

### Accessing Global State in Utilities
```typescript
import { useAppDataStore } from '@/stores/app-data';

export const myUtilityFunction = async () => {
  const { getData, updateData } = useAppDataStore();
  const data = getData();
  
  // Do something with data
  updateData(prev => ({ ...prev, field: newValue }));
};
```

### Hydration Strategy
1. Component mounts → `useAppData` hook loads from IndexedDB
2. IndexedDB data → Zustand store via `setData`
3. Persistence hook watches store changes → auto-saves to IndexedDB
4. Components subscribe to store updates → re-render on changes

## Inconsistencies to Avoid

- ❌ Don't pass `AppData` and `setData` as parameters through multiple function layers
- ✅ Do use store getters/setters where needed
- ❌ Don't use Zustand for temporary UI state
- ✅ Do use `useState` for local component state
- ❌ Don't make Zustand stores for data that should come from a server
- ✅ Do consider React Query for async/server data

## Migration Path

Existing code using Context/useState pattern:
1. Replace `setData` parameter with `useAppDataStore().setData`
2. Replace `currentAppData` parameter with `useAppDataStore().getData()`
3. Remove parameters from function signatures
4. Update all callers

Example:
```typescript
// Before
export const createJournalEntry = async (
  context: CreateContext,
  setData: Setter,
  currentAppData: AppData
) => { /* ... */ }

// After
export const createJournalEntry = async (context: CreateContext) => {
  const { getData, setData } = useAppDataStore();
  const currentAppData = getData();
  /* ... */
}
```
