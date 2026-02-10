# AI & Gamification Logic

**Last Updated**: February 10, 2026

## Google Gemini AI Pipeline

The application utilizes `gemini-3-flash-preview` (primary) with `gemini-2.0-flash` (fallback) for high-speed, structured semantic analysis. To ensure the highest level of consistency and reproducibility (essential for a stable "Neural Brain"), the system is strictly hardcoded to a **Cognitive Temperature of 0.0** (defined in `@systems/progression/constants`).

### The 3-Layer Semantic Extraction
When a user provides input (voice or text), the system executes a chained classification process:
1. **Action Extraction**: Gemini identifies 1-5 "General Actions" (e.g., "Debugging" or "Squats").
2. **Skill Mapping**: Actions are aggregated into professional or personal "Skills" (e.g., "Frontend Engineering").
3. **Attribute Characterization**: Skills are mapped toward 7 core RPG-style attributes. The AI is **guided but not forced** — organic characteristics are preserved when they don't cleanly fit.

### The 7 Archetypal Attributes
The system defines seven gravity-well attributes that the AI is encouraged to classify toward:
- **Vitality** — Physical resilience, fitness, and health
- **Intellect** — Analytical capacity and technical rigor
- **Wisdom** — Metacognition, judgment, and depth
- **Social** — Charisma, collaboration, and empathy
- **Discipline** — Focus, self-control, and habits
- **Creativity** — Innovation, design, and artistry
- **Leadership** — Vision, influence, and direction

Defined in [src/systems/progression/constants.ts](../src/systems/progression/constants.ts) as `CORE_ATTRIBUTES`.

### Deep Abstraction & Generalization
If the classification pipeline detects a **new Characteristic** that doesn't yet exist in the `cdagTopology`, it triggers the **Generalization Engine**:
- **Vertical Hierarchy**: It generates a chain of up to 10 increasingly abstract concepts.
- **The Progression Root**: The engine is instructed to stop generation once it reaches the ultimate concept: **"progression"**.
- **Proportionality**: Each link in the chain (Child -> Parent) includes a weight representing the proportion of the parent concept comprised by the child.

Implementation: Prompt templates in [src/lib/google-ai/config/prompts.ts](../src/lib/google-ai/config/prompts.ts). Orchestration and topology updates in [src/lib/soulTopology/](../src/lib/soulTopology/index.ts).

## Gamification: The Progression System

All game logic is centralized in [src/systems/progression/](../src/systems/progression/index.ts) — a pure, side-effect-free module with no React or store dependencies.

### Experience Propagation (Path-Weighted Cumulative Averaging)
1. **Injection**: EXP is injected into "Action" nodes based on the entry's duration (30 mins = 1.0 EXP base unit, configurable via `MINUTES_PER_EXP_UNIT`).
2. **Upward Flow**: EXP flows to parents. The intensity is multiplied by the edge weight.
3. **Path Normalization**: If a node is reached by multiple paths, the intensity is averaged across all paths rather than summed.
4. **The Progression Anchor**: All paths eventually terminate at the **"progression"** root node, providing a global metric of lifetime advancement.

Engine: [src/systems/progression/engine.ts](../src/systems/progression/engine.ts) — `calculateParentPropagation(nodes, edges, initialValues)`.

### Logarithmic Level Curve
- **Formula**: `Level = floor(log2(EXP + 1))`
- **Progress**: `getExpProgress(totalExp)` returns fractional progress [0, 1] toward the next level.
- **Thresholds**: `getExpForLevel(level)` returns the EXP needed to reach a given level (`2^level - 1`).
- **Precision**: All EXP values rounded to 4 decimal places (`EXP_PRECISION`).

Formulas: [src/systems/progression/formulas.ts](../src/systems/progression/formulas.ts).

### State Mutations
- **Level-up detection**: `updatePlayerStatsState(currentStats, expIncreases)` returns `{ nextStats, totalIncrease, levelsGained }`.
- **Types**: `NodeStats { experience: number; level: number }`, `PlayerStatistics = Record<string, NodeStats>`.

Mutations: [src/systems/progression/state-mutations.ts](../src/systems/progression/state-mutations.ts).

### Status System (UI)
- **Radar Chart**: 7-axis visualization of core attribute levels using Recharts.
- **Attribute Cards**: Grid of cards showing icon, level, description, and XP progress bar per attribute.
- **Skill Clusters**: Skills grouped by closest characteristic parent via BFS traversal.
- **Global Level Badge**: Computed from total accumulated XP via the logarithmic curve.
- **Deterministic Growth**: Because the temperature is locked at 0.0, identical journal inputs will result in identical neural impact, making the player level a reliable reflection of effort.

UI: [src/features/statistics/components/](../src/features/statistics/components/statistics-view.tsx).