import { CdagTopology, TextToActionResponse, GeneralizationLink } from '@/types';

/**
 * buildIncomingTopologyFromAnalysis
 * Builds a base 3-layer topology from AI analysis and merges any generalization links.
 *
 * @param analysis - AI analysis result containing weighted actions, skills, and characteristics
 * @param generalizationChain - Optional generalization links to merge as ancestors
 * @returns A topology fragment representing the derived hierarchy
 */
export const buildIncomingTopologyFromAnalysis = (
	analysis: TextToActionResponse,
	generalizationChain: GeneralizationLink[]
): CdagTopology => {
	const incomingTopology: CdagTopology = {};
	const topCharacteristic = analysis.characteristics[0] || 'General Domain';
	const primarySkill = analysis.skills[0] || 'General Activity';

	// Base 3-layer structure
	incomingTopology[topCharacteristic] = { parents: {}, type: 'characteristic' };
	incomingTopology[primarySkill] = {
		parents: { [topCharacteristic]: 1.0 },
		type: 'skill'
	};

	analysis.weightedActions.forEach(wa => {
		incomingTopology[wa.label] = {
			parents: { [primarySkill]: wa.weight },
			type: 'action'
		};
	});

	// Merge generalization chain if it exists
	generalizationChain.forEach(link => {
		if (!incomingTopology[link.child]) {
			incomingTopology[link.child] = { parents: {}, type: 'none' };
		}
		if (!incomingTopology[link.parent]) {
			incomingTopology[link.parent] = { parents: {}, type: 'none' };
		}
		incomingTopology[link.child].parents[link.parent] = link.weight;
	});

	return incomingTopology;
};
