
import { AppData, JournalEntryData } from '@/types';
import { getNormalizedDate, getNormalizedMonthName } from './time-utils';

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
