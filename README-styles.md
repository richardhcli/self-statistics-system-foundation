# Journal & Graph AI - 



## Persistence & Sync Strategy

The application follows a **Local-First** philosophy.
1. **Source of Truth**: The React state acts as the runtime source of truth.
2. **Persistence**: The `use-persistence` hook automatically commits the `AppData` state to IndexedDB on every change.
3. **Synchronization**: Remote synchronization is a secondary bridge. To ensure data integrity across the weighted graph, the app uses **Centralized Batch Sync** via the `stores/user-data` API.

### Core Endpoints:
- `/sync/full`: Primary endpoint for pushing/pulling the entire `AppData` snapshot.
- `/journal`: Secondary endpoint for historical record management.
- `/cdag-topology`: Secondary endpoint for hierarchy management.
- `/player-statistics`: Secondary endpoint for experience and leveling data.

