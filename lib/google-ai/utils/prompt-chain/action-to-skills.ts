import { Type } from "@google/genai";
import { SKILL_MAPPING_PROMPT } from "../../config/prompts";
import { withTimeout } from "../with-timeout";

/**
 * mapActionsToSkills
 * STEP 2 of the 3-layer topology pipeline
 * 
 * Takes a list of specific action labels and returns 1-2 representative skill sets.
 * Skills represent functional competencies that aggregate multiple related actions.
 * E.g., ["Debugging", "Code Review"] → "Frontend Engineering"
 * Includes failsafes for API timeouts and errors.
 * 
 * @param ai - Pre-initialized GoogleGenAI instance
 * @param actions - List of specific action verbs/phrases
 * @returns Array of 1-2 skill labels, or ["General Skill"] if analysis fails
 */
export async function mapActionsToSkills(ai: any, actions: string[]): Promise<string[]> {
  if (actions.length === 0) return ["General Capability"];
  if (!ai || !ai.models) {
    console.warn('⚠️ AI instance is undefined in mapActionsToSkills');
    return ["General Capability"];
  }

  try {
    const response = await withTimeout<{ text?: string }>(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: SKILL_MAPPING_PROMPT(actions),
        config: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of 1-2 representative skills"
              }
            },
            required: ['skills'],
          },
        },
      }),
      30000,
      'mapActionsToSkills'
    );

    const data = JSON.parse(response.text || '{"skills":[]}');
    return data.skills.length > 0 ? data.skills : ["General Skill"];
  } catch (error) {
    console.warn('⚠️ mapActionsToSkills failed, using failsafe:', error);
    return ["General Capability"];
  }
}