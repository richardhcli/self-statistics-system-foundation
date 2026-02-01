import { CdagTopology } from '@/types';
import { nodeExists } from '@/lib/soulTopology';

/**
 * buildIncomingTopologyFromActions
 * Builds a minimal topology fragment from a list of manual actions.
 *
 * @param actions - List of action labels
 * @param currentTopology - Current topology to check for existing nodes
 * @returns A topology fragment containing new action nodes
 */
export const buildIncomingTopologyFromActions = (
	actions: string[],
	currentTopology: CdagTopology
): CdagTopology => {
	const incomingTopology: CdagTopology = {};

	actions.forEach(action => {
		if (!nodeExists(currentTopology, action)) {
			incomingTopology[action] = { parents: {}, type: 'action' };
		}
	});

	return incomingTopology;
};
