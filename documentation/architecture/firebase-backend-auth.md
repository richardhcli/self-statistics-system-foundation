# Firebase Backend Auth

**Last Updated**: February 8, 2026

## Purpose
Firebase Auth handles sign-in and the initial Firestore profile bootstrap. Authentication events trigger profile synchronization so the backend always has current user metadata.

## Providers
- Google provider is configured in [src/lib/firebase/services.ts](../../src/lib/firebase/services.ts).

## Flow
1. UI triggers Google sign-in.
2. Firebase Auth returns the user.
3. `syncUserProfile` seeds or updates the Firestore profile and default settings.

## Implementation References
- Auth UI: [src/features/auth/components/auth-view.tsx](../../src/features/auth/components/auth-view.tsx)
- Auth provider: [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx)
- Login helper: [src/features/auth/utils/login-google.ts](../../src/features/auth/utils/login-google.ts)
- Profile sync: [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)
