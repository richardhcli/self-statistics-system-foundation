# Feature: Statistics

The Statistics module is the "Character Sheet" for your Second Brain.

## Views
- **Player Status (Default)**: Focused view on core level, cumulative EXP, and peak mastery.
- **All Statistics**: Deep-dive explorer with the Mastery Leaderboard, Attributes Power Grid, and System Metrics.

## Delta Tracking
The `StatsHeader` utilizes hierarchical metadata from the JournalStore to show:
- **Total EXP**: Lifetime cumulative growth.
- **Today's Gain**: EXP gained since 00:00:00.
- **Yesterday's Gain**: EXP gained during the previous calendar day.

## Progress Logic
- **Attributes Grid**: Maps Journal density across domains (Intellect, Vitality, Social, etc.) to calculate Power Levels.
- **Mastery List**: A real-time leaderboard of every node in the topology, sorted by accumulated experience.