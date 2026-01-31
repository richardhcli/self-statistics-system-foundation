# Integrations Overview

The **Neural Second Brain** is an open node designed for the modern productivity ecosystem.

## Outbound Webhooks
The primary engine is a real-time JSON Webhook system. Whenever a journal entry is classified, the system broadcasts a payload to your configured URL.

### Standardized Payload
```json
{
  "event": "JOURNAL_AI_PROCESSED",
  "timestamp": "2024-01-08T12:00:00.000Z",
  "data": {
    "originalText": "Transcription text...",
    "analysis": {
      "characteristics": ["Intellect"],
      "skills": ["Coding"],
      "weightedActions": [{ "label": "Debugging", "weight": 1.0 }],
      "duration": "45 mins"
    }
  }
}
```

## Diagnostics
The Integrations view includes a **Transmission Log** recording status, the raw JSON payload, and server feedback for every attempt.