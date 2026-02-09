# Statistics Tabs Refactor - 2026-02-09

## Summary
Refactored the Statistics module to use a standard horizontal tab bar with four dedicated views: Status, Experience, Levels (placeholder), and All Statistics. Legacy grid/table/leaderboard components were removed to fully migrate to the new tab structure.

## Implementation References
- Statistics container and tab wiring: [src/features/statistics/components/statistics-view.tsx](../../src/features/statistics/components/statistics-view.tsx)
- Status view: [src/features/statistics/components/status-view.tsx](../../src/features/statistics/components/status-view.tsx)
- Experience view: [src/features/statistics/components/experience-view.tsx](../../src/features/statistics/components/experience-view.tsx)
- Levels view: [src/features/statistics/components/level-view.tsx](../../src/features/statistics/components/level-view.tsx)
- All statistics summary view: [src/features/statistics/components/all-statistics-view.tsx](../../src/features/statistics/components/all-statistics-view.tsx)


# Blueprint - Statistics Tabs (AI Guide)

## Objective
Maintain the Statistics module as a four-tab interface using the shared horizontal tab component under the header profile section.

## Tab Scope
- **Status**: Only cumulative experience.
- **Experience**: Top 10 nodes by experience (or fewer when data is limited).
- **Levels**: Empty placeholder until level analytics are defined.
- **All Statistics**: Summary list of total exp, total levels (default 0), max exp with node, max level with node (default null), total node count, and total edge count.

## Key Files
- Statistics container: [src/features/statistics/components/statistics-view.tsx](../../src/features/statistics/components/statistics-view.tsx)
- Status view: [src/features/statistics/components/status-view.tsx](../../src/features/statistics/components/status-view.tsx)
- Experience view: [src/features/statistics/components/experience-view.tsx](../../src/features/statistics/components/experience-view.tsx)
- Levels view: [src/features/statistics/components/level-view.tsx](../../src/features/statistics/components/level-view.tsx)
- All statistics view: [src/features/statistics/components/all-statistics-view.tsx](../../src/features/statistics/components/all-statistics-view.tsx)

## Data Notes
- Total levels is intentionally defaulted to 0.
- Highest level node is intentionally null until the levels system is finalized.
- Edge count should come from the CDAG structure metrics where available.
