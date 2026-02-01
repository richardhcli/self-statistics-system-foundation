import { Type } from "@google/genai";
import { CHARACTERISTIC_ABSTRACTION_PROMPT } from "../../config/prompts";
import { withTimeout } from "../with-timeout";

/**
 * mapSkillsToCharacteristics
 * STEP 3 of the 3-layer topology pipeline
 * 
 * Takes a list of skill labels and returns 1-2 high-level human characteristic traits.
 * Characteristics represent intrinsic human qualities and abstract potential.
 * E.g., ["Frontend Engineering", "Design"] → "Creativity", "Intellect"
 * These map to RPG-style attributes: Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership.
 * Includes failsafes for API timeouts and errors.
 * 
 * @param ai - Pre-initialized GoogleGenAI instance
 * @param skills - List of identified skill sets
 * @returns Array of 1-2 characteristic labels, or ["Core Qualia"] if analysis fails
 */
export async function mapSkillsToCharacteristics(ai: any, skills: string[]): Promise<string[]> {
  if (skills.length === 0) return ["Balanced Characteristic"];
  if (!ai || !ai.models) {
    console.warn('⚠️ AI instance is undefined in mapSkillsToCharacteristics');
    return ["Balanced Characteristic"];
  }

  try {
    const response = await withTimeout<{ text?: string }>(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: CHARACTERISTIC_ABSTRACTION_PROMPT(skills),
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              characteristics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 1-2 abstract characteristics"
              }
            },
            required: ['characteristics'],
          },
        },
      }),
      30000,
      'mapSkillsToCharacteristics'
    );

    const data = JSON.parse(response.text || '{"characteristics":[]}');
    return data.characteristics.length > 0 ? data.characteristics : ["Core Qualia"];
  } catch (error) {
    console.warn('⚠️ mapSkillsToCharacteristics failed, using failsafe:', error);
    return ["Balanced Characteristic"];
  }
}