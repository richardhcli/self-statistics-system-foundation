
// Add React import for TypeScript namespace resolution
import React, { useEffect, useState } from 'react';
import { AppData } from '@/types';
import { loadData, saveData } from '@/lib/db';

export const usePersistence = (
  data: AppData,
  setData: React.Dispatch<React.SetStateAction<AppData>>,
  initialData: AppData
) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeFromDB = async () => {
      try {
        const persisted = await loadData();
        if (persisted) {
          setData({
            ...initialData,
            ...persisted,
            cdagTopology: persisted.cdagTopology || {}
          });
        }
      } catch (err) {
        console.error("Critical: Failed to load data from IndexedDB", err);
      } finally {
        setIsInitialized(true);
      }
    };
    initializeFromDB();
  }, [setData, initialData]);

  useEffect(() => {
    if (isInitialized) {
      saveData(data).catch(err => {
        console.error("Persistence Error: Failed to auto-save to IndexedDB", err);
      });
    }
  }, [data, isInitialized]);

  return { isInitialized };
};