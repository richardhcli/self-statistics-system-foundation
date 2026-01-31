
# Global Stores

The `stores/` directory contains global business logic and state structures that are shared across multiple features.

## 🏗 Store Hierarchy

### 1. `cdag-topology`
- **Responsibility**: Logic for building and modifying the Brain's structure.
- **Key Files**: 
  - `utils/merge-topology.ts`: Handles merging AI-generated fragments.
  - `utils/back-parent-propagation.ts`: The algorithm for calculating how EXP flows up the tree.

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
1. Specific logic is executed in `cdag-topology` or `player-statistics`.
2. The results are aggregated into the `AppData` object managed by `user-data`.
3. The `use-persistence` hook detects the change in `AppData` and commits the entire block to IndexedDB or triggers a remote Sync.
