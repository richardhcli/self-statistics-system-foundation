import { generalizeConcept, processTextToLocalTopologySinglePrompt } from '@/lib/google-ai';
import { buildIncomingTopologyFromAnalysis } from './build-incoming-topology-from-analysis';
import { GraphState, GeneralizationLink } from '@/types';

export interface AiEntryAnalyzerResult {
	topologyFragment: GraphState;
	estimatedDuration: string;
}

/**
 * aiEntryAnalyzer
 * Runs AI analysis to derive actions, skills, characteristics, and optional generalizations.
 * Returns only the topology fragment and estimated duration.
 *
 * @param entry - Raw journal entry text
 * @param currentTopology - Current GraphState for checking existing nodes
 * @param duration - Optional user-provided duration override
 * @returns Topology fragment and estimated duration
 */
export const aiEntryAnalyzer = async (
	entry: string,
	currentTopology: GraphState,
	duration?: string
): Promise<AiEntryAnalyzerResult> => {
	console.log('📍 1: Processing text to local topology using single prompt...');
	const analysis = await processTextToLocalTopologySinglePrompt(entry);
	console.log('✅ Text processed to local topology:', analysis);

	const estimatedDuration = analysis.duration || duration || 'unknown';

	const hasNewCharacteristic = analysis.characteristics.some(
		c => !currentTopology.nodes[c]
	);

	let generalizationChain: GeneralizationLink[] = analysis.generalizationChain || [];
	if (generalizationChain.length === 0 && hasNewCharacteristic) {
		const actionLabels = analysis.weightedActions.map(a => a.label);

		console.log('📍 2. Generalizing new concepts based on characteristics...');
		const genResult = await generalizeConcept(actionLabels, analysis.skills, analysis.characteristics);
		console.log('✅ Concepts generalized:', genResult);

		generalizationChain = genResult.chain || [];
	}

	const topologyFragment = buildIncomingTopologyFromAnalysis(analysis, generalizationChain);

	return { topologyFragment, estimatedDuration };
};
