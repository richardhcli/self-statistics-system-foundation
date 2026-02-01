import { useAppDataStore } from '@/stores/app-data';
import { AppData } from '@/types';

/**
 * getCurrentData
 * Centralized helper to retrieve the current AppData snapshot.
 *
 * @returns Current AppData snapshot
 */
export const getCurrentData = (): AppData => {
  const data = useAppDataStore.getState().getData();

  if (!data) {
    throw new Error('AppData is not initialized. Ensure the store is hydrated before calling getCurrentData.');
  }

  return data;
};
