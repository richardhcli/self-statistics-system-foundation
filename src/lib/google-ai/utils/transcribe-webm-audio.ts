import { GoogleGenAI } from "@google/genai";
import { withTimeout } from "./with-timeout";
import { getApiKey } from "./get-api-key";

/**
 * Transcribes complete WebM audio file to text using Gemini API (batch mode).
 * 
 * This is the primary transcription pathway:
 * - Processes complete audio file after recording stops
 * - Returns plain text transcription (no metadata extraction)
 * - Used by both auto-submit (journal entry creation) and manual review flows
 * 
 * **Architecture:**
 * - MediaRecorder captures WebM audio during recording
 * - User can click "Record" (auto-submit flow) or "To Text" (review flow)
 * - Both send the complete WebM blob to Gemini for batch transcription
 * - Difference is in post-transcription handling:
 *   * Auto-submit: transcription → useCreateJournalEntry (immediate AI analysis)
 *   * Manual review: transcription → textarea (user can edit before submitting)
 * 
 * **Web Speech API:**
 * - Runs parallel to MediaRecorder for display-only real-time preview
 * - User sees live transcription as they speak
 * - Web Speech text is NOT used; only Gemini transcription is official
 * - Falls back to silent recording if Web Speech API unavailable
 * 
 * @param audioBlob - WebM audio blob from MediaRecorder
 * @returns {Promise<string>} Plain text transcription of audio content
 * @throws {Error} If API key not configured or transcription fails
 * 
 * @example
 * ```typescript
 * // After user clicks "to text" button
 * const transcription = await transcribeWebmAudio(audioBlob);
 * setTextAreaValue(transcription);  // User reviews before submitting
 * 
 * // After user clicks "record" button (on stop)
 * const transcription = await transcribeWebmAudio(audioBlob);
 * createJournalEntry(transcription);  // Immediate entry creation with AI
 * ```
 */
export const transcribeWebmAudio = async (audioBlob: Blob): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google API key not configured. Please add API key to settings.');
  }

  // Convert blob to base64
  const buffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const audioBase64 = btoa(binary);

  const ai = new GoogleGenAI({ apiKey });
  
  // Use preview model first, fallback to stable 2.0
  const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.0-flash'];
  let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: audioBase64,
                },
              },
              {
                text: 'Transcribe this audio to text. Return only the transcribed text, nothing else.',
              },
            ],
          },
          config: {
            temperature: 0,
          },
        }),
        30000, // 30 second timeout
        'transcribeWebmAudio'
      );
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!response) {
    throw lastError ?? new Error('Transcription failed: No available Gemini model responded.');
  }

  const transcribedText = response.text || '';
  
  if (!transcribedText.trim()) {
    console.warn('[transcribeWebmAudio] Warning: Empty transcription returned');
    return '';
  }

  console.log('[transcribeWebmAudio] Transcription complete:', transcribedText.length, 'characters');
  return transcribedText.trim();
};
