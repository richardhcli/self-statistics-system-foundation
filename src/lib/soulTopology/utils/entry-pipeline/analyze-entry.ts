import { generalizeConcept, processTextToLocalTopologySinglePrompt } from '@/lib/google-ai';
import { transformAnalysisToTopology } from './transform-analysis-to-topology';
import { GraphState, GeneralizationLink } from '@/types';
import { AnalyzeEntryResult } from './types';

/**
 * analyzeEntry
 * 
 * Intelligent entry analysis orchestrator with validation and smart generalization.
 * 
 * WORKFLOW:
 * 1. Extract semantic data via single-prompt AI analysis (structured layer mappings)
 * 2. Validate AI response quality and structure
 * 3. Intelligently decide if generalization is needed:
 *    - Skip if chain already present and valid
 *    - Skip if characteristics already exist in topology
 *    - Execute only for genuinely new concepts
 * 4. Transform validated analysis into topology fragment
 * 
 * ERROR HANDLING:
 * - Gracefully handles AI failures (returns empty arrays, safe defaults)
 * - Validates weight distributions (must sum to 1.0)
 * - Validates structured mappings integrity
 * - Provides detailed logging for debugging
 * 
 * @param entry - Raw journal entry text (user input)
 * @param currentTopology - Current GraphState to check for existing nodes
 * @param durationOverride - Optional user-provided duration override (integer minutes or string)
 * @returns Topology fragment and estimated duration in minutes
 * 
 * @example
 * const result = await analyzeEntry(
 *   "I spent 2 hours studying machine learning algorithms",
 *   currentTopology,
 *   120
 * );
 * // result.topologyFragment contains validated action/skill/characteristic nodes
 * // result.estimatedDuration is "120" (string representation of minutes)
 */
export const analyzeEntry = async (
	entry: string,
	currentTopology: GraphState,
	durationOverride?: number | string
): Promise<AnalyzeEntryResult> => {
	// ============================================================
	// STEP 1: AI Semantic Extraction
	// ============================================================
	console.log('📍 [Entry Pipeline] Step 1: AI semantic extraction...');
	console.log('   Entry length:', entry.length, 'characters');
	
	const analysis = await processTextToLocalTopologySinglePrompt(entry);
	
	console.log('✅ [AI Response] Received:', {
		durationMinutes: analysis.durationMinutes,
		actionCount: analysis.weightedActions.length,
		skillMappingCount: analysis.skillMappings.length,
		characteristicMappingCount: analysis.characteristicMappings.length,
		chainLength: analysis.generalizationChain?.length || 0
	});

	// ============================================================
	// STEP 2: Response Validation & Sanitization
	// ============================================================
	console.log('📍 [Entry Pipeline] Step 2: Validating AI response...');
	
	// Validate weighted actions sum to 1.0 (with tolerance)
	if (analysis.weightedActions.length > 0) {
		const weightSum = analysis.weightedActions.reduce((sum, a) => sum + a.weight, 0);
		const tolerance = 0.01;
		
		if (Math.abs(weightSum - 1.0) > tolerance) {
			console.warn(`⚠️ [Validation] Action weights sum to ${weightSum.toFixed(3)}, normalizing to 1.0`);
			
			// Normalize weights to sum to 1.0
			analysis.weightedActions = analysis.weightedActions.map(a => ({
				...a,
				weight: a.weight / weightSum
			}));
		}
	}
	
	// Validate mapping integrity (every action should have a skill mapping)
	if (analysis.skillMappings.length === 0 && analysis.weightedActions.length > 0) {
		console.warn('⚠️ [Validation] No skill mappings provided, topology will be incomplete');
	}
	
	if (analysis.characteristicMappings.length === 0 && analysis.skillMappings.length > 0) {
		console.warn('⚠️ [Validation] No characteristic mappings provided, topology will be incomplete');
	}

	// ============================================================
	// STEP 3: Duration Resolution
	// ============================================================
	const estimatedDuration = durationOverride 
		? (typeof durationOverride === 'number' ? durationOverride.toString() : durationOverride)
		: analysis.durationMinutes.toString();
	
	console.log(`⏱️ [Duration] Resolved to: ${estimatedDuration} ${typeof durationOverride === 'number' || !isNaN(Number(estimatedDuration)) ? 'minutes' : ''}`);

	// ============================================================
	// STEP 4: Intelligent Generalization Decision
	// ============================================================
	console.log('📍 [Entry Pipeline] Step 3: Evaluating generalization need...');
	
	let generalizationChain: GeneralizationLink[] = analysis.generalizationChain || [];
	
	// Smart decision: Only generalize if necessary
	const hasValidChain = generalizationChain.length > 0 && 
	                      generalizationChain.every(link => link.child && link.parent && link.weight);
	
	if (hasValidChain) {
		console.log(`✅ [Generalization] Using AI-provided chain (${generalizationChain.length} links)`);
	} else {
		// Extract unique characteristics from characteristicMappings
		const characteristics = [...new Set(analysis.characteristicMappings.map(m => m.parent))];
		
		// Check if any characteristics are genuinely new
		const newCharacteristics = characteristics.filter(
			c => !currentTopology.nodes[c]
		);
		
		if (newCharacteristics.length > 0) {
			console.log(`📍 [Generalization] Detected ${newCharacteristics.length} new characteristic(s):`, newCharacteristics);
			console.log('   Requesting concept generalization from fallback AI...');
			
			const actionLabels = analysis.weightedActions.map(a => a.label);
			const skills = [...new Set(analysis.skillMappings.map(m => m.parent))];
			
			try {
				const genResult = await generalizeConcept(
					actionLabels,
					skills,
					characteristics
				);
				
				if (genResult.chain && genResult.chain.length > 0) {
					generalizationChain = genResult.chain;
					console.log(`✅ [Generalization] Generated chain with ${generalizationChain.length} links`);
				} else {
					console.warn('⚠️ [Generalization] Fallback returned empty chain');
				}
			} catch (error) {
				console.error('❌ [Generalization] Fallback failed:', error);
				// Continue without generalization chain
			}
		} else {
			console.log('✅ [Generalization] All characteristics exist in topology, skipping');
		}
	}

	// ============================================================
	// STEP 5: Topology Fragment Construction
	// ============================================================
	console.log('📍 [Entry Pipeline] Step 4: Building topology fragment...');
	
	const topologyFragment = transformAnalysisToTopology(analysis, generalizationChain);
	
	console.log('✅ [Complete] Topology fragment created:', {
		nodeCount: Object.keys(topologyFragment.nodes).length,
		edgeCount: Object.keys(topologyFragment.edges).length,
		estimatedDuration
	});

	return { topologyFragment, estimatedDuration };
};
