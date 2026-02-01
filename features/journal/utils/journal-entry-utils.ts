
import { JournalEntryData } from '@/types';
import { getNormalizedDate, getNormalizedMonthName } from './time-utils';
import { useAppDataStore } from '@/stores/app-data';

/**
 * updateJournalHTMLLocal
 * Pure function: given raw journal data, returns updated journal with new entry.
 * Used internally by upsertJournalEntry.
 */
const updateJournalHTMLLocal = (
  journal: any,
  date: { year: string; month: string; day: string; time: string },
  entryData: JournalEntryData
): any => {
  const newJournal = JSON.parse(JSON.stringify(journal));
  const { year, month, day, time } = date;
  
  const normMonth = getNormalizedMonthName(month);
  
  if (!newJournal[year]) newJournal[year] = { metadata: { totalExp: 0 } };
  if (!newJournal[year][normMonth]) newJournal[year][normMonth] = { metadata: { totalExp: 0 } };
  if (!newJournal[year][normMonth][day]) newJournal[year][normMonth][day] = { metadata: { totalExp: 0 } };
  
  const existingEntry = newJournal[year][normMonth][day][time] || {};
  const expDiff = (entryData.metadata?.totalExp || 0) - (existingEntry.metadata?.totalExp || 0);

  newJournal[year][normMonth][day][time] = { ...existingEntry, ...entryData };

  if (expDiff !== 0) {
    newJournal[year][normMonth][day].metadata.totalExp += expDiff;
    newJournal[year][normMonth].metadata.totalExp += expDiff;
    newJournal[year].metadata.totalExp += expDiff;
  }
  
  return newJournal;
};

/**
 * upsertJournalEntry
 * Hook-based approach: directly updates global journal store.
 * Automatically triggers re-renders across components watching journal.
 * 
 * @param date - Already normalized date object (year, month, day, time)
 * @param entryData - Entry content and metadata
 */
export const upsertJournalEntry = (
  date: { year: string; month: string | number; day: string; time: string },
  entryData: JournalEntryData
): void => {
  const { data, updateData } = useAppDataStore.getState();
  
  // Normalize month to string if it's a number
  const normalizedDate = {
    year: date.year,
    month: typeof date.month === 'number' ? getNormalizedMonthName(date.month.toString()) : date.month,
    day: date.day,
    time: date.time
  };
  
  const updatedJournal = updateJournalHTMLLocal(data.journal, normalizedDate, entryData);
  updateData(prev => ({ ...prev, journal: updatedJournal }));
};

/**
 * @deprecated Use upsertJournalEntry instead
 */
export const updateJournalHTML = () => {
  console.warn('updateJournalHTML is deprecated. Use upsertJournalEntry instead.');
};
