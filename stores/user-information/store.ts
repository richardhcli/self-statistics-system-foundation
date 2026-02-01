import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indexedDBStorage } from '@/lib/persist-middleware';

export interface UserInformation {
  name: string;
  userClass?: string;
  mostRecentAction?: string;
}

interface UserInformationStoreState {
  // State
  info: UserInformation;

  // Getters
  getInfo: () => UserInformation;
  getName: () => string;
  getUserClass: () => string | undefined;

  // Actions (nested in stable object for performance)
  actions: {
    setInfo: (info: UserInformation) => void;
    updateName: (name: string) => void;
    updateUserClass: (userClass: string) => void;
    updateMostRecentAction: (action: string) => void;
  };
}

/**
 * User Information Store (Zustand with Persist Middleware)
 * Manages user identity and profile settings (name, class, etc).
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Local-First Architecture: Writes to IndexedDB immediately (no network wait).
 * 
 * This store is private - access ONLY via hooks:
 * - useUserInformation() - for state selectors
 * - useUserInformationActions() - for dispatching updates
 */
export const useUserInformationStore = create<UserInformationStoreState>()(
  persist(
    (set, get) => ({
    info: {
      name: 'Pioneer',
      userClass: 'Neural Architect',
      mostRecentAction: 'None',
    },

    // Getters
    getInfo: () => get().info,
    getName: () => get().info.name,
    getUserClass: () => get().info.userClass,

    // Actions (stable object reference - never recreated)
    actions: {
      setInfo: (info: UserInformation) => set({ info }),
      
      updateName: (name: string) => {
        set((state) => ({
          info: { ...state.info, name },
        }));
      },

      updateUserClass: (userClass: string) => {
        set((state) => ({
          info: { ...state.info, userClass },
        }));
      },

      updateMostRecentAction: (action: string) => {
        set((state) => ({
          info: { ...state.info, mostRecentAction: action },
        }));
      }
    }
    }),
    {
      name: 'user-information-store-v1',
      storage: indexedDBStorage,
      version: 1,
      migrate: (state: any, version: number) => {
        if (version !== 1) {
          console.warn('[User Information Store] Schema version mismatch - clearing persisted data');
          return {
            info: {
              name: 'Pioneer',
              userClass: 'Neural Architect',
              mostRecentAction: 'None',
            },
          };
        }
        return state;
      },
    }
  )
);

/**
 * State Hook: Returns user information using fine-grained selector.
 * Only triggers re-renders when info changes.
 * 
 * Usage:
 * const info = useUserInformation();
 * const name = useUserInformation(s => s.name);
 */
export const useUserInformation = (
  selector?: (state: UserInformation) => any
) => {
  return useUserInformationStore((state) => {
    if (!selector) return state.info;
    return selector(state.info);
  });
};

/**
 * Actions Hook: Returns stable action functions.
 * Components using only this hook will NOT re-render on data changes.
 * 
 * Uses Stable Actions Pattern: state.actions is a single object reference
 * that never changes, preventing unnecessary re-renders.
 * 
 * Usage:
 * const { updateName, updateUserClass } = useUserInformationActions();
 */
export const useUserInformationActions = () => {
  return useUserInformationStore((state) => state.actions);
};
