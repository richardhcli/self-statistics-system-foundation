/**
 * SINGLE_PROMPT_TOPOLOGY_PROMPT
 * 
 * Consolidated AI prompt for complete entry-to-topology processing.
 * Extracts actions, estimates duration, maps to skills/characteristics with explicit parent-child relationships,
 * and generates abstraction hierarchy in a single API call.
 * 
 * Design Philosophy:
 * - Explicit parent-child mappings for every layer connection
 * - Integer duration for precise time tracking
 * - Structured examples guide consistent output format
 * - Weight validation rules ensure mathematical soundness
 */
export const SINGLE_PROMPT_TOPOLOGY_PROMPT = (text: string) => `
You are a high-fidelity semantic parser and structural ontologist for a human characterization system.

# TASK
Analyze the journal entry below and produce a complete multi-layer semantic decomposition with explicit parent-child mappings.

# PIPELINE (Execute in order)

## STEP 1: ACTION EXTRACTION
Extract 1-5 general action labels (active verbs representing categories of effort).

RULES:
- Use broad action categories, NOT specific tasks
- Prefer gerunds ("Studying", "Exercising") over past tense
- Avoid metrics or quantities ("100kg squat" → "Squatting")
- Each action should represent a repeatable activity type

EXAMPLES:
✅ Good: "Debugging", "Reading", "Writing code", "Exercising"
❌ Bad: "Fixed 3 bugs", "Read page 42", "Wrote 500 lines", "Ran 5km"

## STEP 2: DURATION ESTIMATION
Estimate total time spent in INTEGER MINUTES.

FORMAT: Return a number (e.g., 30, 60, 120, 180)
DEFAULT: If unclear, use 30 (representing 30 minutes)

EXAMPLES:
- "30 mins" → 30
- "2 hours" → 120
- "1.5 hrs" → 90
- "quick session" → 30

## STEP 3: ACTION WEIGHTING
Assign relative weights to each action based on estimated time/effort proportion.

RULES:
- Weights must be between 0.1 and 1.0
- All weights MUST sum to exactly 1.0
- Higher weight = more time/effort spent on that action

EXAMPLE:
- If entry mentions "mostly debugging with some documentation"
- Weights: [{ "label": "Debugging", "weight": 0.7 }, { "label": "Technical writing", "weight": 0.3 }] ✅

## STEP 4: SKILL MAPPING (STRUCTURED)
Identify 1-3 trainable skills/competencies and map them EXPLICITLY to the actions.

DEFINITION: A skill is a capability developed through repeated action practice.

FORMAT: Return an array of { child: "<action>", parent: "<skill>", weight: <0.1-1.0> }
- child = action label from Step 1
- parent = skill that encompasses this action
- weight = proportion of skill comprised by this action

EXAMPLES:
- Actions: ["Debugging", "Code review"]
- Skill Mappings: [
    { "child": "Debugging", "parent": "Software engineering", "weight": 0.6 },
    { "child": "Code review", "parent": "Software engineering", "weight": 0.4 }
  ]

- Actions: ["Squatting", "Deadlifting"]
- Skill Mappings: [
    { "child": "Squatting", "parent": "Strength training", "weight": 0.5 },
    { "child": "Deadlifting", "parent": "Strength training", "weight": 0.5 }
  ]

RULE: Every action MUST appear as a child in at least one skill mapping.

## STEP 5: CHARACTERISTIC ABSTRACTION (STRUCTURED)
Map skills to 1-2 high-level human characteristics and create EXPLICIT mappings.

CATEGORY REFERENCE (use these or similar):
- Intellect: Analytical thinking, technical proficiency, problem-solving
- Vitality: Physical health, fitness, endurance, energy
- Wisdom: Judgment, metacognition, experience, philosophical depth
- Social: Charisma, empathy, communication, collaboration
- Discipline: Focus, self-control, consistency, habit formation
- Creativity: Innovation, artistic expression, design thinking
- Leadership: Vision, strategic influence, direction-setting

FORMAT: Return an array of { child: "<skill>", parent: "<characteristic>", weight: <0.1-1.0> }
- child = skill label from Step 4
- parent = characteristic that encompasses this skill
- weight = proportion of characteristic comprised by this skill

EXAMPLES:
- Skills: ["Software engineering"]
- Characteristic Mappings: [
    { "child": "Software engineering", "parent": "Intellect", "weight": 0.8 }
  ]

- Skills: ["Strength training", "Cardio training"]
- Characteristic Mappings: [
    { "child": "Strength training", "parent": "Vitality", "weight": 0.5 },
    { "child": "Cardio training", "parent": "Vitality", "weight": 0.5 }
  ]

RULE: Every skill MUST appear as a child in at least one characteristic mapping.

## STEP 6: GENERALIZATION CHAIN (OPTIONAL)
Generate a vertical abstraction hierarchy starting from one characteristic.

RULES:
- Start with ONE of the characteristics from Step 5
- Each parent must be MORE GENERAL than its child
- Generate 0-5 links (child→parent pairs)
- STOP if you reach "progression" (ultimate root concept)
- Each link has a weight (0.1-1.0) = proportion of parent comprised by child
- If no meaningful generalization exists, return empty array

EXAMPLE CHAINS:
- "Intellect" → "Cognitive mastery" → "Self-improvement" → "progression"
- "Vitality" → "Physical excellence" → "Well-being" → "progression"
- "Social" → "Interpersonal mastery" → "Human connection" → "progression"

WEIGHT GUIDANCE:
- 0.8-1.0: Child is a major component of parent
- 0.5-0.7: Child is a significant subset of parent
- 0.1-0.4: Child is a minor aspect of parent

# OUTPUT FORMAT
Return ONLY valid JSON with this exact structure:

{
  "durationMinutes": <integer>,
  "weightedActions": [
    { "label": "<action>", "weight": <0.1-1.0> }
  ],
  "skillMappings": [
    { "child": "<action>", "parent": "<skill>", "weight": <0.1-1.0> }
  ],
  "characteristicMappings": [
    { "child": "<skill>", "parent": "<characteristic>", "weight": <0.1-1.0> }
  ],
  "generalizationChain": [
    { "child": "<characteristic>", "parent": "<more general>", "weight": <0.1-1.0> },
    { "child": "<more general>", "parent": "<even more general>", "weight": <0.1-1.0> }
  ]
}

# VALIDATION CHECKLIST
- [ ] durationMinutes is a positive integer
- [ ] weightedActions weights sum to 1.0
- [ ] All weights are between 0.1 and 1.0
- [ ] Every action appears as a child in skillMappings
- [ ] Every skill appears as a child in characteristicMappings
- [ ] generalizationChain is empty OR starts with a characteristic and terminates at "progression" or has ≤5 links
- [ ] All strings use consistent capitalization

# JOURNAL ENTRY
"${text}"
`;
