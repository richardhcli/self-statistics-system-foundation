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