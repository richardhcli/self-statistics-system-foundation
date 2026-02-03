import { GoogleGenAI, Type } from "@google/genai";
import { withTimeout } from "./with-timeout";

/**
 * Response from streaming transcription of partial audio chunks.
 * Contains incremental transcription results as audio is being recorded.
 *
 * @interface StreamingTranscriptionResponse
 * @property {string} content - Partial transcription text from audio chunk
 * @property {boolean} isFinal - Whether this is final or intermediate transcription
 */
export interface StreamingTranscriptionResponse {
  content: string;
  isFinal: boolean;
}

/**
 * Transcribes a partial audio chunk during live recording.
 * Called periodically (every 2-5 seconds) to provide incremental transcription.
 *
 * This is different from `processVoiceToText` which:
 * - Processes complete audio after recording ends
 * - Extracts structured date/time information
 * - Returns final, verified transcription
 *
 * This function:
 * - Processes partial audio chunks during recording
 * - Returns raw transcription text only
 * - Used for real-time display feedback
 *
 * @param {string} audioBase64 - Base64-encoded audio chunk (WebM format)
 * @returns {Promise<StreamingTranscriptionResponse>} Partial transcription content
 *
 * @example
 * // Call every 3 seconds during recording
 * const response = await processVoiceToTextStreaming(audioChunkBase64);
 * console.log(response.content); // "I went to the gym today"
 */
export const processVoiceToTextStreaming = async (
  audioBase64: string
): Promise<StreamingTranscriptionResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await withTimeout(
    ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/webm", data: audioBase64 } },
          {
            text: "Transcribe the audio as accurately as possible. Return only the transcription text, nothing else.",
          },
        ],
      },
      config: {
        temperature: 0,
      },
    }),
    15000,
    "processVoiceToTextStreaming"
  );

  const content = (response.text || "").trim();

  return {
    content,
    isFinal: false, // Intermediate transcription during recording
  };
};
