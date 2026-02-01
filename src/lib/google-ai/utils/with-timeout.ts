/**
 * withTimeout
 * Utility wrapper that rejects a promise if it exceeds a time limit.
 *
 * @param promise - Promise to wrap
 * @param timeoutMs - Maximum time in milliseconds (default 30000)
 * @param label - Optional label for error messages
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs = 30000,
  label = 'Google AI request'
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.ceil(timeoutMs / 1000)}s`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
