# Blueprint: Anonymous Guest Authentication & Banner System

This document outlines the technical implementation plan for **Anonymous Authentication** and a **Guest Banner**, updated to match the specific architecture of the `journal-&-graph-ai-demo` project.

---

## 🔍 Context & Architecture Updates

This plan has been refined based on the existing project structure.

| Blueprint Reference | Actual Project State | Correction / Action |
| :--- | :--- | :--- |
| `src/features/auth/api/login.ts` | File does not exist. Generic auth logic is in `src/features/auth/utils/`. | Create **`src/features/auth/utils/login-guest.ts`** to match the pattern of `login-google.ts`. |
| `src/features/auth/components/LoginForm.tsx` | Actual file is **`src/features/auth/components/log-in-form.tsx`**. | Update `log-in-form.tsx` to include the "Continue as Guest" trigger. |
| **User Data Sync** | `loginWithGoogle` currently syncs user profile to Firestore. | Anonymous login **must** check if it needs to create a placeholder document in Firestore or if it can run purely local until upgrade. |
| **Banner Placement** | "Top of the Dashboard" is generic. | The correct location is **`src/components/layout/main-layout.tsx`**, so it appears on every protected route. |
| **Component Naming** | `GuestBanner.tsx` | Use kebab-case **`src/components/notifications/guest-banner.tsx`**. |

---

## 🛠️ Implementation Plan

### Phase 1: Authentication Logic (Backend & Utils)

**Goal:** Allow users to sign in without credentials using Firebase Anonymous Auth.

1.  **Firebase Config**:
    *   Ensure the 'Anonymous' sign-in provider is enabled in the Firebase Console.

2.  **Create Login Utility**:
    *   **File:** `src/features/auth/utils/login-guest.ts`
    *   **Task:** Create `loginAsGuest` helper.
    *   **Implementation Details:** Import `auth` from `@/lib/firebase`. Call `signInAnonymously(auth)`. Return the user object.

### Phase 2: UI Updates (Login Screen)

**Goal:** Add the entry point for guest users.

1.  **Update Login Form**:
    *   **File:** `src/features/auth/components/log-in-form.tsx`
    *   **Task:** Add a "Continue as Guest" button below the Google Sign-In button.
    *   **Logic:**
        *   On click, call `loginAsGuest()`.
        *   Handle loading states (`isSubmitting`) to prevent double-clicks.
        *   *Note:* Do not remove existing Google functionality. This is additive.

### Phase 3: The Guest Banner (UX & Conversion)

**Goal:** Persist user awareness that their account is temporary and data is local/volatile.

1.  **Create Banner Component**:
    *   **File:** `src/components/notifications/guest-banner.tsx`
    *   **Task:** Create a component that consumes `useAuth()`.
    *   **Logic:**
        *   If `!user` or `!user.isAnonymous`, return `null`.
        *   Render a warning banner (e.g., yellow background) with text: "You are in Guest Mode. Data is saved locally."
        *   Include a "Sign Up / Save Progress" button.

2.  **Integrate Banner**:
    *   **File:** `src/components/layout/main-layout.tsx`
    *   **Task:** Import `GuestBanner` and place it immediately inside the main wrapper, *before* the `<Outlet />` or header.
    *   **Style:** Ensure the banner pushes content down rather than blocking UI.

### Phase 4: Account Upgrading (Critical Logic)

**Goal:** Prevent data loss when a guest decides to sign up.

1.  **Linking Logic**:
    *   **File:** `src/features/auth/utils/link-account.ts` (New File)
    *   **Task:** Implement `linkAccountWithGoogle()`.
    *   **Code Snapshot:**
        ```typescript
        import { linkWithPopup, GoogleAuthProvider } from "firebase/auth";
        import { auth } from "@/lib/firebase";

        export const linkAccountWithGoogle = async () => {
          if (!auth.currentUser) throw new Error("No user to link");
          const provider = new GoogleAuthProvider();
          return await linkWithPopup(auth.currentUser, provider);
        };
        ```
    *   **Usage:** Connect this function to the button in `GuestBanner`.

---

## 🧠 Critical AI Context & "Gotchas"

*   **Auth State Listener:** No changes needed in `src/providers/auth-provider.tsx`. The existing `onAuthStateChanged` listener automatically handles anonymous users.
*   **Firestore Security:** Anonymous users have valid UIDs. Existing rules checking `request.auth.uid` will work. Ensure rules don't strictly require `email_verified` for write access if you want guests to save data.
*   **Routing:** The `ProtectedRoute` (in `src/routes/protected-route.tsx`) checks for `user`. Anonymous users are valid users, so they will access the app without routing changes.
