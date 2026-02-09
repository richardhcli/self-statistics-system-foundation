/**
 * Progression System Constants
 *
 * Centralized configuration for the entire progression math model.
 * Modify these to tune the "feel" of leveling and experience across the app.
 *
 * @module @systems/progression/constants
 */

/** AI temperature locked for deterministic topology generation. */
export const COGNITIVE_TEMPERATURE = 0.0;

/** Root node label for the top-level "progression" stat bucket. */
export const PROGRESSION_ROOT_ID = 'progression';

/** 30 minutes of activity = 1.0 base EXP unit. */
export const BASE_EXP_UNIT = 1.0;

/** Minutes that equal one full EXP unit (used in duration → multiplier conversion). */
export const MINUTES_PER_EXP_UNIT = 30;

/** Decimal precision for all stored EXP values. */
export const EXP_PRECISION = 4;
