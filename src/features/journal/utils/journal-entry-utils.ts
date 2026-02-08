
/**
 * Convert minutes to human-readable text
 * Handles edge cases: negative values, zero, NaN, string input, and proper pluralization
 * Supports units: seconds, minutes, hours, days
 * 
 * @param {number | string} minutes - Duration in minutes (or parseable string)
 * @returns {string} Human-readable duration text
 * 
 * @example
 * minutesToText(0) // "0 seconds"
 * minutesToText(0.5) // "30 seconds"
 * minutesToText(1) // "1 minute"
 * minutesToText(45) // "45 minutes"
 * minutesToText(90) // "1.5 hours"
 * minutesToText(1440) // "1 day"
 */
export const minutesToText = (minutes: number | string): string => {
  // Handle string input
  const numMinutes = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  
  // Handle invalid input
  if (isNaN(numMinutes) || !isFinite(numMinutes) || numMinutes < 0) {
    return 'Invalid duration';
  }
  
  // Handle zero
  if (numMinutes === 0) return '0 seconds';
  
  // Less than 1 second
  if (numMinutes < 1/60) return '< 1 second';
  
  // Less than 1 minute (show seconds)
  if (numMinutes < 1) {
    const seconds = Math.round(numMinutes * 60);
    return `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
  }
  
  // Less than 60 minutes (show minutes)
  if (numMinutes < 60) {
    const mins = Math.round(numMinutes);
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  
  // Less than 24 hours (show hours with decimal for < 2h, rounded for >= 2h)
  if (numMinutes < 60 * 24) {
    const hours = numMinutes / 60;
    if (hours < 2) {
      return `${hours.toFixed(1)} hours`;
    }
    const roundedHours = Math.round(hours);
    return `${roundedHours} ${roundedHours === 1 ? 'hour' : 'hours'}`;
  }
  
  // 24 hours or more (show days)
  const days = numMinutes / (60 * 24);
  if (days < 2) {
    return `${days.toFixed(1)} days`;
  }
  const roundedDays = Math.round(days);
  return `${roundedDays} ${roundedDays === 1 ? 'day' : 'days'}`;
};
