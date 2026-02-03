# Documentation Index

**Last Updated**: February 2, 2026  
**Purpose**: Central entry point for all project documentation

---

## 🚀 Quick Start for AI Agents

**START HERE**: [ai-guidelines.md](./ai-guidelines.md)

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
| **[ai-guidelines.md](./ai-guidelines.md)** | AI-focused quick reference | AI agents, rapid decisions |
| **[architecture/architecture.md](./architecture/architecture.md)** | High-level structure | Project onboarding |
| **[architecture/architecture-lib-vs-stores.md](./architecture/architecture-lib-vs-stores.md)** | /lib vs /stores protocol | Implementation decisions |

### State Management (By Use Case)
| File | Purpose | Best For |
|------|---------|----------|
| **[state-management/state-management-README.md](./state-management/state-management-README.md)** | Overview and decision tree | Choosing state approach |
| **[state-management/GLOBAL_STATE.md](./state-management/GLOBAL_STATE.md)** | Zustand pattern spec (IMMUTABLE) | Implementing new stores |
| **[state-management/ORCHESTRATOR_PATTERN.md](./state-management/ORCHESTRATOR_PATTERN.md)** | Cross-store coordination | Multi-store logic |
| **[state-management/LOCAL_STATE.md](./state-management/LOCAL_STATE.md)** | Component-level state | UI state management |

### Data & Persistence
| File | Purpose | Best For |
|------|---------|----------|
| **[PERSISTENCE_ARCHITECTURE.md](./PERSISTENCE_ARCHITECTURE.md)** | IndexedDB & Zustand setup | Debugging persistence |

### Project Evolution
| File | Purpose | Best For |
|------|---------|----------|
| **[CHANGELOG_SUMMARY.md](./CHANGELOG_SUMMARY.md)** | Major milestones & decisions | Understanding recent changes |
| **[change-log/](./change-log/)** | Detailed session logs | Deep historical context |

### Additional Resources
| File | Purpose | Best For |
|------|---------|----------|
| **[tech-stack.md](./tech-stack.md)** | Technologies used | Understanding dependencies |
| **[ROADMAP.md](./ROADMAP.md)** | Future features | Planning |
| **[cdag-topology.md](./cdag-topology.md)** | Concept DAG design | Understanding topology |
| **[graph-visualization.md](./graph-visualization.md)** | D3 visualization | Visual system details |
| **[docs-features/](./docs-features/)** | Feature-specific docs | Individual feature details |

---

## 🎯 Reading Guide by Role

### 🤖 AI Agents (Copilot, Claude, etc.)
1. **Start**: [ai-guidelines.md](./ai-guidelines.md) — Quick reference with patterns & examples
2. **Deep Dive**: [state-management/](./state-management/) — Specific pattern specs
3. **Context**: [architecture/architecture.md](./architecture/architecture.md) — Folder structure

### 👨‍💻 New Developers
1. **Start**: [architecture/architecture.md](./architecture/architecture.md) — Overall structure
2. **State Management**: [state-management/state-management-README.md](./state-management/state-management-README.md) — How state works
3. **Implementation**: [architecture/architecture-lib-vs-stores.md](./architecture/architecture-lib-vs-stores.md) — Where to put code
4. **Reference**: [ai-guidelines.md](./ai-guidelines.md) — Quick rules & patterns

### 🔧 Implementing New Stores
1. **Reference**: [state-management/GLOBAL_STATE.md](./state-management/GLOBAL_STATE.md) — Pattern spec
2. **Example**: Check existing stores in `src/stores/`
3. **Validate**: [ai-guidelines.md](./ai-guidelines.md#3-state-management-the-separated-selector-facade-pattern-pattern-c)

### 🔗 Multi-Store Logic
1. **Reference**: [state-management/ORCHESTRATOR_PATTERN.md](./state-management/ORCHESTRATOR_PATTERN.md)
2. **Example**: `src/hooks/use-entry-orchestrator.ts`
3. **Validate**: [ai-guidelines.md](./ai-guidelines.md#6-cross-store-orchestration-the-orchestrator-hook-pattern)

---

## 📝 Document Standards

### Immutable Documents
These represent enforceable standards and should not be modified without careful consideration:
- `state-management/GLOBAL_STATE.md` — Zustand store pattern
- `architecture/architecture-lib-vs-stores.md` — /lib vs /stores separation

### Descriptive Documents
These provide context and guidance; may be updated as the project evolves:
- `ai-guidelines.md` — AI agent reference (updated with project changes)
- `state-management/state-management-README.md` — Overview
- `architecture/architecture.md` — Architecture overview
- All feature docs and changelogs

---

## ⚠️ Known Contradictions

See **[ai-guidelines.md §12](./ai-guidelines.md#12-known-contradictions--decisions-needed)** for documented contradictions that need resolution.

---

## 📌 How to Keep Documentation Accurate

1. **After major refactors**: Update [ai-guidelines.md](./ai-guidelines.md) and relevant pattern docs
2. **After new features**: Add summary to [docs-features/](./docs-features/)
3. **Significant changes**: Note in [CHANGELOG_SUMMARY.md](./CHANGELOG_SUMMARY.md)
4. **Edge cases discovered**: Mention in relevant pattern doc and [ai-guidelines.md](./ai-guidelines.md#12-known-contradictions--decisions-needed)
