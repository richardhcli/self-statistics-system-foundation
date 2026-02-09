import { GraphState, NodeData } from '@/types';

/**
 * transformActionsToTopology
 * 
 * Pure transformation function: Converts a list of action labels into a minimal topology fragment.
 * 
 * Used when manually processing an entry without AI analysis.
 * Creates action nodes only (no hierarchy, no skills/characteristics).
 * Filters out actions that already exist in the current topology.
 * 
 * No side effects. No external dependencies beyond types.
 * 
 * @param actions - List of action labels (raw strings)
 * @param currentTopology - Current GraphState to check for existing nodes
 * @returns A GraphState fragment containing only new action nodes
 * 
 * @example
 * const actions = ["studying", "exercising"];
 * const fragment = transformActionsToTopology(actions, currentTopology);
 * // Returns GraphState with two action nodes
 * // Empty edges (no hierarchy)
 */
export const transformActionsToTopology = (
	actions: string[],
	currentTopology: GraphState
): GraphState => {
	const nodes: Record<string, NodeData> = {};
	const timestamp = new Date().toISOString();

	// Create action nodes for any new actions
	actions.forEach(action => {
		// Only add if node doesn't already exist
		if (!currentTopology.nodes[action]) {
			nodes[action] = {
				id: action,
				label: action,
				type: 'action',
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		}
	});

	return {
		nodes,
		edges: {}, // No edges for standalone actions
	};
};
