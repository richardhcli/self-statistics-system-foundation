# Changelog Summary

**Purpose**: High-level change log for project evolution  
**Status**: Active — see `/change-log/` for detailed session logs  
**Last Updated**: February 10, 2026

---

## Recent Major Milestones

### ✅ Completed: Progression System & RPG Status Views (Feb 9-10, 2026)
- **Status**: COMPLETE
- **Details**: Extracted all game logic into `src/systems/progression/` (pure, no React). Built full RPG dashboard: 7-axis radar chart, attribute cards, level views, skill clusters. Added `recharts` dependency. Defined 7 core attributes with icons and descriptions. AI prompt now guides classification toward attributes organically.
- **Impact**: Centralized game math; UI now shows meaningful character sheet data.

### ✅ Completed: Firebase Hybrid Read-Aside Architecture (Feb 3-8, 2026)
- **Status**: COMPLETE
- **Details**: Migrated journal, graph, player statistics, and user settings to Firebase Firestore as the source of truth. Zustand + IndexedDB serve as the persistent cache. Added Google Auth + Anonymous guest with profile seeding.
- **Impact**: Cloud-backed data with offline-first UX.

### ✅ Completed: Graph Read-Aside Pipeline (Feb 7-9, 2026)
- **Status**: COMPLETE
- **Details**: CDAG topology uses a manifest-first hydration pipeline: IndexedDB boot → manifest fetch → subscription → detail expansion with 30-minute TTL.
- **Impact**: Fast graph boot with authoritative Firebase overwrite.

### ✅ Completed: Migration to GraphState Unified Format (Feb 1-2, 2026)
- **Status**: COMPLETE
- **Details**: Removed all legacy topology formats; all operations now use unified `GraphState` interface with `nodes` and `edges` records.
- **Impact**: Simplified codebase, improved type safety.

### ✅ Completed: Entry Pipeline Refactor (Feb 2, 2026)
- **Status**: COMPLETE
- **Details**: Refactored journal entry processing to use unified Orchestrator pattern. Cross-store coordination via `use-entry-orchestrator.ts`.
- **Impact**: Cleaner cross-store coordination, atomic updates.

---

## Architecture Decisions

### Systems Layer (`src/systems/`)
- Pure domain logic separated from React and stores.
- Aliased as `@systems/*` in tsconfig and vite config.
- Currently contains `progression/` module with engine, formulas, constants, state mutations, orchestrator.

### Edge Weights
- `CdagAdjacencyTarget.weight` is **required** (float [0, 1]). Weights always exist on edges.

### 7 Core Attributes
- AI is **guided but not forced** to classify toward Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership.
- Organic characteristics are preserved when they don't cleanly fit.

---

## Archive

Detailed session logs are available in `/change-log/`.

## Quick Links

- **Current Architecture**: See [../ai-guidelines.md](../ai-guidelines.md)
- **State Management**: See [state-management/state-management-README.md](./state-management/state-management-README.md)
- **Detailed Changes**: See `./change-log/` directory for session-by-session breakdown
