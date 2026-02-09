/**
 * Shared helpers for the CDAG topology store.
 */

import type { CdagMetadata, CdagStructure, NodeData } from './types';

export const CACHE_TTL_MS = 1000 * 60 * 5;
export const DEFAULT_NODE_ID = 'progression';
export const DEFAULT_NODE: NodeData = {
  id: DEFAULT_NODE_ID,
  label: 'Progression',
  type: 'characteristic',
};

export const isCacheStale = (
  cacheInfo: { lastFetched: number; isDirty?: boolean } | undefined
) => {
  if (!cacheInfo) return true;
  if (cacheInfo.isDirty) return true;
  return Date.now() - cacheInfo.lastFetched > CACHE_TTL_MS;
};

export const buildEmptyStructure = (): CdagStructure => ({
  adjacencyList: {
    [DEFAULT_NODE_ID]: [],
  },
  nodeSummaries: {
    [DEFAULT_NODE_ID]: {
      id: DEFAULT_NODE_ID,
      label: DEFAULT_NODE.label,
      type: DEFAULT_NODE.type,
    },
  },
  metrics: { nodeCount: 1, edgeCount: 0 },
  version: 1,
});

export const buildEmptyMetadata = (): CdagMetadata => ({
  nodes: {},
  edges: {},
  structure: { lastFetched: 0, isDirty: false },
  fullFetchAt: 0,
});

export const ensureDefaultNode = (nodes: Record<string, NodeData>) => {
  if (nodes[DEFAULT_NODE_ID]) return nodes;
  return { ...nodes, [DEFAULT_NODE_ID]: DEFAULT_NODE };
};

export const ensureStructureDefaults = (structure?: CdagStructure): CdagStructure => {
  if (!structure) return buildEmptyStructure();

  return {
    adjacencyList: {
      ...buildEmptyStructure().adjacencyList,
      ...(structure.adjacencyList ?? {}),
    },
    nodeSummaries: {
      ...buildEmptyStructure().nodeSummaries,
      ...(structure.nodeSummaries ?? {}),
    },
    metrics: structure.metrics ?? { nodeCount: 0, edgeCount: 0 },
    lastUpdated: structure.lastUpdated,
    version: structure.version ?? 1,
  };
};
