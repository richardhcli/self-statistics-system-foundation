
# Global Stores

The `stores/` directory contains global business logic and state structures that are shared across multiple features.

## 🏗 Store Hierarchy

### 1. `app-data` ⭐ (Canonical Store - Zustand)
- **Responsibility**: **Centralized Global State Management**.
- **Role**: This is the master store using Zustand. It defines the `AppData` type which wraps every other store (Journal, Topology, Stats, Integrations).
- **Key Files**: 
  - `store.ts`: Zustand store implementation with getters and setters
  - `types.ts`: AppData interface and all related types
  - `constants.ts`: INITIAL_APP_DATA
  - `utils/get-current-data.ts`: Centralized data accessor for non-React code
  - `utils/data-portability.ts`: Export/import utilities
- **Architecture**: Follows Bulletproof React patterns with Zustand for global state management
- **Usage**: 
  - Components: `const { getData, setData } = useAppDataStore()`
  - Utilities: `const data = getCurrentData()` + `useAppDataStore.getState().setData(...)`

### 2. `cdag-topology`
- **Responsibility**: Topology-specific types and utilities.
- **Key Files**: 
  - `types.ts`: Topology node and graph types (CdagTopology, CdagNodeData).
  - `api/`: Sync endpoints for topology snapshots.
- **Brain Logic Location**: `lib/soulTopology` owns merging, propagation, and AI-driven hierarchy utilities.
- **Note**: State is managed in `app-data` store, this folder contains types and specialized logic.

### 3. `player-statistics`
- **Responsibility**: Core leveling and progression mechanics.
- **Key Files**:
  - `types.ts`: PlayerStatistics type definitions
  - `utils/exp-state-manager.ts`: Detects level-ups and handles state deltas (moved to utils/player-data-update)
  - `utils/progression-orchestrator.ts`: Bridges the Topology propagation with the Statistics state (moved to utils/player-data-update)
- **Note**: Progression logic moved to `utils/player-data-update/` for better separation of concerns.

### 4. `user-data` ⚠️ (Deprecated - Compatibility Layer)
- **Status**: **DEPRECATED** - Use `app-data` instead
- **Purpose**: Provides backward compatibility for legacy imports
- **Migration**: All files now re-export from `app-data`
- **Files**: 
  - `types.ts`: Re-exports from `app-data/types`
  - `constants.ts`: Re-exports from `app-data/constants`
  - `utils/`: Re-exports from `app-data/utils`
  - `api/`: User-specific API endpoints (user-information, sync)
- **Action Required**: Update imports from `@/stores/user-data` to `@/stores/app-data`

## 🔄 Data Flow
When an update occurs:
1. Brain structure logic runs in `lib/soulTopology` alongside progression utilities in `utils/player-data-update/`.
2. Results are written directly to the Zustand store via `useAppDataStore.getState().setData()`.
3. The `use-persistence` hook detects the change in `AppData` and commits the entire block to IndexedDB.
4. Components subscribed to store slices automatically re-render.

## 📦 State Management Pattern
- **Global State**: Zustand (`app-data` store)
- **Server State**: React Query (for async/external data)
- **Local State**: useState (for UI-only state)
- **Persistence**: IndexedDB via `usePersistence` hook
- **Centralized Access**: `getCurrentData()` for utilities, `useAppDataStore()` for components
