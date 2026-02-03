import { GoogleGenAI } from "@google/genai";
import { withTimeout } from "./with-timeout";
import { getApiKey } from "./get-api-key";

/**
 * Transcribes audio to raw text without any metadata extraction.
 * Simple, direct transcription for real-time user feedback.
 *
 * @param {string} audioBase64 - Base64-encoded audio chunk (WebM format)
 * @returns {Promise<string>} Raw transcribed text
 *
 * @example
 * const transcription = await transcribeAudio(audioChunkBase64);
 * console.log(transcription); // "I went to the gym today"
 */
export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google API key not configured. Please add API key to settings.');
  }
  const ai = new GoogleGenAI({ apiKey });

  const response = await withTimeout(
    ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/webm", data: audioBase64 } },
          {
            text: "Transcribe the audio accurately. Return only the transcription text.",
          },
        ],
      },
      config: {
        temperature: 0,
      },
    }),
    15000,
    "transcribeAudio"
  );

  return (response.text || "").trim();
};
