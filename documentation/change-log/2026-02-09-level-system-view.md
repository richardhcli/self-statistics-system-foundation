
# Blueprint: Status & Leveling Views (Sprint Implementation)

**Target:** 2026-02-09
**Ideology:** Sprint Mentality (Speed & Polish). Use standard libraries (`recharts`) for visualization.
**Core Concept:** 7 Archetypal Attributes exist as "Gravity Wells" in the graph, but the topology remains organic.

---

## 🏗️ 1. Core Systems & Data Configuration

### Step A: System Constants
**File:** `src/systems/progression/constants.ts`
**Action:** Define the 7 immutable attribute keys.
```typescript
export const CORE_ATTRIBUTES = [
  'Vitality',    // Physical
  'Intellect',   // Mental/Technical
  'Wisdom',      // Philosophical/Perspective
  'Social',      // Interpersonal
  'Discipline',  // Habits/Focus
  'Creativity',  // Innovation
  'Leadership',  // Influence
] as const;
```

### Step B: AI Prompt Refinement (Organic Growth)
**File:** `src/lib/google-ai/config/prompts.ts`
**Action:** Update `CHARACTERISTIC_ABSTRACTION_PROMPT`.
- **Constraint:** Do **NOT** strictly force classification into these 7.
- **Guidance:** Present them as "Archetypes" or "Primary Domains" to guide the AI, but allow it to generate specific characteristics (e.g., "Engineering", "Athletics", "Music") if they fit better.
- **Goal:** The graph forms organically (Actions -> Skills -> Characteristics), but naturally gravitates towards these 7 hubs where semantically appropriate.

### Step C: Graph Topology Handling
**File:** `src/stores/cdag-topology/store.ts` / `use-entry-orchestrator.ts`
**Action:** Verify graph fragment merging handles *new edges between existing nodes*.
- If Node A (existing) and Node B (existing) are identified by AI as related, the store `upsertEdge` must ensure this link is created to densify the graph.

---

## 🎨 2. UI Implementation Strategy

### Step D: Dependencies
**Action:** Install `recharts` for rapid, robust visualization.
```bash
npm install recharts
```

### Step E: Status View (`src/features/statistics/components/status-view.tsx`)
**Layout:** Comprehensive RPG-style Dashboard.

1.  **Radar Chart (Recharts):**
    -   **Data:** Map the 7 `CORE_ATTRIBUTES` to their current Node Value (Level).
    -   **Scale:** Normalize `value / max(values)` to create a balanced shape.
    -   **Fallback:** If an attribute node doesn't exist yet, value is 0.
2.  **Attribute Grid:**
    -   7 Cards representing the core attributes.
    -   **Display:** Icon (Lucide), Name, Level, Progress Bar (`getExpProgress`).
    -   **State:** Faded/Gray if the node has 0 XP/doesn't exist.
3.  **Recent Neural Impact:**
    -   List last 5 journal entries descending by date.
    -   **Display:** Entry excerpt + Total EXP gained (e.g., "+45 XP").
    -   **Source:** `useJournalEntries()` hook.
4.  **Skill Clusters:**
    -   **Algorithm:** Group distinct "Skill" type nodes by their parent "Characteristic" node.
    -   **Display:** Top 3-5 Characteristics by total XP, listing their top 3 Skills.
    -   **Visual:** Nested list or grouped tags.

### Step F: Leveling View (`src/features/statistics/components/level-view.tsx`)
**Goal:** High-Dopamine Progression Feedback.

1.  **Global Level Badge:**
    -   Big typography displaying `stats['progression'].level`.
2.  **XP Bar:**
    -   Standard linear progress bar.
    -   **Label:** `Current / Next Threshold` (e.g., "1,250 / 2,048 XP").
    -   **Logic:** Utilize `@systems/progression/formulas`: `getExpForLevel`.
3.  **Path Visibility (Top Contributors):**
    -   **Identify "MVP Nodes":** Nodes with the highest `experience` * `level` weight.
    -   **Display:** Top 3 contributors to the current Global Level. (e.g. "Software Architecture: Lvl 12").

---


## 🔍 3. Implementation Checklist

- [ ] **Install:** `recharts`.
- [ ] **Update:** `constants.ts` with `CORE_ATTRIBUTES`.
- [ ] **Refine:** `prompts.ts` for organic but guided classification.
- [ ] **Build:** `StatusView` with Radar + Attribute Cards + Recent Entries + Skill List.
- [ ] **Build:** `LevelView` with Global Badge + XP Bar + MVPs.
- [ ] **Helper:** Create `src/features/statistics/utils/group-skills.ts` for cluster logic.

### Guidance: ## 📄 Summary for AI Agents (Implementation Checklist)

feature: "Statistics Display"
files:
  - "src/features/statistics/components/status-view.tsx"
  - "src/features/statistics/components/level-view.tsx"
dependencies:
  - "@systems/progression/formulas" # For level thresholds and mastery %
  - "@systems/progression/constants" # For the 7 core attributes
logic_hooks:
  - "useProgressionSync" # Listen for real-time EXP updates
ui_elements:
  - Radar Chart (7 Attributes)
  - Progress Bars (Deterministic Growth)
  - Level Badge (Current Global Level)

