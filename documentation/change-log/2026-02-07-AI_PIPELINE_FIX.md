# AI & Gamification Fixes (2026-02-07)

## Issue: Manual Entry Pipeline Timeouts

**Symptoms:**
- Voice recorder entries worked successfully.
- Manual entries frequently failed with `Error: processTextToLocalTopologySinglePrompt timed out after 120s`.
- Manual entries resulted in "empty" completed entries with no stats/skills gained.

**Root Analysis:**
1.  **Prompt Malformation (Fixed earlier):** Manual text inputs containing quotes or newlines were breaking the prompt injection string `"${text}"`. This was resolved by using `JSON.stringify(text)`.
2.  **Model Latency/Hang:** The `gemini-3-flash-preview` model occasionally hangs on specific complex prompts, hitting the default 120s timeout with no recovery strategy.
3.  **Lack of Fallback:** `transcribeWebmAudio` implemented a multi-model fallback strategy, but `processTextToLocalTopologySinglePrompt` was hardcoded to a single model.

**Resolution:**
1.  **Implemented Model Fallback Strategy:** The topology pipeline now iterates through `gemini-3-flash-preview` (primary) and `gemini-2.0-flash` (stable fallback).
2.  **Optimized Timeouts:** Reduced per-model timeout to **45 seconds** (from 120s) to trigger fallbacks faster while keeping the total potential wait time reasonable.
3.  **Sanitized Input:** Confirmed strict `JSON.stringify` serialization for prompt injection to handle special characters safely.

**Impact:**
- Significantly higher reliability for manual entries.
- If the experimental Flash model hangs, the system automatically recovers using the stable V2 model.
