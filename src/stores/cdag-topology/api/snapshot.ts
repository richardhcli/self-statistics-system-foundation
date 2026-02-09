/**
 * CDAG topology snapshot helpers.
 * Used for serialization/import flows (non-React contexts).
 */

import { useGraphStore } from '../store';
import type { CdagStoreSnapshot } from '../types';

/**
 * Get the current CDAG snapshot for export/serialization.
 */
export const getGraphSnapshot = (): CdagStoreSnapshot => {
  const { nodes, edges, structure, metadata } = useGraphStore.getState();
  return { nodes, edges, structure, metadata };
};

/**
 * Load a CDAG snapshot into the store.
 */
export const setGraphSnapshot = (snapshot: CdagStoreSnapshot): void => {
  useGraphStore.getState().actions.setSnapshot(snapshot);
};
