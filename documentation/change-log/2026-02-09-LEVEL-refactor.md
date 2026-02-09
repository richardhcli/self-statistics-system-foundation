# Blueprint: Progression System Refactor ("The Game Brain")

**Date:** 2026-02-09  
**Target Architecture:** Centralized Game Logic (`src/systems`)  
**Previous State:** Logic scattered across `lib/`, `stores/`, and `utils/`.

---

## 🏗️ 1. Architecture Philosophy: `src/systems`

We are moving strictly away from "infrastructure" folders (`lib/`, `utils/`) for core domain logic (NOT ANYTHING ELSE)
- **`src/systems/`**: The "Brain". Contains pure, deterministic game logic, math, and algorithms: context-heavy. They embody the "Brain" of your specific application and contain the proprietary logic that makes your app unique; Knowledge: They understand the relationship between a stores. Logic Type: High-level, deterministic "Game Rules".
- **`src/stores/`**: The "Memory". Dumb data buckets that hold state but do not calculate it.
- **`src/features/`**: The "Body". UI components that display state and trigger system actions.
KEEP: 
- src/stores/ (The Memory): Local, short-term storage (Zustand). These are "dumb" buckets that hold the current state of the player and the graph but do not know how that data was derived.
- src/lib/ (The Eyes): The bridge to the external world. This is your Firebase (long-term memory/persistence) and Gemini AI (external perception/sensory processing).
- src/hooks/ (The Nervous System): The connectors. Hooks like useProgressionSync act as the firing neurons that pull data from Memory, process it through the Brain, and save the result via the Nervous System.
- src/utils/ (The Toolbox): Utils are context-free. They are generic helpers that could be plucked out of your app and used in a completely different project (like a weather app or a to-do list) without modification.

**Goal:** Future developers should look at `src/systems/progression` and understand the entire math model of the application without seeing a single React Component or Firebase call.

---

## 📅 2. Implementation Plan

### Phase A: Environment Configuration
**Goal:** Establish the `@systems` namespace for clear import signaling.

1.  **Update `tsconfig.json`**:
    Add path alias: `"@systems/*": ["./src/systems/*"]`.
2.  **Update `vite.config.ts`**:
    Add alias resolution: `'@systems': path.resolve(__dirname, './src/systems')`.

### Phase B: Core Logic Migration
**Goal:** Extract and centralize the "Path-Weighted Cumulative Averaging" engine and EXP formulas.

1.  **Create Directory**: `src/systems/progression/`
2.  **Move & Rename Files**:
    *   `src/lib/soulTopology/utils/back-parent-propagation.ts` → **`src/systems/progression/engine.ts`**
        *   *Refinement:* Ensure it takes generic interfaces, not Store types, if possible.
    *   `src/stores/player-statistics/utils/scaled-logic.ts` → **`src/systems/progression/formulas.ts`**
        *   *Content:* `parseDurationToMultiplier`, `scaleExperience`, and new Level Curve logic.
    *   `src/utils/player-data-update/exp-state-manager.ts` → **`src/systems/progression/state-mutations.ts`**
        *   *Content:* Pure function that takes `currentStats` + `updates` and returns `nextStats`.
    *   **Create `src/systems/progression/constants.ts`**:
        *   `COGNITIVE_TEMPERATURE = 0.0`
        *   `PROGRESSION_ROOT_ID = "progression"`
        *   `BASE_EXP_UNIT = 1.0` (30 mins)

### Phase C: Orchestration Decoupling
**Goal:** The Orchestrator should coordinate the *System* and the *Store*, not contain the logic itself.

1.  **Refactor `use-entry-orchestrator.ts`**:
    *   **Import** from `@systems/progression`.
    *   **Remove** imports from `lib/soulTopology` or `stores/player-statistics/utils`.
    *   **Flow**:
        1.  Receive Entry Inputs.
        2.  Call `ProgressionSystem.calculatePropagation(topology, seeds)`.
        3.  Call `ProgressionSystem.calculateLevelDeltas(currentStats, propagationResult)`.
        4.  Dispatch specific updates to `usePlayerStatisticsActions` (e.g., `applyExpDelta(delta)`).

2.  **Clean up `src/stores/player-statistics/`**:
    *   Delete `utils/` folder inside the store.
    *   The store actions should become simple setters/mergers.

### Phase D: Leveling Logic (The Missing Piece)
**Goal:** Define the actual mathematical curve for "Leveling Up" in `formulas.ts`.

1.  **Implement `getLevelForExp(totalExp)`**:
    *   Define the curve (e.g., `Level = floor(sqrt(EXP) * CONSTANT)` or Linear `Level = floor(EXP / 100)`).
    *   *Decision:* Use a quadratic curve to make higher levels harder, or kept linear for this prototype?
    *   *Default Plan:* `Level = Math.floor(TotalExp / 10) + 1` (Linear, matching current logic but centralized).

---

## 🔍 3. Verification Checklist

- [x] **No Business Logic in Stores**: `src/stores` contains only state definitions and `set()` calls.
- [x] **No Game Logic in Lib**: `src/lib` contains only generic utilities (Firebase wrappers, graph algos not specific to game rules).
- [x] **System Independence**: Code in `src/systems/progression` can be unit tested without mocking React hooks.
- [x] **Imports Updated**: All references to `back-parent-propagation` and `scaled-logic` point to `@systems/progression`.

---

## 📝 4. Git Commit Blueprint

```bash
git commit -m "Refactor: Extract progression logic to src/systems/progression

- Establish @systems alias for core game logic
- Migrate cumulative averaging engine to systems/progression/engine.ts
- Centralize EXP scaling and level curves in systems/progression/formulas.ts
- Decouple PlayerStatistics store from calculation logic
- Update Entry Orchestrator to consume System API"
```

---

## ✅ 5. Implementation Summary (2026-02-09)

Refactor completed. All four phases executed per this blueprint.

### What changed
- Created `src/systems/progression/` with 6 files (constants, engine, formulas, state-mutations, orchestrator, index).
- **Leveling curve** changed from linear (`EXP / 10 + 1`) to **logarithmic** (`floor(log2(EXP + 1))`). All EXP values now rounded to 4 decimal places.
- `@systems/*` path alias added to [tsconfig.json](../../tsconfig.json) and [vite.config.ts](../../vite.config.ts).
- Deleted 6 legacy files from `stores/player-statistics/utils/`, `utils/player-data-update/`, and `lib/soulTopology/utils/`.
- Updated imports in: [use-entry-orchestrator.ts](../../src/hooks/use-entry-orchestrator.ts), [player-statistics store](../../src/stores/player-statistics/store.ts), [types hub](../../src/types/index.ts), [soulTopology index](../../src/lib/soulTopology/index.ts), [debug view](../../src/features/debug/components/player-stats-view.tsx).
- Store `types.ts` now re-exports from `@systems/progression` (single source of truth).

### File map
| New System File | Migrated From |
|---|---|
| [engine.ts](../../src/systems/progression/engine.ts) | `lib/soulTopology/utils/back-parent-propagation.ts` |
| [formulas.ts](../../src/systems/progression/formulas.ts) | `stores/player-statistics/utils/scaled-logic.ts` |
| [state-mutations.ts](../../src/systems/progression/state-mutations.ts) | `stores/player-statistics/utils/exp-state-manager.ts` |
| [orchestrator.ts](../../src/systems/progression/orchestrator.ts) | `stores/player-statistics/utils/progression-orchestrator.ts` |
| [constants.ts](../../src/systems/progression/constants.ts) | New |
| [index.ts](../../src/systems/progression/index.ts) | New (barrel) |
