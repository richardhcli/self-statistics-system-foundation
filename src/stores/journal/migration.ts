/**
 * Journal migration helper.
 * Wipes legacy persisted data and marks the migration as complete.
 */

import { del } from 'idb-keyval';

const MIGRATION_FLAG = 'journal_migration_v2_complete';
const LEGACY_KEYS = ['journal-store-v1', 'journal-store-v2'];

/**
 * Clears legacy journal cache keys and records a completion flag.
 */
export const runJournalMigration = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(MIGRATION_FLAG)) return;

  await Promise.all(LEGACY_KEYS.map((key) => del(key)));
  window.localStorage.setItem(MIGRATION_FLAG, 'true');
};
