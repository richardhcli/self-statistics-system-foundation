
# Feature: Integrations

The Integrations module enables the "Neural Second Brain" to communicate with external web services and local productivity tools. It serves as the primary bridge between local-first cognitive data and the wider digital ecosystem.

## 🛠 Supported Engines

### 1. Outbound Webhooks
Send real-time JSON payloads to any HTTP endpoint. Perfect for Zapier, Make.com, or custom automation servers.
- **Trigger**: Automatic broadcast whenever an AI-processed entry is finalized.
- **Payload**: Contains original text, extracted duration, and the full 3-layer semantic analysis.
- **Diagnostics**: The integrated "Transmission Log" provides a detailed feed of all success/error states and raw data streams.

### 2. Obsidian Local REST API
A specialized integration for the Obsidian note-taking community. It bypasses the cloud entirely to write Markdown notes directly to your local computer via a secure REST bridge.
- **Configuration**: Requires the "Local REST API" plugin active in Obsidian with an authorized API key.
- **Output**: Generates Markdown files with rich YAML frontmatter, ensuring your life-log is searchable and formatted for long-term archival.

### 3. Data Portability (Backup & Restore)
Your neural data is yours. The Data Portability panel allows you to manage your IndexedDB state manually.
- **Export**: Download your entire application state (Journal, Graph, Stats) as a single, portable `.json` file.
- **Import**: Restore any valid neural-brain-backup file. Note that this is a destructive operation that replaces the current local state with the backup content.

## 💾 Security & Persistence
- **Firestore-Backed**: Integration secrets (API Keys, Webhook URLs) are stored in Firestore at `users/{uid}/account_config/integrations` and cached locally in the `user-integrations` Zustand store + IndexedDB.
- **Read-Aside Pattern**: Settings load from IndexedDB on boot, then sync from Firestore if stale.
- **Log Management**: Transmission logs are kept locally to help debug integrations. They can be purged at any time via the "Clear History" button.
