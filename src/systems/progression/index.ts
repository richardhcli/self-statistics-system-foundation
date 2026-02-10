/**
 * Progression System — Public API
 *
 * Single entry-point for ALL progression-related logic.
 * Import from `@systems/progression` everywhere else.
 *
 * @module @systems/progression
 */

// Constants
export {
  COGNITIVE_TEMPERATURE,
  PROGRESSION_ROOT_ID,
  BASE_EXP_UNIT,
  MINUTES_PER_EXP_UNIT,
  EXP_PRECISION,
  CORE_ATTRIBUTES,
  ATTRIBUTE_ICONS,
  ATTRIBUTE_DESCRIPTIONS,
  type CoreAttribute,
} from './constants';

// Engine (propagation algorithm)
export { calculateParentPropagation } from './engine';

// Formulas (scaling, leveling curve)
export {
  roundExp,
  parseDurationToMultiplier,
  scaleExperience,
  getLevelForExp,
  getExpProgress,
  getExpForLevel,
} from './formulas';

// State mutations (pure stat updater)
export {
  updatePlayerStatsState,
  type NodeStats,
  type PlayerStatistics,
} from './state-mutations';

// High-level orchestration (compose engine + formulas + mutations)
export {
  calculateScaledProgression,
  calculateDirectProgression,
} from './orchestrator';
