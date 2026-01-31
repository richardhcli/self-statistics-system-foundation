import { Type } from "@google/genai";
import { SKILL_MAPPING_PROMPT } from "../config/prompts";

/**
 * MODULE: Action-to-Skills
 * Functional Description:
 * This component acts as the intermediate layer of the Action Graph.
 * It identifies the functional skills required to perform specific actions.
 */

/**
 * mapActionsToSkills
 * Functional Description:
 * Takes a list of specific action labels and returns 1-2 representative skill sets.
 * 
 * @param ai - Pre-initialized GoogleGenAI instance
 * @param actions - List of specific action verbs/phrases
 */
export async function mapActionsToSkills(ai: any, actions: string[]): Promise<string[]> {
  if (actions.length === 0) return ["General Capability"];

  const response = await ai.models.generateContent({
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
  });

  const data = JSON.parse(response.text || '{"skills":[]}');
  return data.skills.length > 0 ? data.skills : ["General Skill"];
}