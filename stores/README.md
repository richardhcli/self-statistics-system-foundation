
# Global Stores

The `stores/` directory contains global business logic and state structures that are shared across multiple features.

## 🏗 Store Hierarchy

### 1. `cdag-topology`
- **Responsibility**: Store declaration and API wrappers for the topology state.
- **Key Files**: 
  - `types.ts`: Topology node and graph types.
  - `api/`: Sync endpoints for topology snapshots.
- **Brain Logic Location**: `lib/soulTopology` now owns merging, propagation, and AI-driven hierarchy utilities.

### 2. `player-statistics`
- **Responsibility**: Core leveling and progression mechanics.
- **Key Files**:
  - `utils/exp-state-manager.ts`: Detects level-ups and handles state deltas.
  - `utils/progression-orchestrator.ts`: Bridges the Topology propagation with the Statistics state.

### 3. `user-data` (The Hub)
- **Responsibility**: **Centralized Persistence & API Orchestration**.
- **Role**: This is the master store. It defines the `AppData` type which wraps every other store (Journal, Topology, Stats, Integrations).
- **Complexity Management**: To reduce network chatter, all synchronization with external databases or APIs is centralized here. A single `pushFullSync` call transmits the entire `AppData` state, ensuring data integrity across all sub-stores.

## 🔄 Data Flow
When an update occurs:
1. Brain structure logic runs in `lib/soulTopology` alongside `player-statistics` progression.
2. The results are aggregated into the `AppData` object managed by `user-data`.
3. The `use-persistence` hook detects the change in `AppData` and commits the entire block to IndexedDB or triggers a remote Sync.
