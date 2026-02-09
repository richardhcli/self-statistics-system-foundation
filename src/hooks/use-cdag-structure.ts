/**
 * Hook: keeps CDAG structure synced from Firebase into the cache.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useGraphActions, useGraphMetadata, useGraphStructure } from '@/stores/cdag-topology';
import { buildEdgeId } from '@/lib/firebase/utils/graph-normalizers';

let sessionFullFetchUid: string | null = null;

/**
 * Subscribes to the CDAG structure document and refreshes cache on mount.
 */
export const useCdagStructure = () => {
  const { user } = useAuth();
  const {
    fetchStructure,
    subscribeToStructure,
    fetchNodes,
    fetchEdges,
    fetchAllNodes,
    fetchAllEdges,
    setFullFetchTimestamp,
  } = useGraphActions();
  const structure = useGraphStructure();
  const metadata = useGraphMetadata();
  const lastSyncKeyRef = useRef<string | null>(null);
  const fullFetchTtlMs = 1000 * 60 * 30;

  useEffect(() => {
    if (!user?.uid) return;

    const now = Date.now();
    const hasFullFetch = metadata.fullFetchAt > 0;
    const isFullFetchStale = now - metadata.fullFetchAt > fullFetchTtlMs;
    const shouldSessionFullFetch = sessionFullFetchUid !== user.uid;

    if (shouldSessionFullFetch || (hasFullFetch && isFullFetchStale)) {
      sessionFullFetchUid = user.uid;
      console.log('[useCdagStructure] Full graph fetch', {
        uid: user.uid,
        reason: shouldSessionFullFetch ? 'session-start' : 'stale',
      });

      Promise.all([fetchAllNodes(user.uid), fetchAllEdges(user.uid)])
        .then(([nodeCount, edgeCount]) => {
          console.log('[useCdagStructure] Full graph fetch complete', {
            nodeCount,
            edgeCount,
          });
          setFullFetchTimestamp(Date.now());
        })
        .catch((error) => {
          console.warn('[useCdagStructure] Full graph fetch failed:', error);
        });
    }

    // Force a backend refresh on mount to overwrite any stale IndexedDB snapshot.
    console.log('[useCdagStructure] Fetching structure from Firebase', { uid: user.uid });
    fetchStructure(user.uid, true).catch((error) => {
      console.warn('[useCdagStructure] Structure fetch failed:', error);
    });

    console.log('[useCdagStructure] Subscribing to structure updates', { uid: user.uid });
    const unsubscribe = subscribeToStructure(user.uid);
    return () => unsubscribe();
  }, [fetchAllEdges, fetchAllNodes, fetchStructure, metadata.fullFetchAt, setFullFetchTimestamp, subscribeToStructure, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const nodeIds = Object.keys(structure.nodeSummaries ?? {});
    const edgeIds = Object.entries(structure.adjacencyList ?? {}).flatMap(
      ([source, targets]) => targets.map((target) => buildEdgeId(source, target))
    );

    console.log('[useCdagStructure] Structure snapshot', {
      nodeSummaryCount: nodeIds.length,
      adjacencySources: Object.keys(structure.adjacencyList ?? {}).length,
      metrics: structure.metrics,
      lastUpdated: structure.lastUpdated,
    });

    const syncKey = `${structure.lastUpdated ?? 'local'}:${nodeIds.join('|')}:${edgeIds.join('|')}`;
    if (lastSyncKeyRef.current === syncKey) return;
    lastSyncKeyRef.current = syncKey;

    const shouldFallbackFetchAll =
      nodeIds.length === 0 &&
      edgeIds.length === 0 &&
      Boolean(structure.lastUpdated) &&
      (metadata.fullFetchAt === 0 || Date.now() - metadata.fullFetchAt > fullFetchTtlMs);

    if (shouldFallbackFetchAll) {
      console.warn('[useCdagStructure] Structure missing adjacency data, fetching full graph', {
        lastUpdated: structure.lastUpdated,
        metrics: structure.metrics,
      });

      fetchAllNodes(user.uid).catch((error) => {
        console.warn('[useCdagStructure] Full node fetch failed:', error);
      });

      fetchAllEdges(user.uid).catch((error) => {
        console.warn('[useCdagStructure] Full edge fetch failed:', error);
      });
      return;
    }

    if (nodeIds.length === 0 && edgeIds.length === 0) return;

    // Always refresh topology details from Firebase to keep the visual graph authoritative.
    console.log('[useCdagStructure] Refreshing node/edge details', {
      nodeCount: nodeIds.length,
      edgeCount: edgeIds.length,
      lastUpdated: structure.lastUpdated,
    });
    fetchNodes(user.uid, nodeIds, false).catch((error) => {
      console.warn('[useCdagStructure] Node fetch failed:', error);
    });

    fetchEdges(user.uid, edgeIds, false).catch((error) => {
      console.warn('[useCdagStructure] Edge fetch failed:', error);
    });
  }, [fetchAllEdges, fetchAllNodes, fetchEdges, fetchNodes, structure, user?.uid]);
};
