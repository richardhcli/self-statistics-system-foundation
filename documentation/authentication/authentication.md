# Authentication — Self-Statistics System

**Stack**: Firebase Authentication + Firestore  
**Provider**: Google Sign-In  
**Updated**: February 5, 2026

---

## Overview

Authentication is handled via Firebase Authentication with Google as the identity provider. User profile data is stored in Firestore with automatic initialization on first login.

---

## Architecture

### Auth State Management
- **Provider**: [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx)
- **Access Hook**: `useAuth()` returns `{ user, loading }`
- **Observer**: `onAuthStateChanged(auth, ...)` tracks authentication state

### User Flow
1. User visits `/auth/login` and sees [AuthView](../../src/features/auth/components/auth-view.tsx)
2. User clicks "Sign in with Google" button
3. Firebase authentication popup appears
4. On success, Firestore user profile is created (if new user)
5. `AuthProvider` updates global auth state
6. User is automatically redirected to `/dashboard`

### Route Protection
- **Protected routes**: All `/dashboard/*` paths
- **Gatekeeper**: [ProtectedRoute](../../src/routes/protected-route.tsx) component
- **Redirect**: Unauthenticated users sent to `/auth/login`

---

## Components

### AuthView
**Location**: [src/features/auth/components/auth-view.tsx](../../src/features/auth/components/auth-view.tsx)

Full-screen login interface with:
- Application title and description
- Embedded login form
- Automatic redirect on successful authentication
- Loading feedback during redirect

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
}
```

**Notes**:
- Created automatically on first login
- Existing documents are never overwritten
- Implementation: [src/features/auth/utils/login-google.ts](../../src/features/auth/utils/login-google.ts)

---

## Configuration

### Firebase Console
1. Enable **Google** provider in Authentication tab
2. Add authorized domains:
   - `localhost`
   - `*.web.app`
   - Production domain

### Firebase Config
**Location**: [src/lib/firebase/services.ts](../../src/lib/firebase/services.ts)

Exports:
- `auth` — Firebase Auth instance
- `db` — Firestore instance
- `analytics` — Firebase Analytics
- `googleProvider` — Google auth provider

---

## Developer Notes

- **No manual logout UI**: Implement sign-out in settings or header when needed
- **Session persistence**: Firebase SDK handles token refresh automatically
- **Error handling**: Authentication errors display inline on login form
- **Local-first**: Auth state persists across page refreshes via Firebase SDK 