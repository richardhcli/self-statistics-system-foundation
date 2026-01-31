# AI & Gamification Logic

## Google Gemini AI Pipeline

The application utilizes `gemini-3-flash-preview` for high-speed, structured semantic analysis. To ensure the highest level of consistency and reproducibility (essential for a stable "Neural Brain"), the system is strictly hardcoded to a **Cognitive Temperature of 0.0**.

### The 3-Layer Semantic Extraction
When a user provides input (voice or text), the system executes a chained classification process:
1. **Action Extraction**: Gemini identifies 1-5 "General Actions" (e.g., "Debugging" or "Squats").
2. **Skill Mapping**: Actions are aggregated into professional or personal "Skills" (e.g., "Frontend Engineering").
3. **Attribute Characterization**: Skills are mapped to core RPG-style attributes (Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership).

### Deep Abstraction & Generalization
If the classification pipeline detects a **new Characteristic** that doesn't yet exist in your `cdagTopology`, it triggers the **Generalization Engine**:
- **Vertical Hierarchy**: It generates a chain of up to 10 increasingly abstract concepts.
- **The Progression Root**: The engine is instructed to stop generation once it reaches the ultimate concept: **"progression"**.
- **Proportionality**: Each link in the chain (Child -> Parent) includes a weight representing the proportion of the parent concept comprised by the child.

## Gamification: Experience Propagation

The core engine uses **Path-Weighted Cumulative Averaging** to ensure balanced progression.

### The Algorithm
1. **Injection**: EXP is injected into "Action" nodes based on the entry's duration (30 mins = 1.0 EXP base unit).
2. **Upward Flow**: EXP flows to parents. The intensity is multiplied by the edge weight.
3. **Path Normalization**: If a node is reached by multiple paths, the intensity is averaged across all paths rather than summed.
4. **The Progression Anchor**: All paths eventually terminate at the **"progression"** root node, providing a global metric of lifetime advancement.

### Status System
- **Power Levels**: Attributes on the Statistics tab are calculated as a percentage of mastery across domain clusters.
- **Deterministic Growth**: Because the temperature is locked at 0.0, identical journal inputs will result in identical neural impact, making your "Player Level" a reliable reflection of effort.