/**
 * Hook: keeps CDAG structure synced from Firebase into the cache.
 */

import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useGraphActions } from '@/stores/cdag-topology';

/**
 * Subscribes to the CDAG structure document and refreshes cache on mount.
 */
export const useCdagStructure = () => {
  const { user } = useAuth();
  const { fetchStructure, subscribeToStructure } = useGraphActions();

  useEffect(() => {
    if (!user?.uid) return;

    fetchStructure(user.uid).catch((error) => {
      console.warn('[useCdagStructure] Structure fetch failed:', error);
    });

    const unsubscribe = subscribeToStructure(user.uid);
    return () => unsubscribe();
  }, [fetchStructure, subscribeToStructure, user?.uid]);
};
