# 2026-02-02: Structured Layer Mappings Migration

**Status**: ✅ Complete Breaking Change Migration

## Overview
Major structural improvement to the AI pipeline. Migrated from flat string arrays to explicit parent-child mappings for all topology layers. Changed duration from string to integer minutes. This creates a more mathematically sound and semantically clear system.

## Breaking Changes ⚠️

### 1. Duration Format Change

**Before**:
```typescript
{
  duration: "30 mins"  // string
}
```

**After**:
```typescript
{
  durationMinutes: 30  // integer
}
```

**Impact**: All duration handling now uses integer minutes for precise time tracking.

### 2. Skills Layer - Now Structured Mappings

**Before**:
```typescript
{
  skills: ["Software engineering"]  // flat array
}
```

**After**:
```typescript
{
  skillMappings: [
    { child: "Debugging", parent: "Software engineering", weight: 0.6 },
    { child: "Code review", parent: "Software engineering", weight: 0.4 }
  ]
}
```

**Impact**: Every action explicitly connected to its parent skill with a weight.

### 3. Characteristics Layer - Now Structured Mappings

**Before**:
```typescript
{
  characteristics: ["Intellect"]  // flat array
}
```

**After**:
```typescript
{
  characteristicMappings: [
    { child: "Software engineering", parent: "Intellect", weight: 0.8 }
  ]
}
```

**Impact**: Every skill explicitly connected to its parent characteristic with a weight.

## What Changed

### Type Definitions (TextToActionResponse)

```typescript
// OLD
interface TextToActionResponse {
  duration: string;
  weightedActions: WeightedAction[];
  skills: string[];
  characteristics: string[];
  generalizationChain?: GeneralizationLink[];
}

// NEW
interface TextToActionResponse {
  durationMinutes: number;
  weightedActions: WeightedAction[];
  skillMappings: GeneralizationLink[];           // NEW: explicit action→skill
  characteristicMappings: GeneralizationLink[];  // NEW: explicit skill→characteristic
  generalizationChain?: GeneralizationLink[];
}
```

### AI Prompt (SINGLE_PROMPT_TOPOLOGY_PROMPT)

**Enhanced with**:
- Integer duration format with explicit rules and examples
- Step-by-step guidance for creating skillMappings
- Step-by-step guidance for creating characteristicMappings
- Validation rules: every action MUST appear in skillMappings
- Validation rules: every skill MUST appear in characteristicMappings
- Comprehensive examples showing proper mapping structure

**Key Improvement**:
```
## STEP 4: SKILL MAPPING (STRUCTURED)
FORMAT: Return an array of { child: "<action>", parent: "<skill>", weight: <0.1-1.0> }
- child = action label from Step 1
- parent = skill that encompasses this action
- weight = proportion of skill comprised by this action

RULE: Every action MUST appear as a child in at least one skill mapping.
```

### Transform Logic (transformAnalysisToTopology)

**Before**: Built 3-layer structure with implicit connections
**After**: Builds multi-layer structure from explicit parent-child mappings

```typescript
// Layer-by-layer construction using structured mappings:

// Layer 1: Actions (from weightedActions)
analysis.weightedActions.forEach(wa => {
  nodes[wa.label] = { id: wa.label, type: 'action', ... };
});

// Layer 2: Skills + Edges (from skillMappings)
analysis.skillMappings.forEach(mapping => {
  nodes[mapping.parent] = { id: mapping.parent, type: 'skill', ... };
  edges[`${mapping.parent}->${mapping.child}`] = { 
    source: mapping.parent,
    target: mapping.child,
    weight: mapping.weight 
  };
});

// Layer 3: Characteristics + Edges (from characteristicMappings)
analysis.characteristicMappings.forEach(mapping => {
  nodes[mapping.parent] = { id: mapping.parent, type: 'characteristic', ... };
  edges[`${mapping.parent}->${mapping.child}`] = { 
    source: mapping.parent,
    target: mapping.child,
    weight: mapping.weight 
  };
});

// Layer 4: Generalization chain (unchanged)
```

**Graceful Handling**: Empty arrays are fine - only creates nodes/edges that exist.

### Validation Logic (analyzeEntry)

**New Validations**:
- ✅ Mapping integrity checks (warns if layers disconnected)
- ✅ Duration format validation (integer minutes)
- ✅ Characteristics extracted from mappings (not flat arrays)
- ✅ Skills extracted from mappings (not flat arrays)

**Removed**:
- ❌ No more "default General Activity/General Domain" sanitization
- ❌ Empty arrays are allowed (represent valid failure cases)

### Duration Parsing (parseDurationToMultiplier)

