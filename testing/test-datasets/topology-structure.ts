
import { CdagTopology } from '@/types';

/**
 * Complex Topology Dataset
 * 
 * A pre-defined multi-root hierarchy representing a sophisticated 
 * "Second Brain" architecture. This dataset is used to verify:
 * 1. DAG Layout stability in the Concept Graph.
 * 2. Recursive EXP propagation through shared parent nodes.
 * 3. Multi-path inheritance (where one child contributes to multiple branches).
 */
export const COMPLEX_TOPOLOGY_DATA: CdagTopology = {
  "Life": { parents: {}, type: 'characteristic' },
  "Systems": { parents: {}, type: 'characteristic' },
  "Health": { parents: { "Life": 1 }, type: 'skill' },
  "Wealth": { parents: { "Life": 1 }, type: 'skill' },
  "Spirit": { parents: { "Life": 1 }, type: 'skill' },
  "Knowledge": { parents: { "Systems": 1 }, type: 'skill' },
  "Infrastructure": { parents: { "Systems": 1 }, type: 'skill' },
  "Fitness": { parents: { "Health": 1 }, type: 'action' },
  "Nutrition": { parents: { "Health": 1 }, type: 'action' },
  "Investing": { parents: { "Wealth": 0.8, "Knowledge": 0.2 }, type: 'action' },
  "Coding": { parents: { "Knowledge": 0.7, "Infrastructure": 0.3 }, type: 'action' },
  "React": { parents: { "Coding": 1 }, type: 'action' },
  "TypeScript": { parents: { "Coding": 1 }, type: 'action' },
  "Database": { parents: { "Infrastructure": 1 }, type: 'action' },
  "Meditation": { parents: { "Spirit": 1, "Health": 0.5 }, type: 'action' }
};

/**
 * Brain Topology Dataset
 * 
 * Converted from raw node-edge JSON to CdagTopology.
 * Represents a complex personal development and cognitive skill tree.
 * Re-characterized based on specific functional definitions.
 */
export const BRAIN_TOPOLOGY_DATA: CdagTopology = {
  "everlasting happiness": { parents: {}, type: 'characteristic' },
  "Pleasure": { parents: {}, type: 'characteristic' },
  "Hardware engineering": { parents: {}, type: 'characteristic' },
  "wisdom": { parents: { "everlasting happiness": 0.5 }, type: 'characteristic' },
  "fitness": { parents: { "everlasting happiness": 0.3 }, type: 'characteristic' },
  "intelligence": { parents: { "wisdom": 0.5, "fitness": 0.2 }, type: 'characteristic' },
  "productivity": { parents: { "AI Artificial Intelligence": 0.2, "fitness": 0.3 }, type: 'characteristic' },
  "self control": { parents: { "productivity": 0.9 }, type: 'characteristic' },
  "incremental system": { parents: { "self control": 0.9 }, type: 'skill' },
  "habits": { parents: { "self control": 0.4, "incremental system": 0.2, "productivity": 0.75 }, type: 'skill' },
  "work block": { parents: { "habits": 0.5 }, type: 'none' },
  "morning routine": { parents: { "habits": 0.05 }, type: 'action' },
  "meditation": { parents: { "habits": 0.3, "sanity": 1.0 }, type: 'action' },
  "sleep": { parents: { "habits": 0.01 }, type: 'action' },
  "chores": { parents: { "habits": 0.1, "work block": 0.5 }, type: 'action' },
  "eating": { parents: { "habits": 0.05 }, type: 'action' },
  "networking": { parents: { "work block": 1.0, "sociability": 0.5 }, type: 'action' },
  "analytical intelligence": { parents: { "intelligence": 0.3 }, type: 'characteristic' },
  "creative intelligence": { parents: { "intelligence": 0.3 }, type: 'characteristic' },
  "knowledge": { parents: { "intelligence": 0.5, "wisdom": 0.3 }, type: 'skill' },
  "planning": { parents: { "analytical intelligence": 1.0, "creative intelligence": 1.0 }, type: 'action' },
  "sanity": { parents: { "endurance": 0.2, "fitness": 0.3 }, type: 'characteristic' },
  "Cleanliness": { parents: { "fitness": 1.0 }, type: 'action' },
  "exercise": { parents: { "physical fitness": 0.86, "habits": 0.1 }, type: 'action' },
  "knowledge of self": { parents: { "knowledge": 0.5 }, type: 'action' },
  "Computer Science Skill": { parents: { "knowledge": 0.1, "analytical intelligence": 0.3, "creative intelligence": 0.2 }, type: 'skill' },
  "social intelligence": { parents: { "intelligence": 0.5, "creative intelligence": 0.5, "analytical intelligence": 0.3 }, type: 'characteristic' },
  "academics": { parents: { "knowledge": 0.7, "analytical intelligence": 0.4 }, type: 'characteristic' },
  "sociability": { parents: { "social intelligence": 0.95 }, type: 'characteristic' },
  "weakness in happiness": { parents: { "Pleasure": 0.99 }, type: 'action' },
  "endurance": { parents: { "fitness": 0.2 }, type: 'characteristic' },
  "physical fitness": { parents: { "endurance": 0.8 }, type: 'characteristic' },
  "Leadership": { parents: { "sociability": 0.57, "analytical intelligence": 0.4, "creative intelligence": 0.5 }, type: 'characteristic' },
  "computer engineering": { parents: { "analytical intelligence": 0.3, "knowledge": 0.1, "Hardware engineering": 0.9, "Computer Science Skill": 0.6 }, type: 'action' },
  "Reflect": { parents: { "habits": 1.0, "analytical intelligence": 1.0, "self control": 1.0 }, type: 'action' },
  "Job application": { parents: { "work block": 1.0 }, type: 'action' },
  "AI Artificial Intelligence": { parents: { "intelligence": 0.5, "everlasting happiness": 0.5 }, type: 'skill' },
  "study": { parents: { "academics": 0.5, "work block": 1.0 }, type: 'action' },
  "leetcode": { parents: { "Computer Science Skill": 0.1, "work block": 1.0 }, type: 'action' }
};
