
import { AppData, JournalEntryData } from '@/types';

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

export const updateJournalHTML = (
  prevData: AppData,
  date: { year: string; month: string; day: string; time: string },
  entryData: JournalEntryData
): AppData => {
  const newJournal = JSON.parse(JSON.stringify(prevData.journal));
  const { year, month, day, time } = date;
  
  // Normalize month name just in case
  const normMonth = getNormalizedMonthName(month);
  
  // Initialize hierarchy with metadata if not present
  if (!newJournal[year]) newJournal[year] = { metadata: { totalExp: 0 } };
  if (!newJournal[year][normMonth]) newJournal[year][normMonth] = { metadata: { totalExp: 0 } };
  if (!newJournal[year][normMonth][day]) newJournal[year][normMonth][day] = { metadata: { totalExp: 0 } };
  
  const existingEntry = newJournal[year][normMonth][day][time] || {};
  const expDiff = (entryData.metadata?.totalExp || 0) - (existingEntry.metadata?.totalExp || 0);

  // Update entry
  newJournal[year][normMonth][day][time] = { ...existingEntry, ...entryData };

  // Update aggregated metadata
  if (expDiff !== 0) {
    newJournal[year][normMonth][day].metadata.totalExp += expDiff;
    newJournal[year][normMonth].metadata.totalExp += expDiff;
    newJournal[year].metadata.totalExp += expDiff;
  }
  
  return { ...prevData, journal: newJournal };
};

export const upsertJournalEntry = (
  setData: (fn: (prev: AppData) => AppData) => void,
  date: { year: string; month: string | number; day: string; time: string },
  entryData: JournalEntryData
): void => {
  const normalized = getNormalizedDate(date);
  setData(prev => updateJournalHTML(prev, normalized, entryData));
};
