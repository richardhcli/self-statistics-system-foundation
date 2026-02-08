# Authentication — Self-Statistics System

**Stack**: Firebase Authentication + Firestore  
**Provider**: Google Sign-In  
**Updated**: February 6, 2026

---

## Overview

Authentication is handled via Firebase Authentication with Google as the identity provider. User profile data is stored in Firestore with automatic initialization on first login.

---

## Architecture

### Auth State Management
- **Provider**: [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx)
- **Access Hook**: `useAuth()` returns `{ user, loading, hasTimedOut }`
- **Observer**: `onAuthStateChanged(auth, ...)` tracks authentication state

### Intended Causal Flow
1. User visits `/auth/login` and sees [AuthView](../../src/features/auth/components/auth-view.tsx).
2. User clicks "Sign in with Google" in [LoginForm](../../src/features/auth/components/log-in-form.tsx).
3. `loginWithGoogle()` runs the Firebase popup flow and returns a Firebase `User`.
4. `syncUserProfile(user)` writes `users/{uid}` and seeds `account-config/*` (first login only).
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

Google sign-in button with:
- Loading state during authentication
- Error feedback on failure
- Disabled state while submitting

---

## Firestore Schema

### Collection: `users`
**Document ID**: `{uid}` (Firebase Auth UID)

```typescript
{
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Timestamp; // Server timestamp
  lastUpdated: Timestamp; // Server timestamp
}
```

**Notes**:
- Created automatically on first login
- Existing documents are never overwritten; only changed fields are updated
- Implementation: [src/features/auth/utils/login-google.ts](../../src/features/auth/utils/login-google.ts)

### Subcollection: `users/{uid}/account-config`
```
ai-settings
ui-preferences
integrations
billing-settings
```

**Notes**:
- Seeded automatically on first login
- Implementation: [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)

---

## Configuration

### Firebase Console
1. Enable **Google** provider in Authentication tab
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