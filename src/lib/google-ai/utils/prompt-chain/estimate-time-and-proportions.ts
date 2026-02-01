import { Type } from "@google/genai";
import { WeightedAction } from "@/features/journal/types";
import { withTimeout } from "../with-timeout";

/**
 * estimateTimeAndProportions
 * STEP 2 of the 3-layer topology pipeline (Proportional Weighting)
 * 
 * Estimates the total duration of the journal entry and assigns proportional
 * weights (0.1-1.0) to each action based on effort/time allocation.
 * Includes failsafes for API timeouts and errors.
 * 
 * @param ai - Pre-initialized GoogleGenAI instance
 * @param text - User's journal entry text
 * @param actions - List of action labels to weight
 * @returns Object containing duration string and array of weighted actions (with failsafe defaults)
 */
export async function estimateTimeAndProportions(
  ai: any,
  text: string,
  actions: string[]
): Promise<{ duration: string; weightedActions: WeightedAction[] }> {
  if (!ai || !ai.models) {
    console.warn('⚠️ AI instance is undefined in estimateTimeAndProportions');
    return {
      duration: "30 mins",
      weightedActions: actions.map(label => ({ label, weight: 1.0 / (actions.length || 1) }))
    };
  }

  try {
    const response = await withTimeout<{ text?: string }>(
      ai.models.generateContent({
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
      }),
      30000,
      'estimateTimeAndProportions'
    );
    const parsed = JSON.parse(response.text || '{"duration": "unknown", "weightedActions": []}');
    return parsed;
  } catch (error) {
    console.warn('⚠️ estimateTimeAndProportions failed, using failsafe:', error);
    return {
      duration: "30 mins",
      weightedActions: actions.map(label => ({ label, weight: 1.0 / (actions.length || 1) }))
    };
  }
}
