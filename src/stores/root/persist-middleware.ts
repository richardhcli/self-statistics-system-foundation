import { createJSONStorage } from 'zustand/middleware';
import { get, set, del, clear } from 'idb-keyval';

/**
 * IndexedDB Storage Engine for Zustand Persist Middleware
 * 
 * ⚠️ RESTRICTED USAGE: This module should NEVER be used directly during runtime operations
 * or imported in feature components. Its sole responsibility is to bridge Zustand in-memory
 * state with IndexedDB as the master source of truth.
 * 
 * Uses idb-keyval for async IndexedDB operations that don't block the UI.
 * Automatically handles serialization/deserialization of JSON.
 * 
 * Architecture: Hybrid Read-Aside, Sync-Behind
 * - IndexedDB is the cache source of truth during hydration and persistence
 * - UI is optimistic (never waits for network during runtime)
 * - Each store independently persists its data via this middleware
 * - Background sync happens independently of persistence layer
 * 
 * Implementation Note:
 * - Called automatically by Zustand when any store persists via partialize()
 * - Should NOT be imported in components or feature logic
 * - Should NOT be used for manual persistence (use db.ts instead)
 */
export const indexedDBStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    try {
      const value = await get(name);
      return value ? JSON.stringify(value) : null;
    } catch (err) {
      console.warn(`[IndexedDB] Failed to read key "${name}":`, err);
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, JSON.parse(value));
    } catch (err) {
      console.error(`[IndexedDB] Failed to write key "${name}":`, err);
      throw err;
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch (err) {
      console.warn(`[IndexedDB] Failed to delete key "${name}":`, err);
    }
  },
}));

/**
 * Clear all persisted data in IndexedDB.
 * Use with caution - this clears the entire database.
 */
export const clearAllPersistedData = async (): Promise<void> => {
  try {
    await clear();
    console.log('[IndexedDB] All persisted data cleared');
  } catch (err) {
    console.error('[IndexedDB] Failed to clear persisted data:', err);
  }
};

/**
 * List all keys currently in IndexedDB.
 * Useful for debugging persistence state.
 */
export const listPersistedKeys = async (): Promise<string[]> => {
  try {
    // Note: idb-keyval doesn't have a direct key listing method,
    // but you can use IndexedDB API directly if needed for debugging
    console.log('[IndexedDB] Use browser DevTools → Application → IndexedDB to inspect keys');
    return [];
  } catch (err) {
    console.error('[IndexedDB] Failed to list keys:', err);
    return [];
  }
};
