# AI Pipeline Strategy

**Last Updated:** February 7, 2026

## 1. Core Architecture: Model Fallback

The system runs on a **Primary → Fallback** strategy for all AI operations. This ensures that we can leverage the speed of experimental models (`gemini-3-flash-preview`) while maintaining the reliability of stable models (`gemini-2.0-flash`).

*   **Primary Model:** `gemini-3-flash-preview` (Fast, experimental)
*   **Secondary Model:** `gemini-2.0-flash` (Stable, proven reliability)
*   **Configuration:**
    *   **Temperature:** 0.0 (Strict Determinism)
    *   **Fallback Logic:** If primary fails or times out, the system seamlessly retries with the secondary model.

## 2. The Semantic Analysis Pipeline

The primary function of the AI is to convert unstructured journal text into a structured semantic knowledge graph. This is achieved through a **Single-Pass Topology** prompt.

### Single-Prompt Optimization
Instead of making multiple API calls, we use one highly optimized "Stuffed Prompt" that performs multiple classification tasks simultaneously:

1.  **Action Extraction**: Identifies 1-5 broad gerund-based actions (e.g., "Debugging", "Running").
2.  **Duration Estimation**: Extracts integer minutes from natural language time references.
3.  **Skill Mapping**: Maps actions to parent skills (e.g., Debugging → Software Engineering).
4.  **Attribute mapping**: Maps skills to 7 core RPG-style attributes (Vitality, Intellect, etc.).
5.  **Generalization**: (Optional) builds a vertical abstraction chain up to the "progression" root node.

**Key Implementation File:**
See `SINGLE_PROMPT_TOPOLOGY_PROMPT` in [src/lib/google-ai/config/stuffed-prompt.ts](../../src/lib/google-ai/config/stuffed-prompt.ts).

### Analysis Execution Logic
The execution logic resides in `text-to-topology.ts`. It handles the model fallback loop and sets aggressive timeouts (45s per attempt) to ensure the UI remains responsive even if the primary model hangs.

**Key Implementation File:**
See `processTextToLocalTopologySinglePrompt` in [src/lib/google-ai/utils/single-prompt/text-to-topology.ts](../../src/lib/google-ai/utils/single-prompt/text-to-topology.ts).

## 3. Voice Transcription Pipeline

The system uses a dedicated pipeline for processing WebM audio blobs directly from the browser's `MediaRecorder`.

### Workflow
1.  **Capture**: Browser records audio blobs.
2.  **Upload**: Complete blob is sent to Gemini (Batch Mode).
3.  **Fallback**: Attempts `gemini-3-flash-preview` first, falling back to `gemini-2.0-flash`.
4.  **Output**: Returns raw text for subsequent semantic analysis.

**Key Implementation File:**
See `transcribeWebmAudio` in [src/lib/google-ai/utils/transcribe-webm-audio.ts](../../src/lib/google-ai/utils/transcribe-webm-audio.ts).

## 4. Prompt Injection Safety

To prevent "prompt injection" failures where user input (like quotes or newlines) breaks the JSON instruction set, all user content is strictly serialized before being injected into prompt templates.

**Pattern Used:**
```typescript
// Safe Injection Pattern
contents: SINGLE_PROMPT_TOPOLOGY_PROMPT(JSON.stringify(userText))
```

## 5. Gamification Rules (Experience Propagation)

The AI's semantic graph output directly drives the gamification engine:

1.  **Time = EXP**: 30 minutes of effort ≈ 1.0 Experience Point.
2.  **Flow**: EXP flows upwards from Actions → Skills → Attributes → Progression.
3.  **Weighting**: If an action is mapped to multiple skills, EXP is split or averaged based on edge weights defined by the AI.

This creates a deterministic "Neural Brain" where identical journal entries consistently result in identical stat growth.
