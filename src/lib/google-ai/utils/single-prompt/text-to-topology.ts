import { Type } from "@google/genai";
import { TextToActionResponse } from "@/features/journal/types";
import { SINGLE_PROMPT_TOPOLOGY_PROMPT } from "../../config/stuffed-prompt";
import { getAiInstance } from "../get-ai-instance";
import { withTimeout } from "../with-timeout";

/**
 * processTextToLocalTopologySinglePrompt
 * SINGLE PROMPT ORCHESTRATOR - Entry → Topology Pipeline
 * 
 * Uses one prompt to return actions, time estimate, weighted actions,
 * skills, and characteristics in a single request.
 *
 * @param text - User's journal entry text
 * @returns TextToActionResponse containing actions, skills, characteristics, and duration
 */
export const processTextToLocalTopologySinglePrompt = async (
  text: string
): Promise<TextToActionResponse> => {
  const ai = await getAiInstance();

  try {
    const response = await withTimeout<{ text?: string }>(
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: SINGLE_PROMPT_TOPOLOGY_PROMPT(text),
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
              },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              characteristics: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              generalizationChain: {
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
            required: ['duration', 'weightedActions', 'skills', 'characteristics', 'generalizationChain']
          }
        }
      }),
      30000,
      'processTextToLocalTopologySinglePrompt'
    );

    const parsed = JSON.parse(response.text || '{"duration":"unknown","weightedActions":[],"skills":[],"characteristics":[],"generalizationChain":[]}');

    return {
      duration: parsed.duration || 'unknown',
      weightedActions: parsed.weightedActions || [],
      skills: parsed.skills || [],
      characteristics: parsed.characteristics || [],
      generalizationChain: parsed.generalizationChain || []
    };
  } catch (error) {
    console.warn('⚠️ Single prompt pipeline failed, returning defaults:', error);
    return {
      duration: 'unknown',
      weightedActions: [],
      skills: [],
      characteristics: []
    };
  }
};
