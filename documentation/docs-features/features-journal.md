# Feature: Journal

The Journal is the primary data ingestion point, transforming raw input into structured neural data.

## Functional Components
- **VoiceRecorder**: Captures audio with real-time level visualization. Transcribes via Gemini.
- **ManualEntryForm**: Allows for text logging with optional duration and custom action tags.
- **JournalView**: A recursive explorer organizing records by Year > Month > Day.

## Neural Impact Analysis
Every processed entry calculates its contribution to the user's growth:
- **Impact Breakdown**: The `EntryResults` component lists every node (Action, Skill, and Characteristic) that received EXP.
- **Automatic Generalization**: If you log an activity that falls under a new category, the AI automatically generates a bridge to the "progression" root node. This ensures the Concept Graph always remains a connected, single-root system.

## Deterministic Classification
- **Zero-Temperature Logic**: AI classification is deterministic. This means your "Player Stats" are a rigorous mathematical reflection of your logged activities, free from the randomness of typical LLM outputs.
- **Metadata Tracking**: Impact data is persisted within the entry's `metadata.nodeIncreases` field for historical auditing.