# Blueprint: Anonymous Guest Authentication & Banner System

This document outlines the technical implementation plan for **Anonymous Authentication** and a **Guest Banner**, updated to match the specific architecture of the project.

---

## 🔍 Context & Architecture Updates

This plan has been refined based on the existing project structure.

| Blueprint Reference | Actual Project State | Correction / Action |
| :--- | :--- | :--- |
| `src/features/auth/api/login.ts` | File does not exist. Generic auth logic is in `src/features/auth/utils/`. | Create [src/features/auth/utils/login-guest.ts](../../src/features/auth/utils/login-guest.ts) to match [src/features/auth/utils/login-google.ts](../../src/features/auth/utils/login-google.ts). |
| `src/features/auth/components/LoginForm.tsx` | Actual file is [src/features/auth/components/log-in-form.tsx](../../src/features/auth/components/log-in-form.tsx). | Update [src/features/auth/components/log-in-form.tsx](../../src/features/auth/components/log-in-form.tsx) to include the "Continue as Guest" trigger. |
| **User Data Sync** | `loginWithGoogle` currently syncs user profile to Firestore. | Guest login should also create a placeholder profile and defaults via [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts) to keep read-aside flows consistent. |
| **Banner Placement** | "Top of the Dashboard" is generic. | The correct location is [src/components/layout/main-layout.tsx](../../src/components/layout/main-layout.tsx), so it appears on every protected route. |
| **Component Naming** | `GuestBanner.tsx` | Use kebab-case [src/components/notifications/guest-banner.tsx](../../src/components/notifications/guest-banner.tsx). |

---

## 🛠️ Implementation Plan

### Phase 1: Authentication Logic (Backend & Utils)

**Goal:** Allow users to sign in without credentials using Firebase Anonymous Auth.

1.  **Firebase Config**:
    *   Ensure the "Anonymous" sign-in provider is enabled in the Firebase Console.
    *   Note: This is the only console change required for client auth.

2.  **Create Login Utility**:
    *   **File:** [src/features/auth/utils/login-guest.ts](../../src/features/auth/utils/login-guest.ts)
    *   **Task:** Create `loginAsGuest` helper.
    *   **Implementation Details:**
        *   Import `auth` from `@/lib/firebase` and call `signInAnonymously(auth)`.
        *   Sync a placeholder profile via [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts) to align with read-aside store fetches.
        *   Return the Firebase `user` object.

### Phase 2: UI Updates (Login Screen)

**Goal:** Add the entry point for guest users.

1.  **Update Login Form**:
    *   **File:** [src/features/auth/components/log-in-form.tsx](../../src/features/auth/components/log-in-form.tsx)
    *   **Task:** Add a "Continue as Guest" button below the Google Sign-In button.
    *   **Logic:**
        *   On click, call `loginAsGuest()`.
        *   Handle loading states (`isSubmitting`) to prevent double-clicks.
        *   Note: Do not remove existing Google functionality. This is additive.

### Phase 3: The Guest Banner (UX & Conversion)

**Goal:** Persist user awareness that their account is temporary and data is local/volatile.

1.  **Create Banner Component**:
    *   **File:** [src/components/notifications/guest-banner.tsx](../../src/components/notifications/guest-banner.tsx)
    *   **Task:** Create a component that consumes `useAuth()`.
    *   **Logic:**
        *   If `!user` or `!user.isAnonymous`, return `null`.
        *   Render a warning banner that explains guest data is tied to this device.
        *   Include a "Sign Up / Save Progress" button.

2.  **Integrate Banner**:
    *   **File:** [src/components/layout/main-layout.tsx](../../src/components/layout/main-layout.tsx)
    *   **Task:** Import `GuestBanner` and place it immediately inside the main wrapper, *before* the header.
    *   **Style:** Ensure the banner pushes content down rather than blocking UI.

### Phase 4: Account Upgrading (Critical Logic)

**Goal:** Prevent data loss when a guest decides to sign up.

1.  **Linking Logic**:
    *   **File:** [src/features/auth/utils/link-account.ts](../../src/features/auth/utils/link-account.ts) (New File)
    *   **Task:** Implement `linkAccountWithGoogle()`.
    *   **Implementation Details:**
        *   Use Firebase `linkWithPopup` and the existing Google provider.
        *   Throw if there is no authenticated user or if the user is already linked.
        *   Handle `auth/credential-already-in-use` by deleting guest data via [src/lib/firebase/guest-cleanup.ts](../../src/lib/firebase/guest-cleanup.ts), deleting the anonymous user, and signing into the existing account.
        *   Clear local IndexedDB caches and reset in-memory stores via [src/stores/root/reset-local-state.ts](../../src/stores/root/reset-local-state.ts) before signing in.
    *   **Usage:** Connect this function to the button in `GuestBanner`.

---

## 🧠 Critical AI Context & "Gotchas"

*   **Auth State Listener:** No changes needed in [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx). The existing listener handles anonymous users.
*   **Firestore Security:** Anonymous users have valid UIDs. Ensure rules do not require `email_verified` if you want guests to save data.
*   **Routing:** The protected route in [src/routes/protected-route.tsx](../../src/routes/protected-route.tsx) checks for `user`. Anonymous users are valid users, so they can access the app without routing changes.
