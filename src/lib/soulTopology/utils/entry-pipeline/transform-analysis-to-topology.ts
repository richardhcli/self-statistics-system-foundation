import { GraphState, NodeData, EdgeData } from '@/types';
import { TextToActionResponse, GeneralizationLink } from '@/lib/soulTopology/types';

/**
 * transformAnalysisToTopology
 * 
 * Pure transformation function: Converts AI analysis result into a topology fragment.
 * 
 * Uses STRUCTURED parent-child mappings to build the complete hierarchy:
 * 1. Action nodes (concrete tasks)
 * 2. Skill nodes + edges from skillMappings
 * 3. Characteristic nodes + edges from characteristicMappings
 * 4. Generalization chain nodes + edges (optional)
 * 
 * Handles empty arrays gracefully - only creates nodes/edges that exist.
 * No side effects. No external dependencies beyond types.
 * 
 * @param analysis - AI analysis result with structured layer mappings
 * @param generalizationChain - Optional generalization links (fallback if AI didn't provide)
 * @returns A GraphState fragment representing the complete hierarchy ready to merge
 * 
 * @example
 * const analysis = {
 *   durationMinutes: 60,
 *   weightedActions: [{ label: "Debugging", weight: 1.0 }],
 *   skillMappings: [{ child: "Debugging", parent: "Software engineering", weight: 0.8 }],
 *   characteristicMappings: [{ child: "Software engineering", parent: "Intellect", weight: 0.9 }],
 *   generalizationChain: []
 * };
 * 
 * const fragment = transformAnalysisToTopology(analysis, []);
 * // Returns GraphState with nodes: Intellect, Software engineering, Debugging
 * // Returns edges: Intellect -> Software engineering (0.9), Software engineering -> Debugging (0.8)
 */
export const transformAnalysisToTopology = (
	analysis: TextToActionResponse,
	generalizationChain: GeneralizationLink[]
): GraphState => {
	const nodes: Record<string, NodeData> = {};
	const edges: Record<string, EdgeData> = {};
	const timestamp = new Date().toISOString();

	// ============================================================
	// LAYER 1: Create action nodes from weightedActions
	// ============================================================
	analysis.weightedActions.forEach(wa => {
		nodes[wa.label] = {
			id: wa.label,
			label: wa.label,
			type: 'action',
			createdAt: timestamp,
			updatedAt: timestamp,
		};
	});

	// ============================================================
	// LAYER 2: Create skill nodes and edges from skillMappings
	// ============================================================
	analysis.skillMappings.forEach(mapping => {
		// Create skill node if it doesn't exist
		if (!nodes[mapping.parent]) {
			nodes[mapping.parent] = {
				id: mapping.parent,
				label: mapping.parent,
				type: 'skill',
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		}

		// Create edge from skill to action (parent -> child)
		const edgeId = `${mapping.parent}->${mapping.child}`;
		edges[edgeId] = {
			id: edgeId,
			source: mapping.parent,
			target: mapping.child,
			weight: mapping.weight,
			createdAt: timestamp,
			updatedAt: timestamp,
		};
	});

	// ============================================================
	// LAYER 3: Create characteristic nodes and edges from characteristicMappings
	// ============================================================
	analysis.characteristicMappings.forEach(mapping => {
		// Create characteristic node if it doesn't exist
		if (!nodes[mapping.parent]) {
			nodes[mapping.parent] = {
				id: mapping.parent,
				label: mapping.parent,
				type: 'characteristic',
				createdAt: timestamp,
				updatedAt: timestamp,
			};
		}

		// Create edge from characteristic to skill (parent -> child)
		const edgeId = `${mapping.parent}->${mapping.child}`;
		edges[edgeId] = {
			id: edgeId,
			source: mapping.parent,
			target: mapping.child,
			weight: mapping.weight,
			createdAt: timestamp,
			updatedAt: timestamp,
		};
	});

	// ============================================================
	// LAYER 4: Merge generalization chain if provided
	// ============================================================
	// Use fallback chain if analysis didn't provide one
	const finalChain = (analysis.generalizationChain && analysis.generalizationChain.length > 0)
		? analysis.generalizationChain
		: generalizationChain;

	finalChain.forEach(link => {
		// Create nodes if they don't exist (with type 'none' for abstract concepts)
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
