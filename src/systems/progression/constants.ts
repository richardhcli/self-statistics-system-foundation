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

/**
 * The 7 archetypal attributes that form the "Gravity Wells" of the CDAG.
 * The AI is encouraged — but not forced — to classify towards these hubs.
 * UI uses this list to drive the radar chart and attribute cards.
 */
export const CORE_ATTRIBUTES = [
  'Vitality',
  'Intellect',
  'Wisdom',
  'Social',
  'Discipline',
  'Creativity',
  'Leadership',
] as const;

/** Union type of the 7 core attribute labels. */
export type CoreAttribute = (typeof CORE_ATTRIBUTES)[number];

/**
 * Lucide icon name mapping for each core attribute.
 * Used by UI components for consistent iconography.
 */
export const ATTRIBUTE_ICONS: Record<CoreAttribute, string> = {
  Vitality: 'Heart',
  Intellect: 'Brain',
  Wisdom: 'Eye',
  Social: 'Users',
  Discipline: 'Shield',
  Creativity: 'Sparkles',
  Leadership: 'Crown',
} as const;

/**
 * Short descriptions for each core attribute (tooltip/card text).
 */
export const ATTRIBUTE_DESCRIPTIONS: Record<CoreAttribute, string> = {
  Vitality: 'Physical resilience, fitness, and health',
  Intellect: 'Analytical capacity and technical rigor',
  Wisdom: 'Metacognition, judgment, and depth',
  Social: 'Charisma, collaboration, and empathy',
  Discipline: 'Focus, self-control, and habits',
  Creativity: 'Innovation, design, and artistry',
  Leadership: 'Vision, influence, and direction',
} as const;
