
/**
 * Utility for parsing duration and scaling EXP for user progression.
 */

export const parseDurationToMultiplier = (duration?: string): number => {
  if (!duration) return 1.0;
  
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
