/**
 * DEPRECATED: visual graph sync was tied to AppData.
 * Visual graph is now local feature state; use the visual-graph store instead.
 */
export const syncGraphFromTopology = (): never => {
  throw new Error(
    'syncGraphFromTopology has been removed. Use the visual-graph feature store instead.'
  );
};

/**
 * DEPRECATED: visual graph sync hook removed.
 */
export const useSyncGraphFromTopology = (): never => {
  throw new Error(
    'useSyncGraphFromTopology has been removed. Use the visual-graph feature store instead.'
  );
};
