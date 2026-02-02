/**
 * Entry Pipeline Utilities
 * 
 * Pure utilities for converting raw journal entries into topology fragments.
 * 
 * This module implements the core "text-to-graph" pipeline that transforms
 * user input into semantic topology changes.
 * 
 * Public API:
 * - analyzeEntry: AI-driven entry analysis with generalization
 * - transformAnalysisToTopology: Pure transform (analysis -> GraphState)
 * - transformActionsToTopology: Pure transform (actions -> GraphState)
 * - Types: EntryOrchestratorContext, AnalyzeEntryResult, AiEntryAnalysisResult
 * 
 * These utilities are agnostic to React/storage and can be tested in isolation.
 * The Orchestrator Hook coordinates these outputs with store updates.
 */

export { analyzeEntry } from './analyze-entry';
export { transformAnalysisToTopology } from './transform-analysis-to-topology';
export { transformActionsToTopology } from './transform-actions-to-topology';
export type {
	EntryOrchestratorContext,
	AiEntryAnalysisResult,
	AnalyzeEntryResult,
} from './types';
