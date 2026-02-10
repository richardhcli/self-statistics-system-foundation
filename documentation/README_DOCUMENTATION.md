# Documentation Index

**Last Updated**: February 10, 2026  
**Purpose**: Central entry point for all project documentation

---

## 🚀 Quick Start for AI Agents

**START HERE**: [ai-guidelines.md](../ai-guidelines.md)

This is the primary reference for AI agents (GitHub Copilot, Claude, etc.). It provides:
- Project philosophy and architecture
- Specific patterns and rules
- Common do's and don'ts
- Quick decision trees
- References to deeper documentation

---

## 📋 Documentation Structure

### Core Architecture (Start Here)
| File | Purpose | Best For |
|------|---------|----------|
| **[ai-guidelines.md](../ai-guidelines.md)** | AI-focused quick reference | AI agents, rapid decisions |
| **[architecture/architecture.md](./architecture/architecture.md)** | High-level structure + folder map | Project onboarding |
| **[architecture/architecture-lib-vs-stores.md](./architecture/architecture-lib-vs-stores.md)** | /lib vs /stores vs /systems protocol | Implementation decisions |

### State Management (By Use Case)
| File | Purpose | Best For |
|------|---------|----------|
| **[state-management/state-management-README.md](./state-management/state-management-README.md)** | Overview and decision tree | Choosing state approach |
| **[state-management/GLOBAL_STATE.md](./state-management/GLOBAL_STATE.md)** | Zustand pattern spec (IMMUTABLE) | Implementing new stores |
| **[state-management/ORCHESTRATOR_PATTERN.md](./state-management/ORCHESTRATOR_PATTERN.md)** | Cross-store coordination | Multi-store logic |
| **[state-management/LOCAL_STATE.md](./state-management/LOCAL_STATE.md)** | Component-level state | UI state management |
| **[state-management/firebase-backend.md](./state-management/firebase-backend.md)** | Firebase schema + auth flow | Backend integration |

### Data & Persistence
| File | Purpose | Best For |
|------|---------|----------|
| **[PERSISTENCE_ARCHITECTURE.md](./PERSISTENCE_ARCHITECTURE.md)** | IndexedDB & Zustand setup | Debugging persistence |
| **[cdag-topology.md](./cdag-topology.md)** | Concept DAG design | Understanding the graph |

### AI & Gamification
| File | Purpose | Best For |
|------|---------|----------|
| **[ai-and-gamification.md](./ai-and-gamification.md)** | AI pipeline + progression system | EXP engine, level curve, attributes |

### Firebase Backend
| File | Purpose | Best For |
|------|---------|----------|
| **[architecture/firebase-backend.md](./architecture/firebase-backend.md)** | Index of Firebase docs | Quick links |
| **[architecture/firebase-backend-schema.md](./architecture/firebase-backend-schema.md)** | Firestore schema | Data modeling |
| **[architecture/firebase-backend-auth.md](./architecture/firebase-backend-auth.md)** | Auth flow | Authentication |
| **[architecture/firebase-backend-features.md](./architecture/firebase-backend-features.md)** | Services + operations | Backend features |

### Feature Documentation
| File | Purpose |
|------|--------|
| **[docs-features/features-statistics.md](./docs-features/features-statistics.md)** | Statistics RPG dashboard |
| **[docs-features/features-journal.md](./docs-features/features-journal.md)** | Journal pipeline overview |
| **[docs-features/features-visual-graph.md](./docs-features/features-visual-graph.md)** | Concept graph visualization |
| **[docs-features/features-developer-graph.md](./docs-features/features-developer-graph.md)** | Developer graph editor |
| **[docs-features/features-settings.md](./docs-features/features-settings.md)** | Settings interface |
| **[docs-features/features-debug.md](./docs-features/features-debug.md)** | Debug console |
| **[docs-features/features-integration.md](./docs-features/features-integration.md)** | Webhooks & Obsidian |
| **[docs-features/features-user-info.md](./docs-features/features-user-info.md)** | User identity |
| **[docs-features/features-datastores-debug.md](./docs-features/features-datastores-debug.md)** | Datastore debug tools |

### Project Evolution
| File | Purpose | Best For |
|------|---------|----------|
| **[changelog.md](./changelog.md)** | Version history | Understanding releases |
| **[CHANGELOG_SUMMARY.md](./CHANGELOG_SUMMARY.md)** | Major milestones & decisions | Recent changes |
| **[change-log/](./change-log/)** | Detailed session logs | Deep historical context |
| **[ROADMAP.md](./ROADMAP.md)** | Future features | Planning |
| **[next_steps.md](./next_steps.md)** | Immediate TODO items | Next actions |

### Additional Resources
| File | Purpose |
|------|--------|
| **[tech-stack.md](./tech-stack.md)** | Technologies & versions |
| **[architecture/css-architecture.md](./architecture/css-architecture.md)** | CSS layering strategy |
| **[architecture/feature-composition.md](./architecture/feature-composition.md)** | Component composition patterns |
| **[integrations/](./integrations/)** | Integration details |
| **[authentication/authentication.md](./authentication/authentication.md)** | Auth flow & components |

---

## 🎯 Reading Guide by Role

### 🤖 AI Agents (Copilot, Claude, etc.)
1. **Start**: [ai-guidelines.md](../ai-guidelines.md) — Quick reference with patterns & examples
2. **Deep Dive**: [state-management/](./state-management/) — Specific pattern specs
3. **Context**: [architecture/architecture.md](./architecture/architecture.md) — Folder structure

### 👨‍💻 New Developers
1. **Start**: [architecture/architecture.md](./architecture/architecture.md) — Overall structure
2. **State Management**: [state-management/state-management-README.md](./state-management/state-management-README.md) — How state works
3. **Implementation**: [architecture/architecture-lib-vs-stores.md](./architecture/architecture-lib-vs-stores.md) — Where to put code
4. **Reference**: [ai-guidelines.md](../ai-guidelines.md) — Quick rules & patterns

---

## 📝 Document Standards

### Immutable Documents
These represent enforceable standards and should not be modified without careful consideration:
- `state-management/GLOBAL_STATE.md` — Zustand store pattern
- `architecture/architecture-lib-vs-stores.md` — /lib vs /stores separation

### Descriptive Documents
These provide context and guidance; updated as the project evolves:
- `ai-guidelines.md` — AI agent reference
- All feature docs, architecture overviews, and changelogs

---

## 📌 How to Keep Documentation Accurate

1. **After major refactors**: Update [ai-guidelines.md](../ai-guidelines.md) and relevant pattern docs
2. **After new features**: Update the relevant doc in [docs-features/](./docs-features/)
3. **Significant changes**: Note in [CHANGELOG_SUMMARY.md](./CHANGELOG_SUMMARY.md)
4. **Version releases**: Update [changelog.md](./changelog.md)
