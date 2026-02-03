import { Type } from "@google/genai";
import { TextToActionResponse } from "@/lib/soulTopology/types";
import { SINGLE_PROMPT_TOPOLOGY_PROMPT } from "../../config/stuffed-prompt";
import { getAiInstance } from "../get-ai-instance";
import { withTimeout } from "../with-timeout";

/**
 * processTextToLocalTopologySinglePrompt
 * SINGLE PROMPT ORCHESTRATOR - Entry → Topology Pipeline
 * 
 * Uses one prompt to return structured parent-child mappings across all layers.
 * Returns integer duration for precise time tracking.
 *
 * @param text - User's journal entry text
 * @returns TextToActionResponse with structured layer mappings and integer duration
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
              durationMinutes: { type: Type.NUMBER },
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
              skillMappings: {
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
              },
              characteristicMappings: {
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
            required: ['durationMinutes', 'weightedActions', 'skillMappings', 'characteristicMappings', 'generalizationChain']
          }
        }
      }),
      120000, // 120 second timeout. 60 seconds was too short.... 
      'processTextToLocalTopologySinglePrompt'
    );

    const parsed = JSON.parse(response.text || '{"durationMinutes":30,"weightedActions":[],"skillMappings":[],"characteristicMappings":[],"generalizationChain":[]}');

    return {
      durationMinutes: parsed.durationMinutes || 30,
      weightedActions: parsed.weightedActions || [],
      skillMappings: parsed.skillMappings || [],
      characteristicMappings: parsed.characteristicMappings || [],
      generalizationChain: parsed.generalizationChain || []
    };
  } catch (error) {
    console.warn('⚠️ Single prompt pipeline failed, returning defaults:', error);
    return {
      durationMinutes: 30,
      weightedActions: [],
      skillMappings: [],
      characteristicMappings: [],
      generalizationChain: []
    };
  }
};
