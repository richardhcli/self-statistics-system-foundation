/**
 * React Hook for Graph Sync Status
 * Provides UI with current sync state (idle, saving, error, etc.)
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  onGraphSyncStatusChange, 
  saveGraphState, 
  SyncStatus, 
  SyncResult 
} from './sync-middleware';
import { useGraphState } from './store';

export type SyncStatusType = 
  | 'idle' 
  | 'saving' 
  | 'offline' 
  | 'queued' 
  | 'success' 
  | 'error';

export interface UseGraphSyncReturn {
  status: SyncStatusType;
  message?: string;
  isLoading: boolean;
  isSaved: boolean;
  saveGraph: () => Promise<void>;
}

/**
 * Hook: useGraphSync
 * Provides current sync status and save function to UI
 * 
 * Usage:
 * const { status, saveGraph, isLoading } = useGraphSync();
 * 
 * <button onClick={saveGraph} disabled={isLoading}>
 *   {isLoading ? 'Saving...' : 'Save Graph'}
 * </button>
 */
export const useGraphSync = (): UseGraphSyncReturn => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('idle');
  const [syncMessage, setSyncMessage] = useState<string>();
  const graphState = useGraphState();

  // Memoize graphState to avoid infinite loops in useSyncExternalStore
  const memoizedGraphState = useMemo(
    () => ({
      nodes: graphState.nodes,
      edges: graphState.edges,
      version: graphState.version,
      lastSyncTimestamp: graphState.lastSyncTimestamp,
    }),
    [graphState.nodes, graphState.edges, graphState.version, graphState.lastSyncTimestamp]
  );

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = onGraphSyncStatusChange((status: SyncStatus) => {
      setSyncStatus(status.status as SyncStatusType);
      if ('message' in status) {
        setSyncMessage(status.message);
      }
    });

    return unsubscribe;
  }, []);

  const handleSaveGraph = async () => {
    const result: SyncResult = await saveGraphState(memoizedGraphState);
    if (!result.success && !result.queued) {
      console.error('Save failed:', result.error);
    }
  };

  return {
    status: syncStatus,
    message: syncMessage,
    isLoading: syncStatus === 'saving',
    isSaved: syncStatus === 'success' && !syncMessage?.includes('Queued'),
    saveGraph: handleSaveGraph,
  };
};
