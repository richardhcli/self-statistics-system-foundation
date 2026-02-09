This plan consolidates the conversation history—refactoring from a fragmented **Bulletproof React** architecture to a centralized **Domain System**—integrated with the semantic extraction and EXP propagation logic defined in your documentation.

---

## 🏗️ Blueprint: Progression System Refactor

### Phase 1: Domain Centralization

**Goal:** Extract "game rules" from features/stores into a headless `@systems/progression` package.

* **Create `src/systems/progression/**`: Move all pure logic here.
* **Establish `formulas.ts**`:
* Implement **Leveling Curve**:  (or preferred power law).
* Implement **EXP Calculation**: Logic for converting `entry.duration` to base EXP (e.g., 30m = 1.0 unit).


* **Define `constants.ts**`: Hardcode the **Cognitive Temperature (0.0)** and **Progression Root ("progression")** anchor.
* **Path Aliasing**: Update `tsconfig.json` and `vite.config.ts` to map `@systems/*` to `src/systems/*`.

### Phase 2: Propagation Engine Implementation

**Goal:** Implement the **Path-Weighted Cumulative Averaging** algorithm.

* **Recursive Upward Flow**:
* Create a utility that traverses the `cdag_topology` from "Action" nodes to the "Progression" root.
* Apply edge weights during flow: .


* **Path Normalization**:
* Implement logic to **average** intensity across multiple paths reaching the same node to prevent EXP bloat.


* **Deterministic Validation**: Ensure identical inputs yield identical state changes, utilizing the 0.0 temperature constraint.

### Phase 3: Store & API Decoupling

**Goal:** Reduce stores to "thin" data buckets and move side-effect logic to orchestrators.

* **Zustand Store Cleanup**:
* Remove `utils/` from `stores/player-statistics`.
* `useStatsStore` should only contain `totalExp`, `level`, and a basic `updateStats` action.


* **Orchestration Hook (`use-progression-sync.ts`)**:
* Bridge the `journal`, `topology`, and `stats` stores.
* Trigger the AI pipeline  Calculate EXP  Propagate Upward  Determine Level Up.


* **Firebase Relocation**:
* Move statistics-specific Firestore calls from `lib/firebase` to `features/statistics/api/`.



### Phase 4: UI & Leveling Integration

**Goal:** Surface the new progression metrics to the user.

* **Level-Up Logic**: Add a listener or check within the orchestrator to trigger "Level Up" events/modals.
* **Component Updates**:
* Update `StatisticsView` to calculate mastery percentages across domain clusters.
* Implement progress bars using `getTotalExpForLevel(currentLevel + 1)` as the denominator.



---

## 📄 Summary for AI Agents (Token Optimized)

```yaml
context: Bulletproof React + Zustand + Firebase
core_logic: Semantic extraction (3-layer) + EXP propagation (CDAG)
refactor_target: Centralize logic into src/systems/progression
math_model:
  level_calc: Power Law / Quadratic
  exp_flow: Path-Weighted Cumulative Averaging (Normalized)
  ai_temp: 0.0 (Deterministic)
dependencies:
  - @systems/progression (Domain logic)
  - @stores (State)
  - @features/statistics (UI)

```

**Would you like me to generate the TypeScript code for the `Path-Weighted Cumulative Averaging` utility based on your CDAG node structure?**