import { GoogleGenAI, Type } from "@google/genai";
import { TextToActionResponse, WeightedAction } from "@/features/journal/types";
import { mapActionsToSkills } from "./action-to-skills";
import { mapSkillsToCharacteristics } from "./skills-to-characteristic";
import { ACTION_EXTRACTION_PROMPT, GENERALIZATION_PROMPT } from "../config/prompts";

/**
 * STEP 1: ACTION EXTRACTION
 */
async function extractActions(ai: any, text: string): Promise<string[]> {
  const response = await ai.models.generateContent({
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
  });
  const data = JSON.parse(response.text || '{"actions":[]}');
  return data.actions;
}

/**
 * STEP 2: PROPORTIONAL WEIGHTING
 */
async function estimateTimeAndProportions(ai: any, text: string, actions: string[]): Promise<{ duration: string, weightedActions: WeightedAction[] }> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on this entry: "${text}", estimate the duration (e.g., "30 mins", "2 hours"). 
    For these actions: [${actions.join(', ')}], assign each a "weight" (0.1-1.0) based on effort/time relative to the whole.`,
    config: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          duration: { type: Type.STRING },
          weightedActions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                weight: { type: Type.NUMBER }
              },
              required: ['label', 'weight']
            }
          }
        },
        required: ['duration', 'weightedActions'],
      },
    },
  });
  return JSON.parse(response.text || '{"duration": "unknown", "weightedActions": []}');
}

/**
 * PRIMARY ORCHESTRATOR: processTextToTopology
 */
export const processTextToTopology = async (text: string): Promise<TextToActionResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Step 1: Specific Actions + Proportions
  const rawActions = await extractActions(ai, text);
  const timeAndWeights = await estimateTimeAndProportions(ai, text, rawActions);
  
  // Step 2: Intermediate Skills
  const actionLabels = timeAndWeights.weightedActions.map(a => a.label);
  const skills = await mapActionsToSkills(ai, actionLabels);
  
  // Step 3: Abstract Characteristics
  const characteristics = await mapSkillsToCharacteristics(ai, skills);

  return {
    weightedActions: timeAndWeights.weightedActions,
    duration: timeAndWeights.duration,
    skills,
    characteristics
  };
};

/**
 * DEVELOPER UTILITY: generalizeConcept
 * Updated to take the results of the 3-layer pipeline for deeper abstraction.
 */
export const generalizeConcept = async (actions: string[], skills: string[], characteristics: string[]): Promise<{
  chain: { child: string; parent: string; weight: number }[];
}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
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
  });

  return JSON.parse(response.text || '{"chain":[]}');
};
