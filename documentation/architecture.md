# Application Architecture

The Journal & Graph AI application is built following the **Bulletproof React** pattern, which prioritizes modularity, scalability, and clear separation of concerns.

## Local-First Philosophy
The application operates on a "Local-First" basis to ensure maximum privacy and zero-latency interactions.
- **Persistence**: All user data is stored in **IndexedDB** within the browser across specialized stores (`journal`, `cdagTopology`, `playerStatistics`, `visualGraph`).
- **State Management**: React state acts as the runtime source of truth, synchronized with IndexedDB via the `use-persistence` hook.
- **Synchronization Hub**: The `stores/user-data` module acts as a bridge, aggregating all sub-stores into a unified `AppData` object for atomic local saving and future remote backend synchronization.

## Folder Structure

### `/app`
The root entry point and global providers.
- `app.tsx`: Main orchestrator and view navigation logic.
- `provider.tsx`: Global React Context and Suspense boundaries.

### `/features`
Domain-specific modules. Each feature is self-contained with its own components, types, and internal logic.
- **`journal/`**: Voice recording, hierarchical entry management, and AI analysis.
- **`visual-graph/`**: D3-based stable DAG visualization (The "Concept Graph").
- **`developer-graph/`**: Advanced architectural editor for manual and AI-driven hierarchy design.
- **`statistics/`**: Dashboards and UI components for displaying user progress.
- **`settings/`**: Discord-style interface for profile and system configuration.

### `/lib`
Core infrastructure abstractions.
- `db.ts`: IndexedDB configuration and CRUD wrappers.
- `google-ai/`: Comprehensive Gemini SDK integration and prompt templates.
- `api-client.ts`: Standardized fetch wrapper for future REST operations.
- `soulTopology/`: Brain structure utilities (topology merge, propagation, AI generalization).

### `/stores`
Global business logic that spans multiple features.
- **`cdag-topology/`**: Store declaration and API wrappers for the topology state.
- **`player-statistics/`**: The core progression engine (EXP propagation).
- **`user-data/`**: The **Centralized Synchronization Hub** that unifies all state into `AppData`.

### `/hooks`
Cross-cutting concerns like persistence and root state access.