# Firebase Backend Schema

**Last Updated**: February 8, 2026

## Naming Rules
- Collections and document IDs use snake_case.
- Fields use camelCase.

## Schema Overview

### User Profile
- Path: users/{uid}
- Key fields: displayName, email, photoURL, createdAt, lastUpdated

### Account Configuration
- Collection: users/{uid}/account_config
- Documents:
  - ai_settings: provider, model.voiceTranscriptionModel, model.abstractionModel, temperature, maxTokens, apiKey
  - ui_preferences: theme, language, showCumulativeExp, showMasteryLevels, showRecentAction, animateProgressBars
  - privacy: encryptionEnabled, visibilityMode, biometricUnlock
  - notifications: pushEnabled, weeklySummaryEnabled, instantFeedbackEnabled
  - integrations: config.webhookUrl, config.enabled, config.secret, obsidianConfig, logs
  - billing_settings: plan, status

### User Information
- Collection: users/{uid}/user_information
- Document: profile_display
  - class
- Document: player_statistics
  - stats

### Journal
- Collection: users/{uid}/journal_meta
  - Document: tree_structure
- Collection: users/{uid}/journal_entries
  - Document ID format: YYYYMMDD-HHmmss-suffix

### Graphs (CDAG)
- Collection: users/{uid}/graphs
  - Document: cdag_topology
    - Fields: adjacencyList, nodeSummaries, metrics, version, lastUpdated
  - Subcollections: nodes, edges

## References
- Schema types: [src/types/firestore.ts](../../src/types/firestore.ts)
- Journal service: [src/lib/firebase/journal.ts](../../src/lib/firebase/journal.ts)
- Graph service: [src/lib/firebase/graph-service.ts](../../src/lib/firebase/graph-service.ts)
