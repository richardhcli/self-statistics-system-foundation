import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  loadProfileDisplay,
  loadUserProfile,
  updateProfileDisplay,
  updateUserProfile,
} from '@/lib/firebase/user-profile';
import { auth } from '@/lib/firebase/services';
import { indexedDBStorage } from '@/stores/root/persist-middleware';

const CACHE_TTL_MS = 1000 * 60 * 5;

const getCurrentUserId = () => auth.currentUser?.uid ?? null;

const isCacheStale = (cacheInfo: { lastFetched: number; isDirty?: boolean } | undefined) => {
  if (!cacheInfo) return true;
  if (cacheInfo.isDirty) return true;
  return Date.now() - cacheInfo.lastFetched > CACHE_TTL_MS;
};

export interface UserInformation {
  name: string;
  userClass?: string;
  mostRecentAction?: string;
}

interface UserInformationMetadata {
  lastFetched: number;
  isDirty?: boolean;
}

interface UserInformationStoreState {
  // PURE DATA (Persisted to IndexedDB)
  info: UserInformation;
  metadata: UserInformationMetadata;

  // LOGIC/ACTIONS (Never persisted - code is source of truth)
  actions: {
    setInfo: (info: UserInformation) => void;
    updateName: (name: string) => void;
    updateUserClass: (userClass: string) => void;
    updateMostRecentAction: (action: string) => void;
    invalidateCache: () => void;
    fetchInfo: (uid?: string, force?: boolean) => Promise<void>;
  };
}

const DEFAULT_INFO: UserInformation = {
  name: 'Pioneer',
  userClass: 'Neural Architect',
  mostRecentAction: 'None',
};

const markDirty = (set: (fn: (state: UserInformationStoreState) => UserInformationStoreState) => void) => {
  set((state) => ({
    ...state,
    metadata: { ...state.metadata, isDirty: true },
  }));
};

const syncUserInfo = async (
  uid: string,
  updates: Partial<UserInformation>,
  set: (fn: (state: UserInformationStoreState) => UserInformationStoreState) => void
) => {
  try {
    await Promise.all([
      updates.name !== undefined ? updateUserProfile(uid, { displayName: updates.name }) : Promise.resolve(),
      updates.userClass !== undefined ? updateProfileDisplay(uid, { class: updates.userClass }) : Promise.resolve(),
    ]);
    set((state) => ({
      ...state,
      metadata: { lastFetched: Date.now(), isDirty: false },
    }));
  } catch (error) {
    console.warn('[User Information Store] Failed to sync user info:', error);
  }
};

/**
 * User Information Store (Zustand with Persist Middleware)
 * Manages user identity and profile settings (name, class, recent action).
 * 
 * Persistence: Automatic via Zustand persist middleware + IndexedDB storage.
 * Hybrid Read-Aside: Firebase is the source of truth; IndexedDB is the cache.
 * 
 * This store is private - access ONLY via hooks:
 * - useUserInformation() - for state selectors
 * - useUserInformationActions() - for dispatching updates
 */
export const useUserInformationStore = create<UserInformationStoreState>()(
  persist(
    (set, get) => ({
      // PURE DATA (will be persisted)
      info: DEFAULT_INFO,
      metadata: { lastFetched: 0, isDirty: false },

      // LOGIC/ACTIONS (never persisted - stable object reference)
      actions: {
        setInfo: (info: UserInformation) =>
          set({ info, metadata: { lastFetched: Date.now(), isDirty: false } }),

        updateName: (name: string) => {
          set((state) => ({
            ...state,
            info: { ...state.info, name },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncUserInfo(uid, { name }, set);
          }
        },

        updateUserClass: (userClass: string) => {
          set((state) => ({
            ...state,
            info: { ...state.info, userClass },
          }));
          markDirty(set);

          const uid = getCurrentUserId();
          if (uid) {
            void syncUserInfo(uid, { userClass }, set);
          }
        },

        updateMostRecentAction: (action: string) => {
          set((state) => ({
            ...state,
            info: { ...state.info, mostRecentAction: action },
          }));
        },

        invalidateCache: () =>
          set((state) => ({
            ...state,
            metadata: { ...state.metadata, isDirty: true },
          })),

        fetchInfo: async (uid, force = false) => {
          const resolvedUid = uid ?? getCurrentUserId();
          if (!resolvedUid) return;

          const { metadata } = get();
          if (!force && !isCacheStale(metadata)) return;

          const [profile, profileDisplay] = await Promise.all([
            loadUserProfile(resolvedUid),
            loadProfileDisplay(resolvedUid),
          ]);

          set((state) => ({
            ...state,
            info: {
              ...state.info,
              name: profile.displayName ?? state.info.name,
              userClass: profileDisplay.class ?? state.info.userClass,
            },
            metadata: { lastFetched: Date.now(), isDirty: false },
          }));
        },
      },
    }),
    {
      name: 'user-information-store-v2',
      storage: indexedDBStorage,
      version: 2,

      // 🚨 CRITICAL: partialize = data whitelist (zero-function persistence)
      partialize: (state) => ({
        info: state.info,
        metadata: state.metadata,
      }),

      // Merge function: prioritize code's actions over any persisted junk
      merge: (persistedState: any, currentState: UserInformationStoreState) => ({
        ...currentState,
        ...persistedState,
        actions: currentState.actions,
      }),

      migrate: (state: any, version: number) => {
        if (version !== 2) {
          console.warn('[User Information Store] Schema version mismatch - clearing persisted data');
          return {
            info: DEFAULT_INFO,
            metadata: { lastFetched: 0, isDirty: false },
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
