
import type { EdgeData, GraphState, NodeData } from '@/types';

/**
 * Complex Topology Dataset
 * 
 * A pre-defined multi-root hierarchy representing a sophisticated 
 * "Second Brain" architecture. This dataset is used to verify:
 * 1. DAG Layout stability in the Concept Graph.
 * 2. Recursive EXP propagation through shared parent nodes.
 * 3. Multi-path inheritance (where one child contributes to multiple branches).
 */
const buildGraphState = (nodes: NodeData[], edges: EdgeData[]): GraphState => ({
  nodes: nodes.reduce<Record<string, NodeData>>((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {}),
  edges: edges.reduce<Record<string, EdgeData>>((acc, edge) => {
    acc[edge.id] = edge;
    return acc;
  }, {}),
});

const buildEdgeId = (source: string, target: string) => `${source}->${target}`;

const COMPLEX_NODES: NodeData[] = [
  { id: 'Life', label: 'Life', type: 'characteristic' },
  { id: 'Systems', label: 'Systems', type: 'characteristic' },
  { id: 'Health', label: 'Health', type: 'skill' },
  { id: 'Wealth', label: 'Wealth', type: 'skill' },
  { id: 'Spirit', label: 'Spirit', type: 'skill' },
  { id: 'Knowledge', label: 'Knowledge', type: 'skill' },
  { id: 'Infrastructure', label: 'Infrastructure', type: 'skill' },
  { id: 'Fitness', label: 'Fitness', type: 'action' },
  { id: 'Nutrition', label: 'Nutrition', type: 'action' },
  { id: 'Investing', label: 'Investing', type: 'action' },
  { id: 'Coding', label: 'Coding', type: 'action' },
  { id: 'React', label: 'React', type: 'action' },
  { id: 'TypeScript', label: 'TypeScript', type: 'action' },
  { id: 'Database', label: 'Database', type: 'action' },
  { id: 'Meditation', label: 'Meditation', type: 'action' },
];

const COMPLEX_EDGES: EdgeData[] = [
  { id: buildEdgeId('Life', 'Health'), source: 'Life', target: 'Health', weight: 1 },
  { id: buildEdgeId('Life', 'Wealth'), source: 'Life', target: 'Wealth', weight: 1 },
  { id: buildEdgeId('Life', 'Spirit'), source: 'Life', target: 'Spirit', weight: 1 },
  { id: buildEdgeId('Systems', 'Knowledge'), source: 'Systems', target: 'Knowledge', weight: 1 },
  { id: buildEdgeId('Systems', 'Infrastructure'), source: 'Systems', target: 'Infrastructure', weight: 1 },
  { id: buildEdgeId('Health', 'Fitness'), source: 'Health', target: 'Fitness', weight: 1 },
  { id: buildEdgeId('Health', 'Nutrition'), source: 'Health', target: 'Nutrition', weight: 1 },
  { id: buildEdgeId('Wealth', 'Investing'), source: 'Wealth', target: 'Investing', weight: 0.8 },
  { id: buildEdgeId('Knowledge', 'Investing'), source: 'Knowledge', target: 'Investing', weight: 0.2 },
  { id: buildEdgeId('Knowledge', 'Coding'), source: 'Knowledge', target: 'Coding', weight: 0.7 },
  { id: buildEdgeId('Infrastructure', 'Coding'), source: 'Infrastructure', target: 'Coding', weight: 0.3 },
  { id: buildEdgeId('Coding', 'React'), source: 'Coding', target: 'React', weight: 1 },
  { id: buildEdgeId('Coding', 'TypeScript'), source: 'Coding', target: 'TypeScript', weight: 1 },
  { id: buildEdgeId('Infrastructure', 'Database'), source: 'Infrastructure', target: 'Database', weight: 1 },
  { id: buildEdgeId('Spirit', 'Meditation'), source: 'Spirit', target: 'Meditation', weight: 1 },
  { id: buildEdgeId('Health', 'Meditation'), source: 'Health', target: 'Meditation', weight: 0.5 },
];

export const COMPLEX_TOPOLOGY_DATA: GraphState = buildGraphState(
  COMPLEX_NODES,
  COMPLEX_EDGES
);

/**
 * Brain Topology Dataset
 * 
 * Converted from raw node-edge JSON to GraphState.
 * Represents a complex personal development and cognitive skill tree.
 * Re-characterized based on specific functional definitions.
 */
const BRAIN_NODES: NodeData[] = [
  { id: 'everlasting happiness', label: 'everlasting happiness', type: 'characteristic' },
  { id: 'Pleasure', label: 'Pleasure', type: 'characteristic' },
  { id: 'Hardware engineering', label: 'Hardware engineering', type: 'characteristic' },
  { id: 'wisdom', label: 'wisdom', type: 'characteristic' },
  { id: 'fitness', label: 'fitness', type: 'characteristic' },
  { id: 'intelligence', label: 'intelligence', type: 'characteristic' },
  { id: 'productivity', label: 'productivity', type: 'characteristic' },
  { id: 'self control', label: 'self control', type: 'characteristic' },
  { id: 'incremental system', label: 'incremental system', type: 'skill' },
  { id: 'habits', label: 'habits', type: 'skill' },
  { id: 'work block', label: 'work block', type: 'none' },
  { id: 'morning routine', label: 'morning routine', type: 'action' },
  { id: 'meditation', label: 'meditation', type: 'action' },
  { id: 'sleep', label: 'sleep', type: 'action' },
  { id: 'chores', label: 'chores', type: 'action' },
  { id: 'eating', label: 'eating', type: 'action' },
  { id: 'networking', label: 'networking', type: 'action' },
  { id: 'analytical intelligence', label: 'analytical intelligence', type: 'characteristic' },
  { id: 'creative intelligence', label: 'creative intelligence', type: 'characteristic' },
  { id: 'knowledge', label: 'knowledge', type: 'skill' },
  { id: 'planning', label: 'planning', type: 'action' },
  { id: 'sanity', label: 'sanity', type: 'characteristic' },
  { id: 'Cleanliness', label: 'Cleanliness', type: 'action' },
  { id: 'exercise', label: 'exercise', type: 'action' },
  { id: 'knowledge of self', label: 'knowledge of self', type: 'action' },
  { id: 'Computer Science Skill', label: 'Computer Science Skill', type: 'skill' },
  { id: 'social intelligence', label: 'social intelligence', type: 'characteristic' },
  { id: 'academics', label: 'academics', type: 'characteristic' },
  { id: 'sociability', label: 'sociability', type: 'characteristic' },
  { id: 'weakness in happiness', label: 'weakness in happiness', type: 'action' },
  { id: 'endurance', label: 'endurance', type: 'characteristic' },
  { id: 'physical fitness', label: 'physical fitness', type: 'characteristic' },
  { id: 'Leadership', label: 'Leadership', type: 'characteristic' },
  { id: 'computer engineering', label: 'computer engineering', type: 'action' },
  { id: 'Reflect', label: 'Reflect', type: 'action' },
  { id: 'Job application', label: 'Job application', type: 'action' },
  { id: 'AI Artificial Intelligence', label: 'AI Artificial Intelligence', type: 'skill' },
  { id: 'study', label: 'study', type: 'action' },
  { id: 'leetcode', label: 'leetcode', type: 'action' },
];

const BRAIN_EDGES: EdgeData[] = [
  { id: buildEdgeId('everlasting happiness', 'wisdom'), source: 'everlasting happiness', target: 'wisdom', weight: 0.5 },
  { id: buildEdgeId('everlasting happiness', 'fitness'), source: 'everlasting happiness', target: 'fitness', weight: 0.3 },
  { id: buildEdgeId('wisdom', 'intelligence'), source: 'wisdom', target: 'intelligence', weight: 0.5 },
  { id: buildEdgeId('fitness', 'intelligence'), source: 'fitness', target: 'intelligence', weight: 0.2 },
  { id: buildEdgeId('AI Artificial Intelligence', 'productivity'), source: 'AI Artificial Intelligence', target: 'productivity', weight: 0.2 },
  { id: buildEdgeId('fitness', 'productivity'), source: 'fitness', target: 'productivity', weight: 0.3 },
  { id: buildEdgeId('productivity', 'self control'), source: 'productivity', target: 'self control', weight: 0.9 },
  { id: buildEdgeId('self control', 'incremental system'), source: 'self control', target: 'incremental system', weight: 0.9 },
  { id: buildEdgeId('self control', 'habits'), source: 'self control', target: 'habits', weight: 0.4 },
  { id: buildEdgeId('incremental system', 'habits'), source: 'incremental system', target: 'habits', weight: 0.2 },
  { id: buildEdgeId('productivity', 'habits'), source: 'productivity', target: 'habits', weight: 0.75 },
  { id: buildEdgeId('habits', 'work block'), source: 'habits', target: 'work block', weight: 0.5 },
  { id: buildEdgeId('habits', 'morning routine'), source: 'habits', target: 'morning routine', weight: 0.05 },
  { id: buildEdgeId('habits', 'meditation'), source: 'habits', target: 'meditation', weight: 0.3 },
  { id: buildEdgeId('sanity', 'meditation'), source: 'sanity', target: 'meditation', weight: 1.0 },
  { id: buildEdgeId('habits', 'sleep'), source: 'habits', target: 'sleep', weight: 0.01 },
  { id: buildEdgeId('habits', 'chores'), source: 'habits', target: 'chores', weight: 0.1 },
  { id: buildEdgeId('work block', 'chores'), source: 'work block', target: 'chores', weight: 0.5 },
  { id: buildEdgeId('habits', 'eating'), source: 'habits', target: 'eating', weight: 0.05 },
  { id: buildEdgeId('work block', 'networking'), source: 'work block', target: 'networking', weight: 1.0 },
  { id: buildEdgeId('sociability', 'networking'), source: 'sociability', target: 'networking', weight: 0.5 },
  { id: buildEdgeId('intelligence', 'analytical intelligence'), source: 'intelligence', target: 'analytical intelligence', weight: 0.3 },
  { id: buildEdgeId('intelligence', 'creative intelligence'), source: 'intelligence', target: 'creative intelligence', weight: 0.3 },
  { id: buildEdgeId('intelligence', 'knowledge'), source: 'intelligence', target: 'knowledge', weight: 0.5 },
  { id: buildEdgeId('wisdom', 'knowledge'), source: 'wisdom', target: 'knowledge', weight: 0.3 },
  { id: buildEdgeId('analytical intelligence', 'planning'), source: 'analytical intelligence', target: 'planning', weight: 1.0 },
  { id: buildEdgeId('creative intelligence', 'planning'), source: 'creative intelligence', target: 'planning', weight: 1.0 },
  { id: buildEdgeId('endurance', 'sanity'), source: 'endurance', target: 'sanity', weight: 0.2 },
  { id: buildEdgeId('fitness', 'sanity'), source: 'fitness', target: 'sanity', weight: 0.3 },
  { id: buildEdgeId('fitness', 'Cleanliness'), source: 'fitness', target: 'Cleanliness', weight: 1.0 },
  { id: buildEdgeId('physical fitness', 'exercise'), source: 'physical fitness', target: 'exercise', weight: 0.86 },
  { id: buildEdgeId('habits', 'exercise'), source: 'habits', target: 'exercise', weight: 0.1 },
  { id: buildEdgeId('knowledge', 'knowledge of self'), source: 'knowledge', target: 'knowledge of self', weight: 0.5 },
  { id: buildEdgeId('knowledge', 'Computer Science Skill'), source: 'knowledge', target: 'Computer Science Skill', weight: 0.1 },
  { id: buildEdgeId('analytical intelligence', 'Computer Science Skill'), source: 'analytical intelligence', target: 'Computer Science Skill', weight: 0.3 },
  { id: buildEdgeId('creative intelligence', 'Computer Science Skill'), source: 'creative intelligence', target: 'Computer Science Skill', weight: 0.2 },
  { id: buildEdgeId('intelligence', 'social intelligence'), source: 'intelligence', target: 'social intelligence', weight: 0.5 },
  { id: buildEdgeId('creative intelligence', 'social intelligence'), source: 'creative intelligence', target: 'social intelligence', weight: 0.5 },
  { id: buildEdgeId('analytical intelligence', 'social intelligence'), source: 'analytical intelligence', target: 'social intelligence', weight: 0.3 },
  { id: buildEdgeId('knowledge', 'academics'), source: 'knowledge', target: 'academics', weight: 0.7 },
  { id: buildEdgeId('analytical intelligence', 'academics'), source: 'analytical intelligence', target: 'academics', weight: 0.4 },
  { id: buildEdgeId('social intelligence', 'sociability'), source: 'social intelligence', target: 'sociability', weight: 0.95 },
  { id: buildEdgeId('Pleasure', 'weakness in happiness'), source: 'Pleasure', target: 'weakness in happiness', weight: 0.99 },
  { id: buildEdgeId('fitness', 'endurance'), source: 'fitness', target: 'endurance', weight: 0.2 },
  { id: buildEdgeId('endurance', 'physical fitness'), source: 'endurance', target: 'physical fitness', weight: 0.8 },
  { id: buildEdgeId('sociability', 'Leadership'), source: 'sociability', target: 'Leadership', weight: 0.57 },
  { id: buildEdgeId('analytical intelligence', 'Leadership'), source: 'analytical intelligence', target: 'Leadership', weight: 0.4 },
  { id: buildEdgeId('creative intelligence', 'Leadership'), source: 'creative intelligence', target: 'Leadership', weight: 0.5 },
  { id: buildEdgeId('analytical intelligence', 'computer engineering'), source: 'analytical intelligence', target: 'computer engineering', weight: 0.3 },
  { id: buildEdgeId('knowledge', 'computer engineering'), source: 'knowledge', target: 'computer engineering', weight: 0.1 },
  { id: buildEdgeId('Hardware engineering', 'computer engineering'), source: 'Hardware engineering', target: 'computer engineering', weight: 0.9 },
  { id: buildEdgeId('Computer Science Skill', 'computer engineering'), source: 'Computer Science Skill', target: 'computer engineering', weight: 0.6 },
  { id: buildEdgeId('habits', 'Reflect'), source: 'habits', target: 'Reflect', weight: 1.0 },
  { id: buildEdgeId('analytical intelligence', 'Reflect'), source: 'analytical intelligence', target: 'Reflect', weight: 1.0 },
  { id: buildEdgeId('self control', 'Reflect'), source: 'self control', target: 'Reflect', weight: 1.0 },
  { id: buildEdgeId('work block', 'Job application'), source: 'work block', target: 'Job application', weight: 1.0 },
  { id: buildEdgeId('intelligence', 'AI Artificial Intelligence'), source: 'intelligence', target: 'AI Artificial Intelligence', weight: 0.5 },
  { id: buildEdgeId('everlasting happiness', 'AI Artificial Intelligence'), source: 'everlasting happiness', target: 'AI Artificial Intelligence', weight: 0.5 },
  { id: buildEdgeId('academics', 'study'), source: 'academics', target: 'study', weight: 0.5 },
  { id: buildEdgeId('work block', 'study'), source: 'work block', target: 'study', weight: 1.0 },
  { id: buildEdgeId('Computer Science Skill', 'leetcode'), source: 'Computer Science Skill', target: 'leetcode', weight: 0.1 },
  { id: buildEdgeId('work block', 'leetcode'), source: 'work block', target: 'leetcode', weight: 1.0 },
];

export const BRAIN_TOPOLOGY_DATA: GraphState = buildGraphState(
  BRAIN_NODES,
  BRAIN_EDGES
);
