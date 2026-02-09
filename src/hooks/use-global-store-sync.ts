import { useEffect } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useAiConfigActions } from '@/stores/ai-config';
import { useUserInformationActions } from '@/stores/user-information';
import { usePlayerStatisticsActions } from '@/stores/player-statistics/index';
import { useUserIntegrationsActions } from '@/stores/user-integrations';

/**
 * Hook: keeps global stores synced from Firebase into the cache.
 */
export const useGlobalStoreSync = () => {
  const { user } = useAuth();
  const { fetchConfig } = useAiConfigActions();
  const { fetchInfo } = useUserInformationActions();
  const { fetchStats } = usePlayerStatisticsActions();
  const { fetchIntegrations } = useUserIntegrationsActions();

  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;

    void fetchConfig(uid).catch((error) => {
      console.warn('[useGlobalStoreSync] AI config fetch failed:', error);
    });
    void fetchInfo(uid).catch((error) => {
      console.warn('[useGlobalStoreSync] User info fetch failed:', error);
    });
    void fetchStats(uid).catch((error) => {
      console.warn('[useGlobalStoreSync] Player stats fetch failed:', error);
    });
    void fetchIntegrations(uid).catch((error) => {
      console.warn('[useGlobalStoreSync] Integrations fetch failed:', error);
    });
  }, [fetchConfig, fetchInfo, fetchStats, fetchIntegrations, user?.uid]);
};
