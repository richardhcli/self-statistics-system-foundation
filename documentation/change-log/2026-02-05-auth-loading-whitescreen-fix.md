# Auth Loading Screen & Whitescreen Mitigation

**Date**: February 5, 2026  
**Status**: ✅ Implemented  
**Scope**: Authentication loading UX + routing alignment

---

## Summary

The app rendered a blank screen at startup because the authentication provider withheld rendering while Firebase auth initialized. This update introduces a dedicated loading screen during auth hydration and aligns the auth redirect to the URL-based `/app` route.

---

## Root Cause Analysis

**Primary Cause**:
- `AuthProvider` returned `null` while `loading` was `true`, so nothing was rendered during Firebase auth initialization.

**Secondary Contributors**:
- Auth redirect sent users to `/` (which then redirects to `/app`). This adds an unnecessary hop and can mask auth routing state in logs.

---

## Changes Applied

- Added a minimal loading screen inside `AuthProvider` while Firebase auth initializes.
- Redirect authenticated users from AuthView to `/app` directly.

---

## Plan of Action (If Symptoms Persist)

1. **Verify persistence init**:
   - Confirm `usePersistence()` resolves and `isInitialized` flips to `true`.
2. **Validate auth state**:
   - Ensure `onAuthStateChanged` fires (check console logs and Firebase config).
3. **Check routing context**:
   - Confirm `BrowserRouter` wraps `App` and routes render for `/auth/login`.
4. **Auth timeout diagnostics (implemented)**:
   - If auth init exceeds 8 seconds, show actionable diagnostics and a reload option.
   - Prompt checks for Firebase config, authorized domains, and network blockers.

---

## Files Updated

- src/providers/auth-provider.tsx
- src/features/auth/components/auth-view.tsx
