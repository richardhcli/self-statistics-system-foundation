/**
 * Entry Pipeline Utilities
 * 
 * Pure utilities for converting raw journal entries into topology fragments.
 * 
 * This module implements the core "text-to-graph" pipeline that transforms
 * user input into semantic topology changes.
 * 
 * ARCHITECTURE:
 * - Pure functions with no store imports or React dependencies
 * - Data-In, Data-Out pattern for all transformations
 * - Fully testable in isolation (Node.js/Vitest)
 * - Intelligent validation and error handling throughout
 * 
 * WORKFLOW:
 * 1. Journal Entry → [analyzeEntry] → Semantic Analysis
 * 2. Semantic Analysis → [transformAnalysisToTopology] → GraphState Fragment
 * 3. Manual Actions → [transformActionsToTopology] → GraphState Fragment
 * 
 * Public API:
 * - analyzeEntry: AI-driven entry analysis with intelligent generalization
 * - transformAnalysisToTopology: Pure transform (analysis → 3-layer GraphState)
 * - transformActionsToTopology: Pure transform (actions → GraphState)
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
