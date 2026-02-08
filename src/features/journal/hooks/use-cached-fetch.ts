/**
 * Cache-aware fetch helper for journal month entries.
 * Triggers Firebase fetch only when cache is stale or missing.
 */

import { useEffect, useMemo } from 'react';
import { auth } from '@/lib/firebase/services';
import { useJournalActions } from '@/stores/journal';

interface MonthRequest {
  year: string;
  month: string;
}

/**
 * Fetches month entries for any expanded months using the journal store cache rules.
 */
export const useCachedFetch = (months: MonthRequest[]) => {
  const { fetchMonthEntries } = useJournalActions();

  const normalizedMonths = useMemo(
    () => months.map((item) => ({
      year: item.year,
      month: String(parseInt(item.month, 10)).padStart(2, '0'),
    })),
    [months]
  );

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || normalizedMonths.length === 0) return;

    normalizedMonths.forEach(({ year, month }) => {
      fetchMonthEntries(uid, year, month);
    });
  }, [fetchMonthEntries, normalizedMonths]);
};
