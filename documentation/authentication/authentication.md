# Authentication — Self-Statistics System

**Stack**: Firebase Authentication + Firestore  
**Provider**: Google Sign-In + Anonymous Guest  
**Updated**: February 8, 2026

---

## Overview

Authentication is handled via Firebase Authentication with Google and Anonymous providers. User profile data is stored in Firestore with automatic initialization on first login, including guest sessions.

---

## Architecture

### Auth State Management
- **Provider**: [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx)
- **Access Hook**: `useAuth()` returns `{ user, loading, hasTimedOut }`
- **Observer**: `onAuthStateChanged(auth, ...)` tracks authentication state

### Intended Causal Flow
1. User visits `/auth/login` and sees [AuthView](../../src/features/auth/components/auth-view.tsx).
2. User clicks "Sign in with Google" or "Continue as Guest" in [LoginForm](../../src/features/auth/components/log-in-form.tsx).
3. `loginWithGoogle()` or `loginAsGuest()` runs the Firebase auth flow and returns a Firebase `User`.
4. `syncUserProfile(user)` writes `users/{uid}` and seeds `account_config/*` (first login only).
5. `AuthProvider` listens to `onAuthStateChanged(auth, ...)` and publishes `{ user, loading, hasTimedOut }`.
6. `ProtectedRoute` gates `/app/*` routes based on the auth state.
7. Feature UIs read `useAuth()` and load Firestore data (profile, settings, journal tree, etc).

### Route Protection
- **Protected routes**: All `/app/*` paths
- **Gatekeeper**: [ProtectedRoute](../../src/routes/protected-route.tsx) component
- **Redirect**: Unauthenticated users sent to `/auth/login`

### Debugging
- **Auth diagnostics tab**: `/app/debug/authentication`
- **UI component**: [AuthenticationView](../../src/features/debug/components/authentication-view.tsx)
- Displays private session state (UID, provider data, metadata) for troubleshooting.

---

## Components

### AuthView
**Location**: [src/features/auth/components/auth-view.tsx](../../src/features/auth/components/auth-view.tsx)

Full-screen login interface with:
- Application title and description
- Embedded login form
- Automatic redirect on successful authentication
- Loading feedback during redirect and auth initialization
- Timeout fallback (shows troubleshooting tips and reload button)

### LoginForm
**Location**: [src/features/auth/components/log-in-form.tsx](../../src/features/auth/components/log-in-form.tsx)

Google sign-in and guest entry with:
- Loading state during authentication
- Error feedback on failure
- Disabled state while submitting
- Guest sign-in for anonymous sessions

### GuestBanner
**Location**: [src/components/notifications/guest-banner.tsx](../../src/components/notifications/guest-banner.tsx)

Inline banner shown for guest users:
- Explains guest data is tied to the current device
- Prompts user to link a Google account
- Handles linking errors and fallback messaging

---

## Firestore Schema

### Collection: `users`
**Document ID**: `{uid}` (Firebase Auth UID)

**Notes**:
- Created automatically on first login (including anonymous sessions)
- Existing documents are never overwritten; only changed fields are updated
- Implementation: [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)

### Subcollection: `users/{uid}/account_config`

**Documents**:
- `ai_settings`
- `ui_preferences`
- `integrations`
- `billing_settings`

**Notes**:
- Seeded automatically on first login
- Implementation: [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)

---

## Configuration

### Firebase Console
1. Enable **Google** provider in Authentication tab
2. Enable **Anonymous** provider in Authentication tab
2. Add authorized domains:
  - `localhost`
  - `*.web.app`
  - Production domain

### Logout
**Route**: `/auth/logout`

**Location**: [src/features/auth/components/logout-view.tsx](../../src/features/auth/components/logout-view.tsx)

Provides a dedicated sign-out screen with confirmation.

### Firebase Config
**Location**: [src/lib/firebase/services.ts](../../src/lib/firebase/services.ts)

Exports:
- `auth` — Firebase Auth instance
- `db` — Firestore instance
- `analytics` — Firebase Analytics
- `googleProvider` — Google auth provider

---

## Developer Notes

- **Logout UI**: Settings includes a logout button linking to `/auth/logout`
- **Session persistence**: Firebase SDK handles token refresh automatically
- **Error handling**: Authentication errors display inline on login form
- **Local-first**: Auth state persists across page refreshes via Firebase SDK
- **Guest recovery**: When linking fails with `auth/credential-already-in-use`, guest Firestore data and local IndexedDB caches are cleared before signing into the existing account. See [src/features/auth/utils/link-account.ts](../../src/features/auth/utils/link-account.ts) and [src/stores/root/reset-local-state.ts](../../src/stores/root/reset-local-state.ts).