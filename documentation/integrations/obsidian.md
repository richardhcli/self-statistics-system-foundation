# Obsidian Integration

Sync your neural journal entries directly into your local Obsidian vault as Markdown files.

## Prerequisites
Requires the **[Obsidian Local REST API](https://coddingtonbear.github.io/obsidian-local-rest-api/)** plugin.
1. Enable the plugin in Obsidian.
2. Configure the **API Key** and **Port** in the app settings at `/app/settings/integrations`.
3. Configuration is stored in Firestore at `users/{uid}/account_config/integrations/obsidianConfig` and cached locally in the `user-integrations` Zustand store.

## Format
Entries are saved with rich YAML frontmatter, including the extracted domain, activity, and weighted action breakdown.

## Sync Logic
- **Trigger**: Automatic upon entry classification.
- **Upsert**: Updates existing files if the date-based filename matches, ensuring your vault stays current.