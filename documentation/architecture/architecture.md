# Application Architecture

**Purpose**: High-level overview of project structure and design philosophy  
**Audience**: Project onboarding and architectural decisions  
**Last Updated**: February 10, 2026  
**Related**: [ai-guidelines.md](../../ai-guidelines.md), [architecture-lib-vs-stores.md](./architecture-lib-vs-stores.md)

The Journal & Graph AI application is built following the **Bulletproof React** pattern, which prioritizes modularity, scalability, and clear separation of concerns.

## Hybrid Read-Aside Philosophy
The application operates on a **Hybrid Read-Aside, Sync-Behind** basis, using Firebase as the Source of Truth and Zustand as a Smart Cache.
- **Source of Truth**: Firebase Firestore (Cloud).
- **Caching**: Independent Zustand stores act as the runtime cache, validated against cloud metadata.
- **Persistence**: `indexedDB` persists the cache for offline support and fast boot times.
- **Write Flow**: UI → Zustand → IndexedDB → Async sync to Firebase.
- **Read Flow**: UI → Zustand/IndexedDB → Fetch from Firebase on cache miss or stale.

**Implementation Status**:
- **Read-aside stores**: Journal, CDAG topology, player statistics.
- **Firestore-backed**: User information, AI config, user integrations (loaded on auth, persisted to Firestore).

## Folder Structure

### `/systems`
Pure domain logic ("The Brain"). No React, no stores, no side-effects — unit-testable in isolation. Aliased as `@systems/*`.
- **`progression/`**: Centralized game logic — EXP propagation engine, scaling formulas, logarithmic level curve (`Level = floor(log2(EXP + 1))`), state mutations with level-up detection, 7 core attribute definitions, and orchestration utilities.

### `/app`
The root entry point and global providers.
- `app.tsx`: Main orchestrator and view navigation logic.
- `provider.tsx`: Global React Context and Suspense boundaries.

### `/features`
Domain-specific modules. Each feature is self-contained with its own components, types, and internal logic.
- **`journal/`**: Voice recording, hierarchical entry management, and AI analysis pipeline.
- **`visual-graph/`**: D3-based stable DAG visualization (The "Concept Graph").
- **`developer-graph/`**: Advanced architectural editor for manual and AI-driven hierarchy design.
- **`statistics/`**: RPG character sheet — radar chart, attribute cards, level views, experience rankings.
- **`settings/`**: Discord-style interface for profile, AI, privacy, and notification configuration.
- **`debug/`**: Debug console with batch injection, datastore inspection, force-sync panel, and auth diagnostics.
- **`auth/`**: Authentication UI (Google Sign-In + Guest).
- **`integration/`**: Webhooks and Obsidian sync configuration.
- **`billing/`**: Billing UI placeholder.
- **`user-info/`**: User identity and RPG session metadata.

### `/lib`
External bridge abstractions — Firebase wrappers, AI pipelines, topology logic. Pure, data-agnostic functions that don't know about React or Zustand.
- **`firebase/`**: Auth services, CRUD helpers, graph read-aside service, journal service, player statistics sync.
- **`google-ai/`**: Gemini pipeline configuration, prompt templates, and utility functions.
- **`soulTopology/`**: Graph merging, classification, and topology update logic.

### `/stores`
Global state management as independent Zustand stores (data cache only). Each follows the Separated Selector Facade Pattern (Pattern C).
- **`journal/`**: Journal entries + tree index. Hooks: `useJournalEntries()` / `useJournalActions()`.
- **`cdag-topology/`**: CDAG graph cache (nodes, edges, structure). Hooks: `useGraphNodes()` / `useGraphEdges()` / `useGraphActions()`.
- **`player-statistics/`**: EXP + level stats per node. Hooks: `usePlayerStatistics()` / `usePlayerStatisticsActions()`.
- **`user-information/`**: User identity and profile settings. Hooks: `useUserInformation()` / `useUserInformationActions()`.
- **`ai-config/`**: AI processing configurations. Hooks: `useAiConfig()` / `useAiConfigActions()`.
- **`user-integrations/`**: External integration configs and event logs. Hooks: `useUserIntegrations()` / `useUserIntegrationsActions()`.
- **`root/`**: **Composition store for serialization ONLY**. Provides `serializeRootState()` and `deserializeRootState()` for import/export. Never accessed during runtime.

### `/hooks`
Cross-cutting concerns like persistence, orchestration, and root state access.
- **`use-persistence.ts`**: Hydrates stores from IndexedDB on app load.
- **`use-entry-orchestrator.ts`**: Coordinates cross-store updates during journal entry processing (calls `@systems/progression` for EXP calculations).
- **`use-global-store-sync.ts`**: Global store synchronization on auth state changes.
- **`use-cdag-structure.ts`**: CDAG manifest fetch, subscription, and detail expansion.

### `/components`
Shared UI components used across features.
- **`layout/`**: Main layout shell, header, navigation.
- **`tabs/`**: Reusable horizontal tab navigation.
- **`notifications/`**: Guest banner, toast notifications.

### `/providers`
Global React context providers.
- **`auth-provider.tsx`**: Firebase Auth state observer, exposes `useAuth()` hook.

### `/routes`
Route definitions and protection.
- **`index.ts`**: Route configuration.
- **`protected-route.tsx`**: Gates `/app/*` routes based on auth state.