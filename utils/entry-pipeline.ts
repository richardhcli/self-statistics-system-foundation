import { AppData, CdagTopology, JournalEntryData, TextToActionResponse } from '@/types';
import { processTextToTopology, generalizeConcept } from '@/lib/google-ai';
import { mergeTopology, nodeExists } from '@/lib/soulTopology';
import { applyScaledProgression } from '@/stores/player-statistics';

interface GeneralizationLink {
	child: string;
	parent: string;
	weight: number;
}

interface AiAnalysisResult {
	analysis: TextToActionResponse;
	finalDuration?: string;
	generalizationChain: GeneralizationLink[];
}

export interface EntryOrchestratorContext {
	entry: string;
	actions?: string[];
	useAI?: boolean;
	duration?: string;
}

export interface EntryPipelineResult {
	analysis: TextToActionResponse | null;
	applyDataUpdates: (data: AppData) => { data: AppData; entryData: JournalEntryData };
}

const buildIncomingTopologyFromAnalysis = (
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

export const aiEntryAnalyzer = async (
	entry: string,
	currentData: AppData,
	duration?: string
): Promise<AiAnalysisResult> => {
	const analysis = await processTextToTopology(entry);
	const finalDuration = analysis.duration || duration;

	const hasNewCharacteristic = analysis.characteristics.some(
		c => !nodeExists(currentData.cdagTopology, c)
	);

	let generalizationChain: GeneralizationLink[] = [];
	if (hasNewCharacteristic) {
		const actionLabels = analysis.weightedActions.map(a => a.label);
		const genResult = await generalizeConcept(actionLabels, analysis.skills, analysis.characteristics);
		generalizationChain = genResult.chain || [];
	}

	return { analysis, finalDuration, generalizationChain };
};

export const dataUpdater = (
	data: AppData,
	context: EntryOrchestratorContext,
	analysisResult?: AiAnalysisResult
): { data: AppData; entryData: JournalEntryData } => {
	const { entry, actions = [], duration } = context;
	let current = { ...data };

	if (analysisResult) {
		const { analysis, finalDuration, generalizationChain } = analysisResult;
		const incomingTopology = buildIncomingTopologyFromAnalysis(analysis, generalizationChain);
		current = mergeTopology(current, incomingTopology);

		const actionLabels = analysis.weightedActions.map(wa => wa.label);
		const { data: nextStats, totalIncrease, levelsGained, nodeIncreases } = applyScaledProgression(
			current,
			actionLabels,
			finalDuration
		);

		current = nextStats;

		if (analysis.weightedActions.length > 0) {
			current = {
				...current,
				userInformation: {
					...current.userInformation,
					mostRecentAction: analysis.weightedActions[0].label
				}
			};
		}

		const entryData: JournalEntryData = {
			content: entry,
			duration: finalDuration,
			weightedActions: analysis.weightedActions,
			metadata: {
				totalExp: totalIncrease,
				levelsGained,
				nodeIncreases
			}
		};

		return { data: current, entryData };
	}

	const incomingTopology: CdagTopology = {};
	actions.forEach(action => {
		if (!nodeExists(current.cdagTopology, action)) {
			incomingTopology[action] = { parents: {}, type: 'action' };
		}
	});

	current = mergeTopology(current, incomingTopology);

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

export const entryOrchestrator = async (
	context: EntryOrchestratorContext,
	currentData: AppData
): Promise<EntryPipelineResult> => {
	const { useAI = false, entry, duration } = context;
	const analysisResult = useAI
		? await aiEntryAnalyzer(entry, currentData, duration)
		: undefined;

	return {
		analysis: analysisResult?.analysis ?? null,
		applyDataUpdates: (data: AppData) => dataUpdater(data, context, analysisResult)
	};
};
