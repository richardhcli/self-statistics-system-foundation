# Firebase Backend Auth

**Last Updated**: February 10, 2026

## Purpose
Firebase Auth handles sign-in and the initial Firestore profile bootstrap. Authentication events trigger profile synchronization so the backend always has current user metadata.

## Providers
- **Google**: Primary sign-in. Configured in [src/lib/firebase/services.ts](../../src/lib/firebase/services.ts).
- **Anonymous**: Guest sign-in for unauthenticated exploration. Can be upgraded to Google via account linking.

## Flow
1. UI triggers Google sign-in or anonymous guest login.
2. Firebase Auth returns the user.
3. `syncUserProfile` seeds or updates the Firestore profile and default settings.
4. (Optional) Guest users can link their anonymous account to Google via `linkAnonymousToGoogle()` in [src/features/auth/utils/link-account.ts](../../src/features/auth/utils/link-account.ts).

## Implementation References
- Auth UI: [src/features/auth/components/auth-view.tsx](../../src/features/auth/components/auth-view.tsx)
- Auth provider: [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx)
- Google login: [src/features/auth/utils/login-google.ts](../../src/features/auth/utils/login-google.ts)
- Guest login: [src/features/auth/utils/login-guest.ts](../../src/features/auth/utils/login-guest.ts)
- Account linking: [src/features/auth/utils/link-account.ts](../../src/features/auth/utils/link-account.ts)
- Profile sync: [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)
