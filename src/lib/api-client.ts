
/**
 * Global API Client
 * Prepared for future backend server communication.
 * Currently serves as a pass-through for local-first operations.
 */

export const apiClient = async <T = any>(
  endpoint: string,
  { data, ...customConfig }: any = {}
): Promise<T> => {
  const config = {
    method: data ? 'POST' : 'GET',
    body: data ? JSON.stringify(data) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...customConfig.headers,
    },
    ...customConfig,
  };

  try {
    const response = await window.fetch(endpoint, config);

    if (response.status === 401) {
      // Logic for re-authentication could go here
      return Promise.reject(new Error('Unauthorized'));
    }

    const result = await response.json();

    if (response.ok) {
      return result;
    } else {
      return Promise.reject(result);
    }
  } catch (err: any) {
    return Promise.reject(new Error(err.message || 'Network Error'));
  }
};
