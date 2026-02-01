import { Type } from "@google/genai";
import { ACTION_EXTRACTION_PROMPT } from "../../config/prompts";
import { withTimeout } from "../with-timeout";

/**
 * extractActions
 * STEP 1 of the 3-layer topology pipeline
 * 
 * Identifies 1-5 specific action verbs/phrases from the user's text entry.
 * Uses Gemini with temperature=0 for deterministic classification.
 * Includes failsafes for API timeouts and errors.
 * 
 * @param ai - Pre-initialized GoogleGenAI instance
 * @param text - User's journal entry text
 * @returns Array of action labels (e.g., ["Debugging", "Writing"]), or ["General Activity"] if failed
 */
export async function extractActions(ai: any, text: string): Promise<string[]> {
  if (!ai || !ai.models) {
    console.warn('⚠️ AI instance is undefined in extractActions');
    return ["General Activity"];
  }

  try {
    const response = await withTimeout<{ text?: string }>(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: ACTION_EXTRACTION_PROMPT(text),
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 1-5 action verbs/phrases"
              }
            },
            required: ['actions'],
          },
        },
      }),
      30000,
      'extractActions'
    );
    const data = JSON.parse(response.text || '{"actions":[]}');
    return data.actions || ["General Activity"];
  } catch (error) {
    console.warn('⚠️ extractActions failed, using failsafe:', error);
    return ["General Activity"];
  }
}
