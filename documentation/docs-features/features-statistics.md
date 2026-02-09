# Feature: Statistics

The Statistics module is the "Character Sheet" for your Second Brain.

## Views
- **Status (Default)**: Shows only cumulative experience. Implementation: [src/features/statistics/components/status-view.tsx](../../src/features/statistics/components/status-view.tsx).
- **Experience**: Lists the top 10 nodes by experience (or fewer if less exist). Implementation: [src/features/statistics/components/experience-view.tsx](../../src/features/statistics/components/experience-view.tsx).
- **Levels**: Empty placeholder for upcoming level analytics. Implementation: [src/features/statistics/components/level-view.tsx](../../src/features/statistics/components/level-view.tsx).
- **All Statistics**: Summary list for total exp, total levels (default 0), max exp (node), max level (node, default null), total node count, and total edge count. Implementation: [src/features/statistics/components/all-statistics-view.tsx](../../src/features/statistics/components/all-statistics-view.tsx).

The tab navigation is rendered directly under the header profile section in [src/features/statistics/components/statistics-view.tsx](../../src/features/statistics/components/statistics-view.tsx).

## Delta Tracking
The `StatsHeader` utilizes hierarchical metadata from the JournalStore to show:
- **Total EXP**: Lifetime cumulative growth.
- **Today's Gain**: EXP gained since 00:00:00.
- **Yesterday's Gain**: EXP gained during the previous calendar day.

## Progress Logic
- **Experience View**: Sorts player statistics by experience and displays the top results.
- **All Statistics View**: Aggregates totals and max values for summary reporting.