import { GraphState, GeneralizationLink, JournalEntryData, TextToActionResponse } from '@/types';

export interface AiAnalysisResult {
	analysis: TextToActionResponse;
	finalDuration?: string;
	generalizationChain: GeneralizationLink[];
	topologyFragment: GraphState;
}

export interface EntryOrchestratorContext {
	entry: string;
	actions?: string[];
	useAI?: boolean;
	duration?: string;
	dateInfo?: any;
	normalizedDate?: { year: string; month: string; day: string; time: string };
}

