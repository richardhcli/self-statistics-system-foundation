import { GoogleGenAI } from "@google/genai";
import { getApiKey } from "./get-api-key";

/**
 * getAiInstance
 * Utility function to initialize and retrieve a GoogleGenAI instance
 * 
 * Handles API key retrieval and instance creation with error handling.
 * Throws an error if the API key is not configured or initialization fails.
 * 
 * @returns Pre-initialized GoogleGenAI instance
 * @throws Error if API key is not configured or initialization fails
 */
export const getAiInstance = async (): Promise<GoogleGenAI> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ Google API key not configured. Please set up your API key in Settings.');
    throw new Error('Google API key not configured. Please set up your API key in Settings.');
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    if (!ai) {
      console.warn('⚠️ GoogleGenAI instance is undefined');
      throw new Error('Failed to initialize Google AI');
    }
    return ai;
  } catch (error) {
    console.error('❌ Failed to initialize Google AI:', error);
    throw new Error('Failed to initialize Google AI. Please check your API key.');
  }
};
