import { GoogleGenAI, Type } from "@google/genai";
import { withTimeout } from "./with-timeout";
import { getApiKey } from "./get-api-key";

/**
 * Complete transcription response with extracted structured date/time information.
 * Generated after recording is complete from full audio file.
 *
 * @interface VoiceToTextResponse
 * @property {string} year - Extracted or inferred year (YYYY format)
 * @property {string} month - Extracted or inferred month (MM format)
 * @property {string} day - Extracted or inferred day (DD format)
 * @property {string} time - Extracted or inferred time (HH:MM format)
 * @property {string} content - Full transcribed journal entry text
 */
export interface VoiceToTextResponse {
  year: string;
  month: string;
  day: string;
  time: string;
  content: string;
}

/**
 * Transcribes complete audio and extracts structured date/time information.
 * Called after recording stops to process entire audio file.
 *
 * This differs from `processVoiceToTextStreaming` which:
 * - Processes partial audio chunks during recording
 * - Returns only raw transcription text
 * - Used for real-time feedback
 *
 * This function:
 * - Processes complete, final audio file
 * - Extracts and infers date/time information
 * - Returns structured, validated response
 * - Used for persistent journal entry storage
 *
 * @param {string} audioBase64 - Base64-encoded complete audio file (WebM format)
 * @returns {Promise<VoiceToTextResponse>} Complete transcription with extracted metadata
 *
 * @example
 * // After recording stops
 * const result = await processVoiceToText(completeAudioBase64);
 * console.log(result.content); // "I went to the gym today..."
 * console.log(result.year);    // "2026"
 */
export const processVoiceToText = async (audioBase64: string): Promise<VoiceToTextResponse> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google API key not configured. Please add API key to settings.');
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await withTimeout(
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
          { text: `Transcribe and extract the date/time. Current: ${new Date().toLocaleString()}` }
        ],
      },
      config: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            journalEntry: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.STRING },
                month: { type: Type.STRING },
                day: { type: Type.STRING },
                time: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ['year', 'month', 'day', 'time', 'content'],
            }
          },
          required: ['journalEntry'],
        },
      },
    }),
    30000,
    'processVoiceToText'
  );

  const jsonStr = (response.text || '').trim();
  const result = JSON.parse(jsonStr || '{}');
  return result.journalEntry;
};