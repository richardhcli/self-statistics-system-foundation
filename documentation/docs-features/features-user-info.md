# Feature: User Information

Manages the user's identity and RPG-style session metadata.

## Data Schema
```typescript
interface UserInformation {
  name: string;              // Neural Pioneer name
  userClass?: string;        // Specialized title (e.g., "Neural Architect")
  mostRecentAction?: string; // Automatically updated from the last journal entry
}
```

## Dashboard Integration
The `StatsHeader` pulls directly from this store. `mostRecentAction` provides a dynamic subtitle reflecting the user's current focus.

## Progression System Link
The user's global level and attribute breakdown are managed by the **Player Statistics store** and the `@systems/progression` module. The Statistics dashboard (Status and Level views) displays level, EXP, and attribute data sourced from `usePlayerStatistics()`. See [features-statistics.md](./features-statistics.md) and [ai-and-gamification.md](../ai-and-gamification.md) for details.