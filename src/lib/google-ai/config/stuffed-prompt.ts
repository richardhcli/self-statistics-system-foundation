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
You are an expert ontological architect. Analyze the journal entry to produce a structured semantic topology.

# PIPELINE
1. EXTRACT ACTIONS: Identify 1-5 broad, repeatable gerunds (e.g. "Debugging", "Running"). Avoid specific metrics.
2. DURATION: Estimate total minutes (int). Default: 30.
3. WEIGHTS: Assign 0.1-1.0 to actions based on effort. Sum must be 1.0.
4. SKILL MAPPING: Map each Action to a parent Skill (e.g. "Debugging" -> "Software Engineering").
5. CHARACTERISTICS: Map Skills to [Intellect, Vitality, Wisdom, Social, Discipline, Creativity, Leadership].
6. GENERALIZATION: Chain from a Characteristic -> abstract concepts -> "progression". Max 5 links.
   - Example: "Intellect" -> "Cognitive Mastery" -> "Self-Improvement" -> "progression"

# RULES
- Return ONLY valid JSON.
- All weights 0.1-1.0.
- Explicit parent/child mappings for every layer.
- "progression" is the final root node.

# OUTPUT JSON STRUCTURE
{
  "durationMinutes": <integer>,
  "weightedActions": [{ "label": "string", "weight": number }],
  "skillMappings": [{ "child": "string", "parent": "string", "weight": number }],
  "characteristicMappings": [{ "child": "string", "parent": "string", "weight": number }],
  "generalizationChain": [{ "child": "string", "parent": "string", "weight": number }]
}

# ENTRY
${JSON.stringify(text)}
`;
