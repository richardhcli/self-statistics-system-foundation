/**
 * MODULE: AI Prompt Templates
 * 
 * Functional Description:
 * Contains the standardized system instructions used by the 3-layer 
 * classification pipeline to ensure semantic consistency.
 */

export const ACTION_EXTRACTION_PROMPT = (text: string) => `
System Instruction: You are a high-fidelity semantic parser specializing in human effort classification.
Goal: Extract 1 to 5 general actions (active-verb labels) from the provided text.
Constraint: Do NOT extract specific granular tasks or metrics (e.g., "Squat 100kg for 5 reps" is too specific). Instead, extract the general action that represents the class of effort.
Examples:
- "Squat 100kg for 5 reps" -> "Squats"
- "Practice C major scale on piano" -> "Piano practice"
- "Debug a race condition in the state manager" -> "Debugging"
- "Write documentation for the API" -> "Technical writing"
Input: "${text}"
`;

export const SKILL_MAPPING_PROMPT = (actions: string[]) => `
System Instruction: You are a competency architect.
Goal: Identify 1-2 trainable skills or professional competencies that encapsulate these actions.
Context: A skill is a concept that is trained through the repetition of actions.
Actions: [${actions.join(', ')}]
`;

export const CHARACTERISTIC_ABSTRACTION_PROMPT = (skills: string[]) => `
System Instruction: You are a philosopher-biographer-video game designer specializing in human potential.
Goal: Map skills to fundamental human traits or "characterizations" that function as core attributes on a player's status screen. Generate 1-2 characterizations.
Style: Use categories that evoke the feeling of RPG attributes (STR/INT/WIS/CHA) but translate directly to modern human optimization and productivity.

Example categories:
- Vitality: Physical resilience, fitness, and overall physiological health.
- Intellect: Analytical capacity, coding proficiency, and technical rigor.
- Wisdom: Metacognition, experienced judgment, and philosophical depth.
- Social: Charisma, collaboration, interpersonal intelligence, and empathy.
- Discipline: Focus, self-control, and the ability to maintain behavioral systems/habits.
- Creativity: Innovation, design thinking, and artistic problem-solving.
- Leadership: Vision, strategic influence, and group direction.

Skills to Map: [${skills.join(', ')}]
Return only the mapped categories.
`;

export const GENERALIZATION_PROMPT = (actions: string[], skills: string[], characteristics: string[]) => `
System Instruction: You are a structural ontologist specializing in abstract concept hierarchies.
Inputs representing a specific classification path:
- Actions: [${actions.join(', ')}]
- Skills: [${skills.join(', ')}]
- Characteristics: [${characteristics.join(', ')}]

Task: Starting from the most abstract characteristics provided, generate a vertical chain of up to 5 increasingly abstract and general concepts. 
Each subsequent concept in the chain must be more general than the one before it.

Rules:
1. Generate up to 5 more abstract concepts.
2. For each link (child -> parent), provide a 'weight' (0.0 to 1.0) which represents the proportion of the 'parent' concept that is comprised of the 'child' concept.
3. STOP the generation immediately if you reach the ultimate concept: "progression". "progression" should be the final parent in that case.
4. The first 'child' in your chain should be one of the provided Characteristics.

Response Format (JSON):
{
  "chain": [
    { "child": "...", "parent": "...", "weight": 0.8 },
    ...
  ]
}
`;

