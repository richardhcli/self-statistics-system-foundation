
import { AppData } from '@/types';

/**
 * Persistence Layer using IndexedDB.
 * Orchestrates the storage of the centralized AppData object.
 */

const DB_NAME = 'JournalGraphDB';
const DB_VERSION = 5; 
const STORE_NAME = 'appData';
const CDAG_STORE_NAME = 'cdagTopology';
const STATS_STORE_NAME = 'playerStatistics';
const USER_INFO_STORE_NAME = 'userInformation';
const VISUAL_GRAPH_STORE_NAME = 'visualGraph';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      if (!db.objectStoreNames.contains(CDAG_STORE_NAME)) db.createObjectStore(CDAG_STORE_NAME);
      if (!db.objectStoreNames.contains(STATS_STORE_NAME)) db.createObjectStore(STATS_STORE_NAME);
      if (!db.objectStoreNames.contains(USER_INFO_STORE_NAME)) db.createObjectStore(USER_INFO_STORE_NAME);
      if (!db.objectStoreNames.contains(VISUAL_GRAPH_STORE_NAME)) db.createObjectStore(VISUAL_GRAPH_STORE_NAME);
    };
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
};

/**
 * saveData
 * Atomic persistence across specialized tables.
 */
export const saveData = async (data: AppData): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([
      STORE_NAME, 
      CDAG_STORE_NAME, 
      STATS_STORE_NAME, 
      USER_INFO_STORE_NAME,
      VISUAL_GRAPH_STORE_NAME
    ], 'readwrite');
    
    tx.objectStore(STORE_NAME).put(data, 'main');
    
    const cdag = tx.objectStore(CDAG_STORE_NAME);
    cdag.clear();
    Object.entries(data.cdagTopology).forEach(([k, v]) => cdag.put(v, k));

    const stats = tx.objectStore(STATS_STORE_NAME);
    stats.clear();
    Object.entries(data.playerStatistics).forEach(([k, v]) => stats.put(v, k));

    const user = tx.objectStore(USER_INFO_STORE_NAME);
    user.put(data.userInformation, 'profile');

    const visual = tx.objectStore(VISUAL_GRAPH_STORE_NAME);
    visual.put(data.visualGraph, 'current');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const loadData = async (): Promise<AppData | null> => {
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
    const tx = db.transaction([
      STORE_NAME, 
      CDAG_STORE_NAME, 
      STATS_STORE_NAME, 
      USER_INFO_STORE_NAME,
      VISUAL_GRAPH_STORE_NAME
    ], 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.objectStore(CDAG_STORE_NAME).clear();
    tx.objectStore(STATS_STORE_NAME).clear();
    tx.objectStore(USER_INFO_STORE_NAME).clear();
    tx.objectStore(VISUAL_GRAPH_STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
