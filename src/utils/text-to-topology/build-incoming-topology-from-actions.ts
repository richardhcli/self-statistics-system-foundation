import { GraphState, NodeData } from '@/types';

/**
 * buildIncomingTopologyFromActions
 * Builds a minimal topology fragment from a list of manual actions.
 *
 * @param actions - List of action labels
 * @param currentTopology - Current GraphState to check for existing nodes
 * @returns A GraphState fragment containing new action nodes
 */
export const buildIncomingTopologyFromActions = (
	actions: string[],
	currentTopology: GraphState
): GraphState => {
	const nodes: Record<string, NodeData> = {};
	const timestamp = new Date().toISOString();

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
		version: 2,
		lastSyncTimestamp: timestamp,
	};
};
