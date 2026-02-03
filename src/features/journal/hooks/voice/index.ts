/**
 * Voice Recording Hooks
 * 
 * Atomic, reusable hooks for voice recording orchestration.
 * Each function has single responsibility:
 * - useVoiceAutoSubmit: Orchestrator (Stage 1-3 coordination)
 * - useTranscribeAudio: Stage 2 (Gemini + fallback)
 * - useAnalyzeVoiceEntry: Stage 3 (AI analysis)
 */

export { useVoiceAutoSubmit } from './use-voice-auto-submit';
export { useTranscribeAudio } from './use-transcribe-audio';
export { useAnalyzeVoiceEntry } from './use-analyze-voice-entry';
