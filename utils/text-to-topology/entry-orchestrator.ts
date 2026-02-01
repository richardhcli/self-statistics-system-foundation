import { aiEntryAnalyzer } from './ai-entry-analyzer';
import { buildIncomingTopologyFromActions } from './build-incoming-topology-from-actions';
import { dataUpdater } from './data-updater';
import { EntryOrchestratorContext, EntryPipelineResult } from './types';
import { mergeTopology } from '@/lib/soulTopology';
import { getCurrentData } from '@/stores/app-data';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { upsertJournalEntry } from '@/features/journal/utils/journal-entry-utils';

/**
 * entryOrchestrator
 * Orchestrates entry processing: runs AI analysis if enabled, merges resulting topology,
 * applies data updates, and returns the result of the entry operation.
 *
 * @param context - Entry data and flags for AI usage, including pre-normalized date
 * @returns Pipeline result containing the updated data and entry metadata
 */
export const entryOrchestrator = async (
	context: EntryOrchestratorContext
): Promise<EntryPipelineResult> => {
	const { useAI = false, entry, duration, actions = [], normalizedDate } = context;
	const currentData = getCurrentData();

	let cdagTopologyFragment;
	let estimatedDuration = duration;

	if (useAI) {
		const aiResult = await aiEntryAnalyzer(entry, duration);
		cdagTopologyFragment = aiResult.cdagTopologyFragment;
		estimatedDuration = aiResult.estimatedDuration;
	} else {
		cdagTopologyFragment = buildIncomingTopologyFromActions(actions, currentData.cdagTopology);
	}

	const mergedData = mergeTopology(currentData, cdagTopologyFragment);

	const result = dataUpdater(mergedData, { ...context, duration: estimatedDuration }, useAI);

	// Use the pre-normalized date to update the SAME entry that was created as loading
	upsertJournalEntry(normalizedDate, result.entryData);

	return result;
};
