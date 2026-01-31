# Obsidian Integration

Sync your neural journal entries directly into your local Obsidian vault as Markdown files.

## Prerequisites
Requires the **[Obsidian Local REST API](https://coddingtonbear.github.io/obsidian-local-rest-api/)** plugin.
1. Enable the plugin in Obsidian.
2. Configure the **API Key** and **Port** in the Second Brain settings.

## Format
Entries are saved with rich YAML frontmatter, including the extracted domain, activity, and weighted action breakdown.

## Sync Logic
- **Trigger**: Automatic upon entry classification.
- **Upsert**: Updates existing files if the date-based filename matches, ensuring your vault stays current.