/**
 * getApiKey
 * Retrieves the user's Google AI API key from localStorage via AIConfig.
 * Falls back to environment variable VITE_GOOGLE_API_KEY if not found in storage.
 * 
 * @returns The API key string, or null if unavailable
 */
export const getApiKey = (): string | null => {
  let apiKey;
  try {
    const appDataJson = localStorage.getItem('appData');
    if (appDataJson) {
      const appData = JSON.parse(appDataJson);
      if (appData.aiConfig?.apiKey) {
        apiKey = appData.aiConfig.apiKey;
      }
    }
  } catch (e) {
    console.warn('Failed to read API key from localStorage:', e);
  }
  if (apiKey) {
    return apiKey;
  }

  try {
    apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  } catch (e) {
    console.warn('Failed to read API key from environment variables:', e);
  }

  if (apiKey) {
      return apiKey;
  }
  console.warn('Google API key not found in localStorage or environment variables. returning null.');

  return null;
};
