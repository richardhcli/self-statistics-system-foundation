import { Type } from "@google/genai";
import { GENERALIZATION_PROMPT } from "../../config/prompts";
import { getAiInstance } from "../get-ai-instance";
import { withTimeout } from "../with-timeout";

/**
 * generalizeConcept
 * Developer Utility - Abstraction Chain Builder
 * 
 * Takes the results of the 3-layer pipeline (actions, skills, characteristics)
 * and generates a deep abstraction chain linking them to higher-level concepts.
 * The chain terminates at "progression" as the ultimate root concept.
 * 
 * @param ai - Pre-initialized GoogleGenAI instance
 * @param actions - List of specific actions
 * @param skills - List of intermediate skills
 * @param characteristics - List of high-level characteristics
 * @returns Object containing an array of generalization links with weights
 */
export async function generalizeConcept(
  actions: string[],
  skills: string[],
  characteristics: string[]
): Promise<{
  chain: { child: string; parent: string; weight: number }[];
}> {
  const ai = await getAiInstance();

  try {
    const response = await withTimeout(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: GENERALIZATION_PROMPT(actions, skills, characteristics),
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              chain: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    child: { type: Type.STRING },
                    parent: { type: Type.STRING },
                    weight: { type: Type.NUMBER }
                  },
                  required: ['child', 'parent', 'weight']
                }
              }
            },
            required: ['chain'],
          },
        },
      }),
      30000,
      'generalizeConcept'
    );

    return JSON.parse(response.text || '{"chain":[]}');
  } catch (error) {
    console.warn('⚠️ generalizeConcept failed, using empty chain:', error);
    return { chain: [] };
  }
}
