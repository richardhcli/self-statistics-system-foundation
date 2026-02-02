import { GraphState, NodeData, EdgeData, TextToActionResponse, GeneralizationLink } from '@/types';

/**
 * transformAnalysisToTopology
 * 
 * Pure transformation function: Converts AI analysis result into a topology fragment.
 * 
 * Builds a 3-layer base hierarchy:
 * 1. Top characteristic (domain)
 * 2. Primary skill (activity category)
 * 3. Action nodes (concrete tasks)
 * 
 * Then enriches with any generalization chain links that extend the hierarchy upward.
 * 
 * No side effects. No external dependencies beyond types.
 * 
 * @param analysis - AI analysis result containing weighted actions, skills, and characteristics
 * @param generalizationChain - Optional generalization links to merge as ancestors
 * @returns A GraphState fragment representing the derived hierarchy ready to merge
 * 
 * @example
 * const analysis = {
 *   weightedActions: [{ label: "studying", weight: 0.8 }],
 *   skills: ["memorization"],
 *   characteristics: ["intelligence"]
 * };
 * 
 * const fragment = transformAnalysisToTopology(analysis, []);
 * // Returns GraphState with nodes: intelligence, memorization, studying
 * // Returns edges: intelligence -> memorization -> studying
 */
export const transformAnalysisToTopology = (
	analysis: TextToActionResponse,
	generalizationChain: GeneralizationLink[]
): GraphState => {
	const nodes: Record<string, NodeData> = {};
	const edges: Record<string, EdgeData> = {};
	const timestamp = new Date().toISOString();

	const topCharacteristic = analysis.characteristics[0] || 'General Domain';
	const primarySkill = analysis.skills[0] || 'General Activity';

	// Base 3-layer structure - create nodes
	nodes[topCharacteristic] = {
		id: topCharacteristic,
		label: topCharacteristic,
		type: 'characteristic',
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	nodes[primarySkill] = {
		id: primarySkill,
		label: primarySkill,
		type: 'skill',
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	// Create edge from characteristic to skill (parent -> child)
	const skillEdgeId = `${topCharacteristic}->${primarySkill}`;
	edges[skillEdgeId] = {
		id: skillEdgeId,
		source: topCharacteristic,
		target: primarySkill,
		weight: 1.0,
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	// Create action nodes and edges from skill to actions
	analysis.weightedActions.forEach(wa => {
		nodes[wa.label] = {
			id: wa.label,
			label: wa.label,
			type: 'action',
			createdAt: timestamp,
			updatedAt: timestamp,
		};

		const actionEdgeId = `${primarySkill}->${wa.label}`;
		edges[actionEdgeId] = {
			id: actionEdgeId,
			source: primarySkill,
			target: wa.label,
			weight: wa.weight,
			createdAt: timestamp,
			updatedAt: timestamp,
		};
	});

	// Merge generalization chain if it exists
	// This extends the hierarchy upward with additional ancestors
	generalizationChain.forEach(link => {
		// Create nodes if they don't exist
		if (!nodes[link.child]) {
			nodes[link.child] = {
				id: link.child,
				label: link.child,
				type: 'none',
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		}
		if (!nodes[link.parent]) {
			nodes[link.parent] = {
				id: link.parent,
				label: link.parent,
				type: 'none',
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		}

		// Create edge
		const linkEdgeId = `${link.parent}->${link.child}`;
		edges[linkEdgeId] = {
			id: linkEdgeId,
			source: link.parent,
			target: link.child,
			weight: link.weight,
			createdAt: timestamp,
			updatedAt: timestamp,
		};
	});

	return {
		nodes,
		edges,
		version: 2,
		lastSyncTimestamp: timestamp,
	};
};
