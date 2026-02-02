/**
 * Testing Utility: Clear IndexedDB
 * 
 * Clears all IndexedDB databases to reset application state.
 * Useful for debugging persistence and hydration issues.
 * 
 * WARNING: This will delete ALL persisted data!
 */

export const clearIndexedDB = async (): Promise<void> => {
  try {
    // Get all database names
    const databases = await indexedDB.databases();
    
    // Delete each database
    const deletePromises = databases.map(db => {
      if (db.name) {
        return new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name!);
          request.onsuccess = () => {
            console.log(`[Testing] Cleared IndexedDB: ${db.name}`);
            resolve();
          };
          request.onerror = () => {
            console.error(`[Testing] Failed to clear IndexedDB: ${db.name}`);
            reject(request.error);
          };
          request.onblocked = () => {
            console.warn(`[Testing] IndexedDB delete blocked: ${db.name}`);
            reject(new Error('Delete blocked'));
          };
        });
      }
      return Promise.resolve();
    });

    await Promise.all(deletePromises);
    console.log('[Testing] All IndexedDB databases cleared');
    
    // Also clear localStorage for good measure
    localStorage.clear();
    console.log('[Testing] localStorage cleared');
    
  } catch (error) {
    console.error('[Testing] Error clearing IndexedDB:', error);
    throw error;
  }
};

/**
 * Conditional clear: Only clears if URL has ?clearDB=true
 * Safer for production debugging
 */
export const clearIndexedDBConditional = async (): Promise<boolean> => {
  const params = new URLSearchParams(window.location.search);
  const shouldClear = params.get('clearDB') === 'true';
  
  if (shouldClear) {
    await clearIndexedDB();
    // Remove the query param to prevent repeated clears
    params.delete('clearDB');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
    return true;
  }
  
  return false;
};
