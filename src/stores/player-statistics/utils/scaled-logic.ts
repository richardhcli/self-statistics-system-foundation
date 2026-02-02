
/**
 * Utility for converting duration to EXP multipliers.
 * 
 * Duration is now provided as integer minutes from AI analysis.
 * 30 minutes = 1.0 EXP base unit.
 */

/**
 * parseDurationToMultiplier
 * 
 * Converts duration (in minutes or as override) to EXP multiplier.
 * 
 * @param duration - Integer minutes OR legacy string override
 * @returns EXP multiplier (30 minutes = 1.0)
 * 
 * @example
 * parseDurationToMultiplier(60) // returns 2.0 (60 mins / 30)
 * parseDurationToMultiplier(30) // returns 1.0 (30 mins / 30)
 * parseDurationToMultiplier(undefined) // returns 1.0 (default)
 */
export const parseDurationToMultiplier = (duration?: number | string): number => {
  if (!duration) return 1.0;
  
  // If integer, use directly
  if (typeof duration === 'number') {
    return duration / 30;
  }
  
  // Legacy string fallback (for user overrides)
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

  // 30 minutes = 1.0 EXP base unit
  if (minutes === 0) return 1.0;
  return minutes / 30;
};

export const scaleExperience = (
  propagatedExp: Record<string, number>,
  multiplier: number
): Record<string, number> => {
  const scaled: Record<string, number> = {};
  Object.entries(propagatedExp).forEach(([label, amount]) => {
    scaled[label] = amount * multiplier;
  });
  return scaled;
};
