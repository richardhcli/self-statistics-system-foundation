/**
 * Soul Topology Domain Types
 * 
 * Core type definitions for the semantic topology system.
 * These types define the structure of AI-processed journal entries
 * and their transformation into hierarchical concept graphs.
 * 
 * @module lib/soulTopology/types
 * @see {@link /documentation/data-model.md} for topology architecture
 * @see {@link /documentation/cdag-topology.md} for CDAG structure details
 */

/**
 * Represents a weighted action extracted from journal entry text.
 * Actions are the most granular level in the 3-layer semantic hierarchy.
 * 
 * @example
 * { label: "Debugging", weight: 0.7 }
 * { label: "Code review", weight: 0.3 }
 * 
 * @property {string} label - Action name (gerund form: "Debugging", "Exercising")
 * @property {number} weight - Relative proportion (0.1-1.0), all actions must sum to 1.0
 */
export interface WeightedAction {
  label: string;
  weight: number;
}

/**
 * Represents an explicit parent-child relationship in the concept hierarchy.
 * Used for skill mappings, characteristic mappings, and abstraction chains.
 * 
 * @example
 * // Action-to-Skill mapping
 * { child: "Debugging", parent: "Software engineering", weight: 0.8 }
 * 
 * // Skill-to-Characteristic mapping
 * { child: "Software engineering", parent: "Intellect", weight: 0.9 }
 * 
 * @property {string} child - Concept being generalized from (more specific)
 * @property {string} parent - Concept being generalized to (more abstract)
 * @property {number} weight - Proportion of parent comprised by child (0.1-1.0)
 */
export interface GeneralizationLink {
  child: string;
  parent: string;
  weight: number;
}

/**
 * AI response structure for the refined semantic decomposition pipeline.
 * Represents complete 3-layer hierarchy with structured parent-child mappings.
 * 
 * ARCHITECTURE:
 * Layer 1 (Actions): Specific tasks performed → weightedActions
 * Layer 2 (Skills): Trainable competencies → skillMappings
 * Layer 3 (Characteristics): High-level human traits → characteristicMappings
 * Optional: Abstraction hierarchy → generalizationChain
 * 
 * VALIDATION RULES:
 * - durationMinutes must be positive integer
 * - weightedActions weights must sum to 1.0
 * - Every action must appear in skillMappings
 * - Every skill must appear in characteristicMappings
 * - generalizationChain terminates at "progression" or has ≤5 links
 * 
 * @example
 * {
 *   durationMinutes: 120,
 *   weightedActions: [
 *     { label: "Debugging", weight: 0.7 },
 *     { label: "Code review", weight: 0.3 }
 *   ],
 *   skillMappings: [
 *     { child: "Debugging", parent: "Software engineering", weight: 0.6 },
 *     { child: "Code review", parent: "Software engineering", weight: 0.4 }
 *   ],
 *   characteristicMappings: [
 *     { child: "Software engineering", parent: "Intellect", weight: 0.8 }
 *   ],
 *   generalizationChain: [
 *     { child: "Intellect", parent: "Cognitive mastery", weight: 0.9 },
 *     { child: "Cognitive mastery", parent: "Self-improvement", weight: 0.8 },
 *     { child: "Self-improvement", parent: "progression", weight: 1.0 }
 *   ]
 * }
 * 
 * @property {number} durationMinutes - Estimated duration in integer minutes (e.g., 30, 120)
 * @property {WeightedAction[]} weightedActions - Layer 1: Specific tasks performed
 * @property {GeneralizationLink[]} skillMappings - Layer 2: Action-to-Skill explicit mappings
 * @property {GeneralizationLink[]} characteristicMappings - Layer 3: Skill-to-Characteristic mappings
 * @property {GeneralizationLink[]} [generalizationChain] - Optional abstraction hierarchy from characteristics to "progression"
 */
export interface TextToActionResponse {
  durationMinutes: number;
  weightedActions: WeightedAction[];
  skillMappings: GeneralizationLink[];
  characteristicMappings: GeneralizationLink[];
  generalizationChain?: GeneralizationLink[];
}
