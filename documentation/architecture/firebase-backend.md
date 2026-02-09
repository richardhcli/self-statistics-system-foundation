# Firebase Backend (Architecture Index)

**Last Updated**: February 8, 2026

## Purpose
Firebase provides authentication and cloud persistence for user profile, settings, journal, and graph data. The app follows the Hybrid Read-Aside architecture: Firestore is the backend source of truth, while Zustand/IndexedDB is the smart cache.

## Quick Links
- Schema and naming rules: [documentation/architecture/firebase-backend-schema.md](firebase-backend-schema.md)
- Auth flow and providers: [documentation/architecture/firebase-backend-auth.md](firebase-backend-auth.md)
- Services, features, and operations: [documentation/architecture/firebase-backend-features.md](firebase-backend-features.md)

## Related Docs
- Firebase backend state (state-management): [documentation/state-management/firebase-backend.md](../state-management/firebase-backend.md)
- Migration plan: [FIREBASE_MIGRATION_PLAN.md](../../FIREBASE_MIGRATION_PLAN.md)

