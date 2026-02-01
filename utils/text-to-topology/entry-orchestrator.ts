import { aiEntryAnalyzer } from './ai-entry-analyzer';
import { buildIncomingTopologyFromActions } from './build-incoming-topology-from-actions';
import { dataUpdater } from './data-updater';
import { EntryOrchestratorContext, EntryPipelineResult } from './types';
import { mergeTopology } from '@/lib/soulTopology';
import { getCurrentData } from '@/stores/user-data';

/**
 * entryOrchestrator
 * Orchestrates entry processing: runs AI analysis if enabled, merges resulting topology,
 * applies data updates, and returns the result of the entry operation.
 *
 * @param context - Entry data and flags for AI usage
 * @returns Pipeline result containing the updated data and entry metadata
 */
export const entryOrchestrator = async (
	context: EntryOrchestratorContext
): Promise<EntryPipelineResult> => {
	const { useAI = false, entry, duration, actions = [] } = context;
	const currentData = getCurrentData();

	// Determine topology fragment and duration based on AI flag
	let cdagTopologyFragment;
	let estimatedDuration = duration;

	if (useAI) {
		const aiResult = await aiEntryAnalyzer(entry, duration);
		cdagTopologyFragment = aiResult.cdagTopologyFragment;
		estimatedDuration = aiResult.estimatedDuration;
	} else {
		cdagTopologyFragment = buildIncomingTopologyFromActions(actions, currentData.cdagTopology);
	}

	// Merge topology into current data
	const mergedData = mergeTopology(currentData, cdagTopologyFragment);

	// Apply data updates (stats, entry metadata, etc.)
	return dataUpdater(mergedData, { ...context, duration: estimatedDuration }, useAI);
};
