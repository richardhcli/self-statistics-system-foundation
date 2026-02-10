# Feature: Statistics

**Last Updated**: February 10, 2026

The Statistics module is the "Character Sheet" for your Second Brain — an RPG-style dashboard powered by the centralized progression system (`@systems/progression`).

## Architecture
- **Parent container**: [src/features/statistics/components/statistics-view.tsx](../../src/features/statistics/components/statistics-view.tsx)
- **Progression logic**: [src/systems/progression/](../../src/systems/progression/index.ts) (pure, no React)
- **Skill clustering utility**: [src/features/statistics/utils/group-skills.ts](../../src/features/statistics/utils/group-skills.ts)

## Views (4 Tabs)

### Status (Default)
Full RPG attribute dashboard with 4 sections:
1. **Attribute Radar Chart** — 7-axis Recharts `RadarChart` showing core attribute levels (Vitality, Intellect, Wisdom, Social, Discipline, Creativity, Leadership). Custom tooltip with level + XP.
   - Component: [attribute-radar-chart.tsx](../../src/features/statistics/components/attribute-radar-chart.tsx)
2. **Attribute Grid** — Cards for each core attribute displaying Lucide icon, level badge, description, and XP progress bar.
   - Component: [attribute-card.tsx](../../src/features/statistics/components/attribute-card.tsx)
3. **Recent Neural Impact** — Last 5 journal entries with EXP gain, sorted by time. Shows entry preview, timestamp, and XP badge.
4. **Skill Clusters** — Skill nodes grouped by closest characteristic parent via BFS traversal. Each cluster shows total XP and its child skills with levels.
   - Utility: [group-skills.ts](../../src/features/statistics/utils/group-skills.ts)

### Experience
Lists the top 10 nodes by experience.
- Component: [experience-view.tsx](../../src/features/statistics/components/experience-view.tsx)

### Levels
Global leveling dashboard with 3 sections:
1. **Global Level Badge** — Player's overall level computed via `getLevelForExp(totalExp)` from the logarithmic curve.
2. **XP Progress Bar** — Gradient bar showing fractional progress toward the next level with current/next XP thresholds.
3. **Top 3 Contributors** — Nodes ranked by EXP contribution (excluding the root).
- Component: [level-view.tsx](../../src/features/statistics/components/level-view.tsx)

### All Statistics
Summary metrics: total EXP, total levels, highest EXP node, highest level node, total node count, total edge count.
- Component: [all-statistics-view.tsx](../../src/features/statistics/components/all-statistics-view.tsx)

## Header
- **StatsHeader**: Displays user name, class, total EXP, today's gain, yesterday's gain, and progress bar.
- Component: [stats-header.tsx](../../src/features/statistics/components/stats-header.tsx)

## Delta Tracking
- **Total EXP**: Lifetime cumulative growth.
- **Today's Gain**: EXP gained since 00:00:00 (from journal tree metadata).
- **Yesterday's Gain**: EXP gained during the previous calendar day.

## Data Flow
```
statistics-view.tsx (parent)
  ├─ useJournalEntries()      → entry data for recent gains
  ├─ useJournalTree()         → daily EXP deltas
  ├─ useGraphNodes()          → CDAG node data
  ├─ useGraphEdges()          → CDAG edge data
  ├─ usePlayerStatistics()    → EXP + level per node
  └─ useUserInformation()     → user profile for header
       │
       ├─ StatusView (nodes, edges, stats, entries)
       ├─ ExperienceView (topNodes)
       ├─ LevelView (playerStatistics, totalExp)
       └─ AllStatisticsView (aggregated totals)
```

## Key Dependencies
- **recharts** (`^3.7.0`): RadarChart, ResponsiveContainer, PolarGrid, etc.
- **@systems/progression**: `CORE_ATTRIBUTES`, `getLevelForExp`, `getExpProgress`, `getExpForLevel`, `ATTRIBUTE_ICONS`, `ATTRIBUTE_DESCRIPTIONS`.
- **lucide-react**: Attribute icons (Heart, Brain, Eye, Users, Shield, Sparkles, Crown).
- **All Statistics View**: Aggregates totals and max values for summary reporting.