**Enhanced**:
```typescript
// Primary path: integer minutes
parseDurationToMultiplier(60) // returns 2.0

// Legacy fallback: string parsing (for user overrides)
parseDurationToMultiplier("2h") // returns 2.0
```

## Architectural Benefits

### 1. Explicit Graph Structure
Every edge now has an explicit weight representing the connection strength between parent and child nodes.

### 2. Mathematical Soundness
```
Action weights sum to 1.0 (validated)
Skill mapping weights represent action contribution
Characteristic mapping weights represent skill contribution
Generalization weights represent abstraction proportion
```

### 3. Flexible Topology
- Multiple actions can map to one skill
- Multiple skills can map to one characteristic
- One action can map to multiple skills (if needed)
- Handles empty layers gracefully (no forced defaults)

### 4. Precise Time Tracking
Integer minutes enable exact calculations:
- 30 minutes = 1.0 EXP
- 60 minutes = 2.0 EXP
- 90 minutes = 3.0 EXP
- No string parsing ambiguity

## Migration Impact

### Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `features/journal/types/index.ts` | **BREAKING** | TextToActionResponse structure changed |
| `google-ai/config/stuffed-prompt.ts` | **MAJOR** | Complete prompt rewrite for structured mappings |
| `google-ai/utils/single-prompt/text-to-topology.ts` | **BREAKING** | Response schema updated |
| `soulTopology/utils/entry-pipeline/transform-analysis-to-topology.ts` | **MAJOR** | Complete rewrite using layer mappings |
| `soulTopology/utils/entry-pipeline/analyze-entry.ts` | **MODERATE** | Validation logic updated |
| `stores/player-statistics/utils/scaled-logic.ts` | **MINOR** | Duration parsing enhanced |

### Backward Compatibility

❌ **None** - This is a complete breaking change following rapid prototyping ideology.

All components using TextToActionResponse must be updated:
- Journal entry processing
- Statistics calculation
- Topology visualization
- Debug views

## Testing Recommendations

### Unit Tests Needed
```typescript
// Test structured mapping integrity
test('skillMappings covers all actions', () => {
  const actions = analysis.weightedActions.map(a => a.label);
  const mappedActions = analysis.skillMappings.map(m => m.child);
  expect(actions.every(a => mappedActions.includes(a))).toBe(true);
});

// Test weight distribution
test('mapping weights are valid', () => {
  analysis.skillMappings.forEach(m => {
    expect(m.weight).toBeGreaterThanOrEqual(0.1);
    expect(m.weight).toBeLessThanOrEqual(1.0);
  });
});

// Test topology construction
test('transformAnalysisToTopology builds complete hierarchy', () => {
  const fragment = transformAnalysisToTopology(analysis, []);
  // Verify all layers connected
  expect(Object.keys(fragment.nodes).length).toBeGreaterThan(0);
  expect(Object.keys(fragment.edges).length).toBeGreaterThan(0);
});
```

### Integration Tests Needed
- End-to-end entry processing with structured mappings
- Duration calculation with integer minutes
- Topology merging with new edge structure

## Example AI Response

```json
{
  "durationMinutes": 120,
  "weightedActions": [
    { "label": "Debugging", "weight": 0.7 },
    { "label": "Technical writing", "weight": 0.3 }
  ],
  "skillMappings": [
    { "child": "Debugging", "parent": "Software engineering", "weight": 0.7 },
    { "child": "Technical writing", "parent": "Software engineering", "weight": 0.3 }
  ],
  "characteristicMappings": [
    { "child": "Software engineering", "parent": "Intellect", "weight": 0.9 }
  ],
  "generalizationChain": [
    { "child": "Intellect", "parent": "Cognitive mastery", "weight": 0.8 },
    { "child": "Cognitive mastery", "parent": "progression", "weight": 0.6 }
  ]
}
```

This creates a complete graph:
```
progression (root)
    ↓ 0.6
Cognitive mastery
    ↓ 0.8
Intellect
    ↓ 0.9
Software engineering
    ├─ 0.7 → Debugging
    └─ 0.3 → Technical writing
```

## Next Steps

1. **Update Use-Entry-Orchestrator**: Handle new duration format
2. **Update Journal Store**: Store durationMinutes instead of duration string
3. **Update Statistics Display**: Show integer minutes in UI
4. **Add Validation Tests**: Ensure mapping integrity
5. **Update Documentation**: Reflect new structure everywhere

---

**Session Completed By**: GitHub Copilot  
**Migration Type**: Complete Breaking Change (Rapid Prototyping)  
**Backward Compatibility**: None (complete migration)
