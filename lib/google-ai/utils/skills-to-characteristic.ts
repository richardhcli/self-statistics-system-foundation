import { Type } from "@google/genai";
import { CHARACTERISTIC_ABSTRACTION_PROMPT } from "../config/prompts";

/**
 * MODULE: Skills-to-Characteristic
 * Functional Description:
 * This component represents the root level of the Action Graph.
 * It maps functional skills to intrinsic human qualities and descriptive qualia.
 */

/**
 * mapSkillsToCharacteristics
 * Functional Description:
 * Takes a list of skill labels and returns 1-2 high-level human characteristic traits.
 * 
 * @param ai - Pre-initialized GoogleGenAI instance
 * @param skills - List of identified skill sets
 */
export async function mapSkillsToCharacteristics(ai: any, skills: string[]): Promise<string[]> {
  if (skills.length === 0) return ["Balanced Characteristic"];

  const response = await ai.models.generateContent({
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
  });

  const data = JSON.parse(response.text || '{"characteristics":[]}');
  return data.characteristics.length > 0 ? data.characteristics : ["Core Qualia"];
}