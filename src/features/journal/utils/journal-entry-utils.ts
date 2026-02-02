
import { JournalEntryData } from '@/types';
import { getNormalizedDate, getNormalizedMonthName } from './time-utils';

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
  const expDiff = (entryData.result?.totalExpIncrease || 0) - (existingEntry.result?.totalExpIncrease || 0);

  newJournal[year][normMonth][day][time] = { ...existingEntry, ...entryData };

  if (expDiff !== 0) {
    newJournal[year][normMonth][day].metadata.totalExp += expDiff;
    newJournal[year][normMonth].metadata.totalExp += expDiff;
    newJournal[year].metadata.totalExp += expDiff;
  }
  
  return newJournal;
};

/**
 * DEPRECATED: This function relied on useAppDataStore which no longer exists.
 * Use useJournalActions().upsertEntry() directly instead.
 * 
 * @deprecated Use useJournalActions().upsertEntry() from stores/journal
 */
export const upsertJournalEntry = (
  date: { year: string; month: string | number; day: string; time: string },
  entryData: JournalEntryData
): void => {
  throw new Error(
    'upsertJournalEntry is deprecated. Use useJournalActions().upsertEntry() from @/stores/journal instead. ' +
    'Note: useJournalActions must be called from within a React component.'
  );
};

/**
 * @deprecated Use useJournalActions instead
 */
export const updateJournalHTML = () => {
  console.warn('updateJournalHTML is deprecated. Use useJournalActions instead.');
};
