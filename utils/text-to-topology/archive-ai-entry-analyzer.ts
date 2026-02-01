import { generalizeConcept, processTextToLocalTopology } from '@/lib/google-ai';
import { nodeExists } from '@/lib/soulTopology';
import { getCurrentData } from '@/stores/user-data';
import { buildIncomingTopologyFromAnalysis } from './build-incoming-topology-from-analysis';
import { AiAnalysisResult } from './types';

/**
 * DEPRECATED: archive-ai-entry-analyzer
 * Archived legacy analyzer that used the prompt chain pipeline.
 * Use aiEntryAnalyzer (single prompt) instead.
 */
export const archiveAiEntryAnalyzer = async (
  entry: string,
  duration?: string
): Promise<AiAnalysisResult> => {
  const currentData = getCurrentData();

  const analysis = await processTextToLocalTopology(entry);
  const finalDuration = analysis.duration || duration;

  const hasNewCharacteristic = analysis.characteristics.some(
    c => !nodeExists(currentData.cdagTopology, c)
  );

  let generalizationChain: AiAnalysisResult['generalizationChain'] = [];
  if (hasNewCharacteristic) {
    const actionLabels = analysis.weightedActions.map(a => a.label);

    console.log('📍 5. Generalizing new concepts based on characteristics...');
    const genResult = await generalizeConcept(actionLabels, analysis.skills, analysis.characteristics);
    console.log('✅ Concepts generalized:', genResult);

    generalizationChain = genResult.chain || [];
  }

  const mergedTopology = buildIncomingTopologyFromAnalysis(analysis, generalizationChain);

  return { analysis, finalDuration, generalizationChain, mergedTopology };
};
