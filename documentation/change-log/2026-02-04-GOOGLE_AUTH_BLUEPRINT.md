# Google Auth Blueprint Plan — Firebase Hosting

**Date**: 2026-02-04  
**Scope**: Google Sign-In + Firestore user bootstrap + route protection

---

## Goals

- Provide Google Sign-In through Firebase Authentication.
- Gate all application routes behind authenticated access.
- Initialize a `users/{uid}` Firestore document on first login.
- Keep implementation minimal, local-first, and consistent with current app architecture.

---

## Architecture Summary

### Auth State Ownership
- **Single source of truth**: [src/providers/auth-provider.tsx](src/providers/auth-provider.tsx)
- **Access hook**: `useAuth()`
- **Auth observer**: `onAuthStateChanged(auth, ...)`

### Sign-In Flow
1. User clicks **Sign in with Google** on `/auth/login`.
2. `signInWithPopup(auth, googleProvider)` resolves.
3. Firestore document `users/{uid}` is created if missing.
4. `AuthProvider` updates context state.
5. Protected routes render the application.

---

## Firestore User Document

**Collection**: `users`  
**Document ID**: `uid`

**Schema (initial bootstrap)**:
- `uid`: string
- `displayName`: string
- `email`: string
- `photoURL`: string
- `createdAt`: server timestamp

**Notes**:
- Only create on first login.
- Do not overwrite an existing document.

---

## Routing Map

| Path | Component | Access |
|------|-----------|--------|
| /auth/login | LoginForm | Public |
| /dashboard/* | App | Protected |
| / | Redirect → /dashboard | Public |

---

## File Targets

- [src/lib/firebase/services.ts](src/lib/firebase/services.ts)
  - Initialize auth, db, analytics, and provider.
- [src/features/auth/utils/login-google.ts](src/features/auth/utils/login-google.ts)
  - Add Firestore bootstrap on first login.
- [src/features/auth/components/log-in-form.tsx](src/features/auth/components/log-in-form.tsx)
  - Display login button with basic error feedback.
- [src/providers/auth-provider.tsx](src/providers/auth-provider.tsx)
  - Auth context and state observer.
- [src/app/routes.tsx](src/app/routes.tsx)
  - Protected routing for `/dashboard/*`.

---

## Validation Checklist

- Firebase console: **Google** provider enabled.
- Firebase console: authorized domains include `localhost`, `*.web.app`.
- App loads login view at `/auth/login` when signed out.
- App loads protected view at `/dashboard` when signed in.
- Firestore document created once per user.

---

## Non-Goals

- Multi-provider auth
- Server-side sessions
- Backward compatibility for legacy auth views
