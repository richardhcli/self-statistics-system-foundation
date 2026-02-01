import { AppData, JournalEntryData } from '@/types';
import { applyScaledProgression } from '@/stores/player-statistics';
import { EntryOrchestratorContext } from './types';

/**
 * dataUpdater
 * Applies data updates (player statistics, entry metadata) after topology has been merged.
 * Handles both AI-analyzed and manually-actioned entries.
 *
 * @param data - Current AppData with merged topology already applied
 * @param context - Entry context including entry text and duration
 * @param useAI - Whether the entry was AI-analyzed
 * @returns Updated AppData and the constructed JournalEntryData
 */
export const dataUpdater = (
	data: AppData,
	context: EntryOrchestratorContext,
	useAI: boolean = false
): { data: AppData; entryData: JournalEntryData } => {
	const { entry, actions = [], duration } = context;
	let current = { ...data };

	if (useAI) {
		// For AI-analyzed entries, use provided actions or default fallback
		const actionLabels = actions.length > 0 ? actions : ['AI Analyzed'];
		const { data: nextStats, totalIncrease, levelsGained, nodeIncreases } = applyScaledProgression(
			current,
			actionLabels,
			duration
		);

		current = nextStats;

		if (actionLabels.length > 0) {
			current = {
				...current,
				userInformation: {
					...current.userInformation,
					mostRecentAction: actionLabels[0]
				}
			};
		}

		const entryData: JournalEntryData = {
			content: entry,
			duration,
			actions: actionLabels,
			metadata: {
				totalExp: totalIncrease,
				levelsGained,
				nodeIncreases
			}
		};

		return { data: current, entryData };
	}

	// Manual action entry
	const { data: nextStats, totalIncrease, levelsGained, nodeIncreases } = applyScaledProgression(
		current,
		actions,
		duration
	);

	current = nextStats;

	if (actions.length > 0) {
		current = {
			...current,
			userInformation: {
				...current.userInformation,
				mostRecentAction: actions[actions.length - 1]
			}
		};
	}

	const entryData: JournalEntryData = {
		content: entry,
		duration,
		actions: actions.length > 0 ? actions : undefined,
		metadata: {
			totalExp: totalIncrease,
			levelsGained,
			nodeIncreases
		}
	};

	return { data: current, entryData };
};
