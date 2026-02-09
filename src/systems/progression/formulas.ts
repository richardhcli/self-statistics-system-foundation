/**
 * Progression Formulas — EXP Scaling & Level Curves
 *
 * All mathematical transforms that convert raw propagated EXP into
 * player-facing numbers (scaled EXP, level, progress-to-next).
 *
 * Leveling curve: **Logarithmic** — `Level = floor(log2(EXP + 1))`.
 * Rapid early leveling with diminishing returns at higher tiers.
 *
 * No React, no stores, no side-effects — unit-testable in isolation.
 *
 * @module @systems/progression/formulas
 */

import { MINUTES_PER_EXP_UNIT, EXP_PRECISION } from './constants';

// ─── Helpers ───────────────────────────────────────────────────────

/** Round a number to the configured EXP decimal precision. */
export const roundExp = (n: number): number =>
  Math.round(n * 10 ** EXP_PRECISION) / 10 ** EXP_PRECISION;

// ─── Duration → Multiplier ─────────────────────────────────────────

/**
 * Convert a duration (integer minutes or legacy string) into an EXP multiplier.
 *
 * @param duration - Integer minutes OR legacy string ("1h30m").
 * @returns Multiplier where `MINUTES_PER_EXP_UNIT` minutes = 1.0.
 *
 * @example
 * parseDurationToMultiplier(60)  // → 2.0
 * parseDurationToMultiplier(30)  // → 1.0
 * parseDurationToMultiplier()    // → 1.0
 */
export const parseDurationToMultiplier = (duration?: number | string): number => {
  if (!duration) return 1.0;

  if (typeof duration === 'number') {
    return roundExp(duration / MINUTES_PER_EXP_UNIT);
  }

  // Legacy string fallback (for user overrides like "1h30m")
  const lower = duration.toLowerCase();
  let minutes = 0;

  const hourMatch = lower.match(/(\d+)\s*h/);
  const minMatch = lower.match(/(\d+)\s*m/);

  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);

  if (minutes === 0) {
    const raw = parseInt(lower.replace(/[^\d]/g, ''));
    if (!isNaN(raw)) minutes = raw;
  }

  if (minutes === 0) return 1.0;
  return roundExp(minutes / MINUTES_PER_EXP_UNIT);
};

// ─── EXP Scaling ───────────────────────────────────────────────────

/**
 * Scale a propagated EXP map by a duration multiplier.
 *
 * @param propagatedExp - Node label → raw propagated EXP.
 * @param multiplier    - Duration-based multiplier.
 * @returns Scaled map, all values rounded to {@link EXP_PRECISION} dp.
 */
export const scaleExperience = (
  propagatedExp: Record<string, number>,
  multiplier: number,
): Record<string, number> => {
  const scaled: Record<string, number> = {};
  Object.entries(propagatedExp).forEach(([label, amount]) => {
    scaled[label] = roundExp(amount * multiplier);
  });
  return scaled;
};

// ─── Leveling Curve ────────────────────────────────────────────────

/**
 * Logarithmic level curve.
 *
 * `Level = floor(log2(totalExp + 1))`
 *
 * Properties:
 * - Level 0 → 0 EXP
 * - Level 1 → 1 EXP
 * - Level 2 → 3 EXP
 * - Level 3 → 7 EXP
 * - Level 10 → 1023 EXP
 *
 * @param totalExp - Cumulative experience for a node.
 * @returns Integer level (≥ 0).
 */
export const getLevelForExp = (totalExp: number): number =>
  Math.floor(Math.log2(totalExp + 1));

/**
 * Fractional progress toward the next level (0 → 1).
 * Useful for rendering EXP bars.
 *
 * @param totalExp - Cumulative experience for a node.
 * @returns Progress as a 4-dp decimal (e.g. 0.4567).
 */
export const getExpProgress = (totalExp: number): number => {
  const currentLevel = getLevelForExp(totalExp);
  const currentThreshold = 2 ** currentLevel - 1;
  const nextThreshold = 2 ** (currentLevel + 1) - 1;
  const range = nextThreshold - currentThreshold;
  if (range === 0) return 0;
  return roundExp((totalExp - currentThreshold) / range);
};

/**
 * EXP required to reach a specific level.
 *
 * @param level - Target level.
 * @returns Minimum cumulative EXP to reach that level.
 */
export const getExpForLevel = (level: number): number => 2 ** level - 1;
