# Auth Loading Debug + Logout Flow

**Date**: February 6, 2026  
**Status**: ✅ Implemented  
**Scope**: Auth loading UI, timeout handling, logout page

---

## Summary

The app was stuck on the auth loading screen because Firebase auth initialization sometimes never resolved. The loading UI has been moved into AuthView and a fail-open timeout now allows UI to render without forcefully logging users out. A dedicated logout page and settings button were added.

---

## Changes Applied

- Moved auth loading UI into AuthView as a reusable component.
- AuthProvider now always renders children and only exposes loading state.
- Timeout no longer forces a logout (prevents race-condition sign-outs).
- Added `/auth/logout` page with sign-out confirmation.
- Added logout button in Profile settings.
- Removed StrictMode in index.tsx to avoid duplicate init logs during rapid prototyping.

---

## Files Updated

- src/providers/auth-provider.tsx
- src/features/auth/components/auth-view.tsx
- src/features/auth/components/logout-view.tsx
- src/features/settings/components/profile-settings.tsx
- src/app/routes.tsx
- src/index.tsx
- documentation/authentication/authentication.md
