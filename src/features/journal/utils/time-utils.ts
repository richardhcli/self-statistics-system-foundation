
/**
 * Utility to convert month numbers or names to standard Month Name string.
 */
export const getNormalizedMonthName = (month: string | number): string => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  if (typeof month === 'number') {
    return monthNames[Math.max(0, Math.min(11, month - 1))];
  }
  
  // If it's a string that looks like a number
  if (!isNaN(parseInt(month))) {
    return monthNames[Math.max(0, Math.min(11, parseInt(month) - 1))];
  }

  // Already a string name, just ensure capitalization
  const capitalized = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
  return monthNames.includes(capitalized) ? capitalized : monthNames[new Date().getMonth()];
};

export const getNormalizedDate = (dateInfo?: { year?: string; month?: string | number; day?: string; time?: string }) => {
  const now = new Date();
  
  const timeStr = now.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false 
  }) + '.' + now.getMilliseconds().toString().padStart(3, '0');

  return {
    year: dateInfo?.year || now.getFullYear().toString(),
    month: getNormalizedMonthName(dateInfo?.month ?? (now.getMonth() + 1)),
    day: dateInfo?.day || now.getDate().toString(),
    time: dateInfo?.time || timeStr
  };
};
