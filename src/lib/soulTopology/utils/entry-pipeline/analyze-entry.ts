import { generalizeConcept, processTextToLocalTopologySinglePrompt } from '@/lib/google-ai';
import { transformAnalysisToTopology } from './transform-analysis-to-topology';
import { GraphState, GeneralizationLink } from '@/types';
import { AnalyzeEntryResult } from './types';

/**
 * analyzeEntry
 * 
 * Pure utility that processes raw journal entry text through AI analysis.
 * Coordinates the AI text-extraction and concept-generalization pipeline.
 * 
 * This is the entry point for AI-driven entry processing:
 * 1. Extract actions, skills, characteristics from raw text
 * 2. If new characteristics detected, optionally generalize concepts
 * 3. Build a 3-layer topology fragment from analysis + generalization chain
 * 
 * The output is a GraphState fragment ready to be merged into the main topology.
 * 
 * @param entry - Raw journal entry text (user input)
 * @param currentTopology - Current GraphState to check for existing nodes
 * @param duration - Optional user-provided duration override
 * @returns Topology fragment and estimated duration
 * 
 * @example
 * const result = await analyzeEntry(
 *   "I spent 2 hours studying machine learning algorithms",
 *   currentTopology,
 *   "2h"
 * );
 * // result.topologyFragment contains action/skill/characteristic nodes and edges
 * // result.estimatedDuration is either provided or extracted from entry
 */
export const analyzeEntry = async (
	entry: string,
	currentTopology: GraphState,
	duration?: string
): Promise<AnalyzeEntryResult> => {
	console.log('📍 Entry Pipeline Step 1: Processing text to local topology using single prompt...');
	const analysis = await processTextToLocalTopologySinglePrompt(entry);
	console.log('✅ Text processed to local topology:', analysis);

	const estimatedDuration = analysis.duration || duration || 'unknown';

	const hasNewCharacteristic = analysis.characteristics.some(
		c => !currentTopology.nodes[c]
	);

	let generalizationChain: GeneralizationLink[] = analysis.generalizationChain || [];
	if (generalizationChain.length === 0 && hasNewCharacteristic) {
		const actionLabels = analysis.weightedActions.map(a => a.label);

		console.log('📍 Entry Pipeline Step 2: Generalizing new concepts based on characteristics...');
		const genResult = await generalizeConcept(actionLabels, analysis.skills, analysis.characteristics);
		console.log('✅ Concepts generalized:', genResult);

		generalizationChain = genResult.chain || [];
	}

	// Transform raw analysis into topology fragment
	const topologyFragment = transformAnalysisToTopology(analysis, generalizationChain);

	return { topologyFragment, estimatedDuration };
};
