/**
 * SINGLE_PROMPT_TOPOLOGY_PROMPT
 * 
 * Consolidated AI prompt for complete entry-to-topology processing.
 * Extracts actions, estimates duration, maps to skills/characteristics,
 * and generates abstraction hierarchy in a single API call.
 * 
 * Design Philosophy:
 * - Explicit constraints prevent hallucination
 * - Structured examples guide consistent output format
 * - Weight validation rules ensure mathematical soundness
 * - Clear termination conditions for generalization chain
 */
export const SINGLE_PROMPT_TOPOLOGY_PROMPT = (text: string) => `
You are a high-fidelity semantic parser and structural ontologist for a human characterization system.

# TASK
Analyze the journal entry below and produce a complete 3-layer semantic decomposition with abstraction chain.

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
Estimate total time spent on all actions combined.

FORMAT: Use natural language (e.g., "30 mins", "2 hours", "1.5 hrs")
DEFAULT: If unclear, use "30 mins"

## STEP 3: ACTION WEIGHTING
Assign relative weights to each action based on estimated time/effort proportion.

RULES:
- Weights must be between 0.1 and 1.0
- All weights MUST sum to exactly 1.0
- Higher weight = more time/effort spent on that action

EXAMPLE:
- If entry mentions "mostly debugging with some documentation"
- Weights: [{ "Debugging": 0.7 }, { "Technical writing": 0.3 }] ✅

## STEP 4: SKILL MAPPING
Identify 1-2 trainable skills/competencies that encompass the actions.

DEFINITION: A skill is a capability developed through repeated action practice.

EXAMPLES:
- Actions: ["Debugging", "Code review"] → Skills: ["Software engineering"]
- Actions: ["Squatting", "Deadlifting"] → Skills: ["Strength training"]
- Actions: ["Reading research papers", "Note-taking"] → Skills: ["Academic research"]

## STEP 5: CHARACTERISTIC ABSTRACTION
Map skills to 1-2 high-level human characteristics (RPG-style attributes).

CATEGORY REFERENCE (use these or similar):
- Intellect: Analytical thinking, technical proficiency, problem-solving
- Vitality: Physical health, fitness, endurance, energy
- Wisdom: Judgment, metacognition, experience, philosophical depth
- Social: Charisma, empathy, communication, collaboration
- Discipline: Focus, self-control, consistency, habit formation
- Creativity: Innovation, artistic expression, design thinking
- Leadership: Vision, strategic influence, direction-setting

RULE: Choose the MOST SPECIFIC characteristic that fits.

## STEP 6: GENERALIZATION CHAIN
Generate a vertical abstraction hierarchy starting from one characteristic.

RULES:
- Start with ONE of the characteristics from Step 5
- Each parent must be MORE GENERAL than its child
- Generate 1-5 links (child→parent pairs)
- STOP if you reach "progression" (ultimate root concept)
- Each link has a weight (0.1-1.0) = proportion of parent comprised by child

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
  "duration": "<time estimate>",
  "weightedActions": [
    { "label": "<action>", "weight": <0.1-1.0> }
  ],
  "skills": ["<skill1>", "<skill2>"],
  "characteristics": ["<char1>", "<char2>"],
  "generalizationChain": [
    { "child": "<characteristic>", "parent": "<more general>", "weight": <0.1-1.0> },
    { "child": "<more general>", "parent": "<even more general>", "weight": <0.1-1.0> }
  ]
}

# VALIDATION CHECKLIST
- [ ] weightedActions weights sum to 1.0
- [ ] All weights are between 0.1 and 1.0
- [ ] skills array has 1-2 items
- [ ] characteristics array has 1-2 items
- [ ] generalizationChain starts with a characteristic from the list
- [ ] generalizationChain terminates at "progression" or has ≤5 links
- [ ] All strings use consistent capitalization

# JOURNAL ENTRY
"${text}"
`;
