# Feature: Settings

The Settings module provides a URL-driven, two-column interface for application configuration.

## Layout
- **Fixed Sidebar**: Permanent navigation rail on the left.
- **Modular View Area**: The right pane swaps between route-backed sub-pages.
- **Routing**: `/app/settings/:tab` with a default redirect to `/app/settings/status`.

## Current Sub-Pages
- **Status Display**: Display name stored in `users/{uid}`, class in `user-information/profile-display`, visibility toggles in `account-config/ui-preferences`.
- **Account Profile**: Firestore-backed display name editor with read-only Google account details and logout action.
- **AI Features**: Firestore-backed AI settings (provider, models, temperature, max tokens).
- **Privacy & Notifications**: Persisted in `account-config/privacy` and `account-config/notifications`.

## Firestore Integration
- User profile data loads from `users/{uid}`.
- Account config lives under `users/{uid}/account-config/*`.
- Theme is toggled locally and mirrored to Firestore.