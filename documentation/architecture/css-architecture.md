# CSS Architecture

The application uses a hybrid approach combining **Tailwind CSS** for utility-first responsiveness and **Modular Feature CSS** for complex component-level behaviors and static assets.

## Core Hierarchy

### 1. Global Layer (`/assets/css/`)
- **global.css**: Universal resets, typography (Inter), base scrollbar branding, and cross-application animations (e.g., `animate-neural-in`).
- **layout.css**: Overrides for high-level structural components like the Header glassmorphism and MainLayout constraints.

### 2. Feature Layer (`/features/[feature]/assets/css/`)
Each feature module maintains its own stylesheet for domain-specific visual logic:
- **journal.css**: Handles the custom canvas oscilloscope and journal feed card hover states.
- **visual-graph.css**: D3-specific marker and group transitions that require precise selector targeting.
- **developer-graph.css**: Stability-focused styles for the graph architect, including rigid reordering animations.
- **settings.css**: Layout logic for the persistent Discord-style sidebar and sub-page transitions.
- **integration.css**: diagnostic feed scrollbars and raw data code formatting.

### 3. Tailwind-Only Features
Some features (e.g., **statistics**) use only Tailwind utility classes and have no dedicated CSS file. The statistics dashboard (radar charts, attribute cards, level views) relies on Tailwind for layout and Recharts' built-in SVG styling for chart rendering.

## Best Practices
1. **Utility-First**: Default to Tailwind for layout, spacing, and simple colors.
2. **Modular Extraction**: Extract to CSS when handling:
   - Vendor-specific pseudo-elements (e.g., `::-webkit-scrollbar`).
   - Complex D3/SVG state transitions.
   - Reusable feature-level "glass" effects.
3. **No Inline Styles**: Avoid the `<style>` tag within components to ensure CSP compliance and better cacheability.
