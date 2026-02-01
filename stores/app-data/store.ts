import { create } from 'zustand';
import { AppData } from '@/types';
import { INITIAL_APP_DATA } from './constants';

interface AppDataStore {
  // State
  data: AppData;

  // Getters
  getData: () => AppData;
  getTopology: () => AppData['cdagTopology'];
  getJournal: () => AppData['journal'];
  getPlayerStats: () => AppData['playerStatistics'];
  getUserInfo: () => AppData['userInformation'];

  // Setters
  setData: (data: AppData) => void;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

/**
 * Global App Data Store
 * Zustand store for managing the root AppData state.
 * 
 * This store provides centralized access to the application's complete state,
 * including topology, journal entries, player statistics, and user information.
 * 
 * Architecture Note: This follows Bulletproof React patterns where stores
 * manage global state independent of component hierarchy. Data is hydrated
 * from IndexedDB on app initialization.
 */
export const useAppDataStore = create<AppDataStore>((set, get) => ({
  data: INITIAL_APP_DATA,

  // Getters
  getData: () => get().data,
  getTopology: () => get().data.cdagTopology,
  getJournal: () => get().data.journal,
  getPlayerStats: () => get().data.playerStatistics,
  getUserInfo: () => get().data.userInformation,

  // Setters
  setData: (data: AppData) => set({ data }),
  updateData: (updater: (prev: AppData) => AppData) => {
    set((state) => ({
      data: updater(state.data),
    }));
  },
}));
