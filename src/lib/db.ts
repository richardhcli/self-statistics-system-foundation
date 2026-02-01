
import { RootState } from '@/stores/root';

/**
 * Persistence Layer using IndexedDB.
 * Orchestrates the storage of the root state (aggregated from all stores).
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
 * saveData
 * Persists the root state (serialized from all stores).
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

export const loadData = async (): Promise<RootState | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get('main');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const clearAllTables = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
