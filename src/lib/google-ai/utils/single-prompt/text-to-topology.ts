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
  console.log(`📍 [lib/google-ai/utils/single-prompt/text-to-topology] Starting single-prompt processing for entry: ${text.slice(0, 50)} ... ${text.slice(-50)}`);


  const ai = await getAiInstance();

  // Fallback strategy: Try Gemini 3 Flash first, then fallback to 2.0 Flash if it timeouts/fails
  const modelsToTry = ['gemini-3-flash-preview', 'gemini-2.0-flash'];
  let lastError: unknown = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[Topology] Attempting generation with model: ${model}`);
      
      const response = await withTimeout<{ text?: string }>(
        ai.models.generateContent({
          model: model,
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
        45000, // 45s per attempt (aggressive timeout to trigger fallback quickly)
        `processTextToLocalTopologySinglePrompt (${model})`
      );

      const parsed = JSON.parse(response.text || '{"durationMinutes":30,"weightedActions":[],"skillMappings":[],"characteristicMappings":[],"generalizationChain":[]}');

      console.log(`✅ [Topology] Success with model: ${model}`);
      return {
        durationMinutes: parsed.durationMinutes || 30,
        weightedActions: parsed.weightedActions || [],
        skillMappings: parsed.skillMappings || [],
        characteristicMappings: parsed.characteristicMappings || [],
        generalizationChain: parsed.generalizationChain || []
      };
    } catch (error) {
      console.warn(`⚠️ [Topology] Model ${model} failed/timed-out:`, error);
      lastError = error;
      // Continue to next model
    }
  }

  // If all models fail
  console.error('❌ [Topology] All models failed. Returning defaults.', lastError);
  return {
    durationMinutes: 30,
    weightedActions: [],
    skillMappings: [],
    characteristicMappings: [],
    generalizationChain: []
  };
};
