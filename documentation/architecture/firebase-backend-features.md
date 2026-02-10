# Firebase Backend Features and Operations

**Last Updated**: February 10, 2026

## Read-Aside Services
- User profile and settings: [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)
- Player statistics: [src/lib/firebase/player-statistics.ts](../../src/lib/firebase/player-statistics.ts)
- Journal read-aside: [src/lib/firebase/journal.ts](../../src/lib/firebase/journal.ts)
- Graph read-aside (CDAG): [src/lib/firebase/graph-service.ts](../../src/lib/firebase/graph-service.ts)
- CRUD helpers for debug tools: [src/lib/firebase/firestore-crud.ts](../../src/lib/firebase/firestore-crud.ts)

## Settings UI Mapping
- Profile display name: users/{uid}
- Status display class: users/{uid}/user_information/profile_display
- UI preferences: users/{uid}/account_config/ui_preferences
- AI settings: users/{uid}/account_config/ai_settings
- Privacy settings: users/{uid}/account_config/privacy
- Notification settings: users/{uid}/account_config/notifications

## Default Seed Values
Defined in [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts).
- ai_settings: provider gemini, voice model gemini-2-flash, abstraction model gemini-3-flash, temperature 0, maxTokens 2048, apiKey empty
- ui_preferences: theme dark, language en, visibility toggles true
- privacy: encryptionEnabled true, visibilityMode private, biometricUnlock false
- notifications: all enabled
- integrations: config + obsidian config defaults, logs empty
- billing_settings: free, active
- profile_display: class empty
- player_statistics: progression seeded

## Debug Datastores View
The debug datastores view can fetch backend snapshots, hydrate stores, and remove documents or fields.
- Feature doc: [documentation/docs-features/features-datastores-debug.md](../docs-features/features-datastores-debug.md)
- Force sync UI: [src/features/debug/components/force-sync-panel.tsx](../../src/features/debug/components/force-sync-panel.tsx)
- Snapshot mapping: [src/features/debug/utils/datastore-sync.ts](../../src/features/debug/utils/datastore-sync.ts)

## Security Rules
Firestore rules currently allow authenticated users to read/write their own subtree.
- Rules live in the Firebase project config (see firebase.json).

## Common Errors
- Missing or insufficient permissions: review Firestore rules and auth state.
- Invalid document reference: ensure document paths use even segment counts (for example, users/{uid}/graphs/cdag_topology).
