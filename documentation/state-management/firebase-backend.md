# Firebase Backend State (AI Agent Summary)

**Last Updated**: February 7, 2026

## Purpose
Firebase provides authentication and cloud persistence for user profile + settings. The app remains local-first for core data; Firestore holds account/profile configuration and is the backend source for Settings UI.

## Current architecture: 

### Stack
- **Auth**: Firebase Auth (Google provider)
- **Database**: Firestore
- **Config**: [src/lib/firebase/services.ts](../../src/lib/firebase/services.ts)

### Firestore Schema (Current)
```
users/{uid}
	displayName
	email
	photoURL
	createdAt
	lastUpdated

	account-config/
		ai-settings
			provider
			model.voiceTranscriptionModel
			model.abstractionModel
			temperature
			maxTokens
		ui-preferences
			theme
			language
			showCumulativeExp
			showMasteryLevels
			showRecentAction
			animateProgressBars
		privacy
			encryptionEnabled
			visibilityMode
			biometricUnlock
		notifications
			pushEnabled
			weeklySummaryEnabled
			instantFeedbackEnabled
		integrations
			obsidianEnabled
			webhookUrl
			webhookEnabled
		billing-settings
			plan
			status

	user-information/
		profile-display
			class
```

## features:

## Auth Flow (Current)
- UI: [src/features/auth/components/auth-view.tsx](../../src/features/auth/components/auth-view.tsx)
- Provider: [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx)
- Login: [src/features/auth/utils/login-google.ts](../../src/features/auth/utils/login-google.ts)
- On login: `syncUserProfile` seeds Firestore on first login and smart-syncs profile fields.

## Usage: 

### Firestore Helpers (Use These)
All in [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)
- `syncUserProfile` (first login + smart sync)
- `loadUserProfile`, `updateUserProfile`
- `loadAccountConfig`, `updateAccountConfig`
- `loadAISettings`, `updateAISettings`
- `loadUIPreferences`, `updateUIPreferences`
- `loadPrivacySettings`, `updatePrivacySettings`
- `loadNotificationSettings`, `updateNotificationSettings`
- `loadProfileDisplay`, `updateProfileDisplay`

### Routing Context
Routes are URL-based under `/app`. Settings lives under `/app/settings/*`.
See [src/app/routes.tsx](../../src/app/routes.tsx).

## Configs: 

### firebase security rules:
The current rules config for firestore database:
```
rules_version='2'

service cloud.firestore {
  match /databases/{database}/documents {
    // Matches the user document and ALL subcollections recursively
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

  }
}
```

### Default Seed Values (First Login)
Defined in [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)
- `ai-settings`: provider gemini, voice model gemini-2-flash, abstraction model gemini-3-flash, temperature 0, maxTokens 2048
- `ui-preferences`: theme dark, language en, visibility toggles true
- `privacy`: encryptionEnabled true, visibilityMode private, biometricUnlock false
- `notifications`: all enabled
- `integrations`: obsidian/webhook disabled
- `billing-settings`: free, active
- `profile-display`: class empty

## Settings UI Mapping
- **Profile**: display name in `users/{uid}`
- **Status Display**: class in `user-information/profile-display`, visibility toggles in `account-config/ui-preferences`
- **AI Features**: `account-config/ai-settings`
- **Privacy**: `account-config/privacy`
- **Notifications**: `account-config/notifications`

## Common Error
**FirebaseError: Missing or insufficient permissions**
- Most likely cause: Firestore rules do not allow subcollection access.
- Fix: ensure rules cover `users/{uid}/{document=**}` and restrict to `request.auth.uid == uid`.

