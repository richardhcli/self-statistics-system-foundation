# AI & Gamification Pipeline Strategy

## Core Architecture: Gemini 3 Flash (Preview)

The system relies on a high-speed, deterministic "Neural Brain" using `gemini-3-flash-preview`. 

**Key Configuration:**
- **Temperature:** 0.0 (Strict Determinism)
- **Mode:** Single-Shot JSON Generation
- **Goal:** Consistent semantic topology from unstructured text.

## The Semantic Pipeline

The application transforms raw journal entries into a structured knowledge graph (Concept DAG) through a 3-layer definition process:

1.  **Action Extraction**: Identifies repeatable verb-based activities (e.g., "coding", "running").
2.  **Skill Mapping**: Groups actions into trainable competencies (e.g., "Software Engineering", "Athletics").
3.  **Attribute Characterization**: Maps skills to 7 core human attributes:
    *   **Vitality** (Physical)
    *   **Intellect** (Mental)
    *   **Wisdom** (Metacognitive)
    *   **Social** (Interpersonal)
    *   **Discipline** (Executive Function)
    *   **Creativity** (Generative)
    *   **Leadership** (Strategic)

## Optimization: The "Stuffed Prompt" Strategy

To reduce latency and API round-trips, we use a **Single-Prompt Topology** approach. Instead of 4 separate chained calls, a single consolidated prompt instructs the model to perform all classification steps in one pass.

### Prompt constraints for performance:
- **Conciseness**: Instructions are stripped of conversational filler.
- **Structured Output**: Enforced via JSON schema.
- **Explicit Mappings**: The model must return parent-child relationships explicitly to build the graph edges.
- **Validation**: Weights must sum to 1.0; duration must be an integer.

## Gamification Logic (Experience Propagation)

1.  **Injection**: User time (Duration) is converted to EXP (30 mins = 1.0 EXP).
2.  **Propagation**: EXP flows from Actions → Skills → Attributes.
3.  **Path-Weighted Averaging**: If a node has multiple parents, EXP is averaged to prevent inflation.
4.  **Progression Root**: All paths terminate at the "progression" node, measuring total lifetime growth.

For more details on the legacy architecture, see `../ai-and-gamification.md`.
