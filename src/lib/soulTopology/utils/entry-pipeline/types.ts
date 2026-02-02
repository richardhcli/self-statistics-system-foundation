import { GraphState, GeneralizationLink, TextToActionResponse } from '@/types';

/**
 * EntryOrchestratorContext
 * 
 * Domain model defining the fundamental "Entry Processing Event".
 * This type describes what data is required to process a journal entry
 * through the complete soul-topology entry pipeline.
 * 
 * Used by:
 * - Pure utilities in lib/soulTopology for entry analysis and transformation
 * - Orchestrator hooks for coordinating cross-store updates
 * - Type validation across the entry-to-graph pipeline
 */
export interface EntryOrchestratorContext {
	entry: string;
	actions?: string[];
	useAI?: boolean;
	duration?: string;
	dateInfo?: any;
	normalizedDate?: { year: string; month: string; day: string; time: string };
}

/**
 * AiEntryAnalysisResult
 * 
 * Output from the entry analysis phase.
 * Contains raw analysis data, generalization chain, and derived topology fragment.
 */
export interface AiEntryAnalysisResult {
	analysis: TextToActionResponse;
	finalDuration?: string;
	generalizationChain: GeneralizationLink[];
	topologyFragment: GraphState;
}

/**
 * AnalyzeEntryResult
 * 
 * Simplified return type from aiEntryAnalyzer.
 * Combines topology fragment and estimated duration for use by orchestrator.
 */
export interface AnalyzeEntryResult {
	topologyFragment: GraphState;
	estimatedDuration: string;
}
