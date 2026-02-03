
import { RootState, serializeRootState, deserializeRootState } from '@/stores/root';

/**
 * Root State Persistence Layer (IndexedDB)
 * 
 * ⚠️ RESTRICTED USAGE: This module is ONLY for:
 * - Persistence operations (saving/loading serialized root state)
 * - Import/Export operations (full state snapshots)
 * - Initial hydration from backend
 * - Manual data integrity checks and recovery
 * 
 * ❌ NEVER USE:
 * - During normal runtime operations
 * - In feature components or orchestrators
 * - For passing as parameter to UI components
 * - For partial state updates (use individual store actions instead)
 * 
 * Primary Duty:
 * Acts as a bridge between Zustand in-memory state and the IndexedDB master source of truth.
 * All operations must utilize serializeRootState() and deserializeRootState() helpers to ensure
 * all domain data is captured accurately and bidirectionally.
 * 
 * Architecture:
 * - Maintains a single 'rootState' object in IndexedDB
 * - Used during app initialization to fully hydrate all stores
 * - Called during manual save/export operations
 * - Separate from individual store persistence (each store persists independently via persist-middleware.ts)
 */

const DB_NAME = 'JournalGraphDB';
const DB_VERSION = 6; 
const STORE_NAME = 'rootState';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Clean up old stores from previous versions
      const storeNames = ['appData', 'cdagTopology', 'playerStatistics', 'userInformation', 'visualGraph'];
      storeNames.forEach(name => {
        if (db.objectStoreNames.contains(name)) {
          db.deleteObjectStore(name);
        }
      });
      
      // Create single root state store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
};

/**
 * saveData - Manual Root State Persistence
 * 
 * Persists a complete RootState snapshot to IndexedDB.
 * 
 * ⚠️ Should rarely be called directly. Prefer serialization via serializeRootState().
 * 
 * @param data - Complete RootState object (should be serialized via serializeRootState())
 * @throws Rejects on IndexedDB transaction failure
 */
export const saveData = async (data: RootState): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(data, 'main');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * loadData - Manual Root State Retrieval
 * 
 * Loads the complete RootState snapshot from IndexedDB.
 * 
 * ⚠️ Should rarely be called directly. Prefer during initial app hydration.
 * After loading, use deserializeRootState(data) to populate all stores.
 * 
 * @returns RootState if exists in database, null if not yet persisted
 * @throws Rejects on IndexedDB transaction failure
 */
export const loadData = async (): Promise<RootState | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get('main');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * clearAllTables - Clear Root State Storage
 * 
 * Completely clears the root state from IndexedDB.
 * ⚠️ Use with extreme caution - this does not reset individual stores.
 * 
 * For full app reset, also call deserializeRootState(INITIAL_ROOT_STATE) after clearing.
 */
export const clearAllTables = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * deleteDatabase - Nuclear Option: Wipe Entire IndexedDB
 * 
 * Completely deletes the IndexedDB database for a full clean slate.
 * ⚠️ This is irreversible. Use only for complete data reset scenarios.
 * 
 * This deletes the entire 'JournalGraphDB' database, including the root state store.
 * Individual stores maintain separate persistence via Zustand, so they must be manually
 * reset by calling deserializeRootState(INITIAL_ROOT_STATE) after deletion.
 * 
 * @throws Rejects if database deletion is blocked (user has multiple tabs open)
 */
export const deleteDatabase = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn('Database deletion blocked. Close all tabs using this database.');
    };
  });
};
