import { nanoid } from 'nanoid';

/**
 * Generates a lexicographically sortable ID for journal entries.
 * Format: YYYYMMDD-HHmmss-suffix
 * Example: 20260207-173000-a1b2
 * 
 * This format allows:
 * 1. Sorting by ID naturally sorts by time
 * 2. Uniqueness via suffix
 * 3. Human readability
 * 
 * @param date Optional date object (defaults to now)
 * @returns Sortable unique ID string
 */
export const generateEntryId = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const sec = String(date.getSeconds()).padStart(2, '0');
  
  const timestamp = `${yyyy}${mm}${dd}-${hh}${min}${sec}`;
  // nanoid(4) gives enough collision resistance given the timestamp prefix
  // 4 chars = ~16.7 million combinations per second per user
  const suffix = nanoid(4); 
  
  return `${timestamp}-${suffix}`;
};

/**
 * Extracts the Date object from a journal entry ID.
 * 
 * @param id The journal entry ID (YYYYMMDD-HHmmss-suffix)
 * @returns Date object
 * @throws Error if ID format is invalid
 */
export const getDateFromId = (id: string): Date => {
  // Expected format: YYYYMMDD-HHmmss-xxxx
  if (!id || id.length < 15) {
    throw new Error('Invalid ID format');
  }

  const year = parseInt(id.substring(0, 4), 10);
  const month = parseInt(id.substring(4, 6), 10) - 1; // JS months are 0-indexed
  const day = parseInt(id.substring(6, 8), 10);
  const hour = parseInt(id.substring(9, 11), 10);
  const minute = parseInt(id.substring(11, 13), 10);
  const second = parseInt(id.substring(13, 15), 10);

  return new Date(year, month, day, hour, minute, second);
};
