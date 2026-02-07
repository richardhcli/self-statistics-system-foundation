# Application Architecture

**Purpose**: High-level overview of project structure and design philosophy  
**Audience**: Project onboarding and architectural decisions  
**Related**: [ai-guidelines.md](../ai-guidelines.md#2-directory-structure--responsibilities), [architecture-lib-vs-stores.md](./architecture-lib-vs-stores.md)

The Journal & Graph AI application is built following the **Bulletproof React** pattern, which prioritizes modularity, scalability, and clear separation of concerns.

## Hybrid Read-Aside Philosophy
The application operates on a **Hybrid Read-Aside** basis, using Firebase as the Source of Truth and Zustand as a Smart Cache.
- **Source of Truth**: Firebase Firestore (Cloud).
- **Caching**: Independent Zustand stores act as the runtime cache, validated against cloud metadata.
- **Persistence**: `indexedDB` persists the cache for offline support and fast boot times.
- **Blueprint**: See [2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md](../change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md) for the implementation details.

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
collection of pure, data-agnostic functions

### `/stores`
Global business logic that spans multiple features, organized as independent Zustand stores.
- **`journal/`**: Store for journal entries (historical records). Pattern C hooks: `useJournal()` / `useJournalActions()`.
- **`cdag-topology/`**: Store for the logical hierarchy (Second Brain core). Pattern C hooks: `useCdagTopology()` / `useCdagTopologyActions()`.
- **`player-statistics/`**: The core progression engine (EXP propagation). Pattern C hooks: `usePlayerStatistics()` / `usePlayerStatisticsActions()`.
- **`user-information/`**: User identity and profile settings. Pattern C hooks: `useUserInformation()` / `useUserInformationActions()`.
- **`ai-config/`**: AI processing configurations. Pattern C hooks: `useAiConfig()` / `useAiConfigActions()`.
- **`user-integrations/`**: External integration configs and event logs. Pattern C hooks: `useUserIntegrations()` / `useUserIntegrationsActions()`.
- **`root/`**: **Composition store for serialization ONLY**. Provides `serializeRootState()` and `deserializeRootState()` for persistence, import/export, and backend sync. Never accessed during runtime.

### `/hooks`
Cross-cutting concerns like persistence, orchestration, and root state access.
- **`use-persistence.ts`**: Hydrates stores from IndexedDB on app load and saves changes.
- **`use-entry-orchestrator.ts`**: Coordinates cross-store updates during journal entry processing