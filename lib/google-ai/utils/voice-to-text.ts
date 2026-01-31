import { GoogleGenAI, Type } from "@google/genai";

export interface VoiceToTextResponse {
  year: string;
  month: string;
  day: string;
  time: string;
  content: string;
}

/**
 * Transcribes audio and extracts structured date/time information using Gemini.
 */
export const processVoiceToText = async (audioBase64: string): Promise<VoiceToTextResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
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
  });

  const jsonStr = (response.text || '').trim();
  const result = JSON.parse(jsonStr || '{}');
  return result.journalEntry;
};