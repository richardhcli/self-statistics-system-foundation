
Here is the blueprint for the **Status** and **Level** views, utilizing the semantic mapping and progression root logic from your documentation.

---

## 🏗️ Blueprint: Status & Leveling UI

### 1. The Data Strategy (State-to-Body)

The UI should not perform calculations. It should use a selector-based approach to pull derived data from your "Brain" via the "Memory."

* **Logic Source:** `src/systems/progression/formulas.ts`.
* **State Source:** `useStatsStore` and `useCdagStore`.
* **Derived Data:** The UI needs "Power Levels" calculated as mastery percentages across domain clusters.

---

### 2. Status View (`status-view.tsx`)

**Goal:** A comprehensive RPG-style dashboard showing the 7 core attributes (Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership).

Update the gemini prompt (src\lib\google-ai\config\prompts.ts) to "pull" the characteristic towards these core attributes if possible, before ending at the ultimate characteristic of "progression". 

Modify the default state to contain all 7 of these core attributes. 

Modify graph fragment merging to also merge new edges as well, if the graph fragment has a new edge between two already existing nodes, if necessary. 

**Key Components:**

* **Attribute Hex/Radar Chart:** A visual representation of the 7 attributes.
* **Mastery Progress Bars:** Deterministic growth bars showing how close an attribute is to the next "Power Level".
* **Recent Gains List:** A log of the last (up to 5) 5 Journal entries and the specific "Neural Impact" (EXP) they had on the graph.
* **Skill list:** A display of high level skills, grouped by their corresponding characteristic (closest "characteristic" node parent of skill). Only display the top 5 groups (up to 5), and the top 5 skills per group (up to 5). 


**Action Plan:**

1. **Map Attributes:** Create a component that iterates through the 7 core attributes defined in your documentation.
2. **Calculate Percentages:** Use the system logic to divide the node's current weight by the max theoretical weight for that level.
3. **Sync with CDAG:** Ensure the "Progression Root" (the ultimate concept) is displayed as the "Global Mastery" score.

---

### 3. Leveling View (`level-view.tsx`)

**Goal:** A focused, high-dopamine screen showing the player's current Level and XP progress toward the next threshold.

**Key Components:**
* **Global Level Badge:** Large display of the `stats.level` value.
* **Linear XP Bar:** Shows `currentXP` relative to `getTotalExpForLevel(currentLevel + 1)`.

**Action Plan:**

1. **XP Normalization:** Implement a helper to calculate the percentage: .
3. **Path Visibility:** Display which "Skills" contributed most to the current level, reflecting the **Upward Flow** intensity from the algorithm. Do this by looking at the highest experience of a skill exp node and the highest level of a skill exp node.  

---

## 📄 Summary for AI Agents (Implementation Checklist)

```yaml
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

```