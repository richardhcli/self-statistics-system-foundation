# Firebase Backend State (AI Agent Summary)

**Last Updated**: February 8, 2026

## Purpose
Firebase provides authentication and cloud persistence for user profile, settings, and graph/journal data. The app follows a hybrid read-aside model: Firestore is the source of truth and Zustand/IndexedDB act as the persistent cache via read-aside services.

## Current architecture: 

### Stack
- **Auth**: Firebase Auth (Google provider)
- **Database**: Firestore
- **Config**: [src/lib/firebase/services.ts](../../src/lib/firebase/services.ts)

### Firestore Schema (Current)

#### Naming rules
- **Collections/doc IDs**: Use snake_case.
- **Fields**: Use camelCase.

#### Schema: 
```
users/{uid} (document)
- displayName
- email
- photoURL
- createdAt
- lastUpdated

account_config (collection)
- ai_settings (document)
	- provider
	- model.voiceTranscriptionModel
	- model.abstractionModel
	- temperature
	- maxTokens
	- apiKey
- ui_preferences (document)
	- theme
	- language
	- showCumulativeExp
	- showMasteryLevels
	- showRecentAction
	- animateProgressBars
- privacy (document)
	- encryptionEnabled
	- visibilityMode
	- biometricUnlock
- notifications (document)
	- pushEnabled
	- weeklySummaryEnabled
	- instantFeedbackEnabled
- integrations (document)
	- config
		- webhookUrl
		- enabled
		- secret
	- obsidianConfig
		- enabled
		- host
		- port
		- apiKey
		- useHttps
		- targetFolder
	- logs
- billing_settings (document)
	- plan
	- status

user_information (collection)
- profile_display (document)
	- class
- player_statistics (document)
	- stats

journal_meta (collection)
- tree_structure (document)
	- {YYYY}.months.{MM}.days.{DD}.entries
	- {YYYY}.totalExp
	- {YYYY}.months.{MM}.totalExp
	- {YYYY}.months.{MM}.days.{DD}.totalExp

journal_entries (collection)
- {entryId} (document, format: YYYYMMDD-HHmmss-suffix)
	- content
	- status
	- actions
	- result
	- metadata

graphs (collection)
- cdag_topology (document)
	- adjacencyList
	- nodeSummaries
	- metrics
	- version
	- lastUpdated
	- nodes (subcollection)
		- {nodeId}
	- edges (subcollection)
		- {edgeId}

```



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

## Auth Flow (Current)
- UI: [src/features/auth/components/auth-view.tsx](../../src/features/auth/components/auth-view.tsx)
- Provider: [src/providers/auth-provider.tsx](../../src/providers/auth-provider.tsx)
- Login: [src/features/auth/utils/login-google.ts](../../src/features/auth/utils/login-google.ts)
- On login: `syncUserProfile` seeds Firestore on first login and smart-syncs profile fields.

## Usage


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
- `loadIntegrationSettings`, `updateIntegrationSettings`
- Player statistics: [src/lib/firebase/player-statistics.ts](../../src/lib/firebase/player-statistics.ts)

### Routing Context
Routes are URL-based under /app. Settings lives under /app/settings/*.
See [src/app/routes.tsx](../../src/app/routes.tsx).

## Configs

### Firestore security rules
The current rules config for firestore database:

rules_version='2'

service cloud.firestore {
	match /databases/{database}/documents {
		// Matches the user document and ALL subcollections recursively
		match /users/{uid}/{document=**} {
			allow read, write: if request.auth != null && request.auth.uid == uid;
		}
	}
}


### Default Seed Values (First Login)
Defined in [src/lib/firebase/user-profile.ts](../../src/lib/firebase/user-profile.ts)
- ai_settings: provider gemini, voice model gemini-2-flash, abstraction model gemini-3-flash, temperature 0, maxTokens 2048, apiKey empty
- ui_preferences: theme dark, language en, visibility toggles true
- privacy: encryptionEnabled true, visibilityMode private, biometricUnlock false
- notifications: all enabled
- integrations: config + obsidian config defaults, logs empty
- billing_settings: free, active
- profile_display: class empty
- player_statistics: progression seeded

## Settings UI Mapping
- **Profile**: display name in users/{uid}
- **Status Display**: class in user_information/profile_display, visibility toggles in account_config/ui_preferences
- **AI Features**: account_config/ai_settings
- **Privacy**: account_config/privacy
- **Notifications**: account_config/notifications

## Common Errors
- **FirebaseError: Missing or insufficient permissions**
	- Likely cause: Firestore rules do not allow subcollection access.
	- Fix: ensure rules cover users/{uid}/{document=**} and restrict to request.auth.uid == uid.
- **FirebaseError: Invalid document reference**
	- Likely cause: using a document path with an odd number of segments.
	- Fix: ensure document paths have even segments (e.g., users/{uid}/graphs/cdag_topology).

