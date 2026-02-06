# Blueprint — Auth Loading Debug + Logout Flow

**Date**: February 6, 2026  
**Status**: 🟡 Implementation Blueprint  
**Scope**: Auth loading, timeout handling, logout route

---

## Problem Statement

The app can hang on the authentication loading screen if Firebase auth initialization never resolves. This blocks the login screen and creates a blank UX. Additionally, a timeout workaround can accidentally log out users if auth resolves late.

---

## Goals

1. Always render the UI even if auth initialization hangs.
2. Centralize the loading UI in AuthView.
3. Avoid logging out users due to timeout race conditions.
4. Provide a dedicated logout page and a settings entry point.
5. Reduce duplicate initialization logs during rapid prototyping.

---

## Implementation Plan

### 1) AuthProvider: Fail-Open Without Forced Logout
- Always render children.
- Expose `loading` and `hasTimedOut` via context.
- Timeout sets `hasTimedOut = true` and `loading = false` only.

### 2) AuthView: Loading Component
- Create `AuthLoadingScreen` inside AuthView.
- Render it when `loading` is true.
- When `hasTimedOut` is true, show diagnostics + reload option.

### 3) Logout Page
- Add `LogoutView` component with confirmation.
- Add `/auth/logout` route in app routing.
- Add logout button in Profile settings to navigate to `/auth/logout`.

### 4) Rapid Prototyping Adjustment
- Remove `React.StrictMode` from index.tsx to avoid double-init logs in dev.

---

## Files to Touch

- src/providers/auth-provider.tsx
- src/features/auth/components/auth-view.tsx
- src/features/auth/components/logout-view.tsx
- src/features/settings/components/profile-settings.tsx
- src/app/routes.tsx
- src/index.tsx
- documentation/authentication/authentication.md

---

## Success Criteria

- Login screen always appears even if auth init hangs.
- Timeout does not log out users.
- `/auth/logout` route works and signs user out.
- Logout button in profile settings navigates correctly.
- Duplicate init logs reduced in dev.
