import { apiClient } from '@/lib/api-client';
import { GraphState, NodeData, EdgeData } from '../types';
import { useGraphStore } from '../store';

/**
 * Remote API: Fetch graph state from backend.
 */
export const getGraphState = (baseUrl: string): Promise<GraphState> => {
  return apiClient(`${baseUrl}/api/graph`);
};

/**
 * Remote API: Persist graph state to backend.
 */
export const updateGraphState = (
  baseUrl: string,
  graphState: GraphState
): Promise<void> => {
  return apiClient(`${baseUrl}/api/graph`, {
    data: graphState,
    method: 'POST',
  });
};

/**
 * Local API: Get current graph data from store.
 * Returns flat normalized state: nodes + edges + metadata
 */
export const getGraphData = (): GraphState => {
  const state = useGraphStore.getState();
  return {
    nodes: state.nodes,
    edges: state.edges,
    version: state.version,
    lastSyncTimestamp: state.lastSyncTimestamp,
  };
};

/**
 * Local API: Load graph data into store.
 * Replaces entire graph with provided state.
 */
export const setGraphData = (data: GraphState): void => {
  useGraphStore.getState().setGraph(data);
};

