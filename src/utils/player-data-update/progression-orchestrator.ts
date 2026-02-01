/**
 * DEPRECATED: AppData progression orchestrator removed.
 * Use calculateScaledProgression or store actions instead.
 */
export const applyScaledProgression = (): never => {
  throw new Error(
    'applyScaledProgression has been removed. Use calculateScaledProgression from stores/player-statistics/utils.'
  );
};

/**
 * DEPRECATED: AppData progression orchestrator removed.
 * Use store actions instead.
 */
export const updatePlayerStats = (): never => {
  throw new Error(
    'updatePlayerStats has been removed. Use usePlayerStatisticsActions().updateStats instead.'
  );
};
