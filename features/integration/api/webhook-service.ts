
import { IntegrationLog } from '../types';

/**
 * Sends a JSON payload to a configured webhook URL.
 */
export const sendWebhook = async (
  url: string,
  payload: any,
  eventName: string
): Promise<{ success: boolean; response: string }> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Neural-Brain-Event': eventName,
      },
      body: JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        data: payload,
      }),
    });

    const text = await response.text();
    return {
      success: response.ok,
      response: text || (response.ok ? 'OK' : 'Error'),
    };
  } catch (err: any) {
    return {
      success: false,
      response: err.message || 'Network error',
    };
  }
};
