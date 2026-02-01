import { TextToActionResponse } from "@/features/journal/types";
import { extractActions } from "./extract-actions";
import { estimateTimeAndProportions } from "./estimate-time-and-proportions";
import { mapActionsToSkills } from "./action-to-skills";
import { mapSkillsToCharacteristics } from "./skills-to-characteristic";
import { getAiInstance } from "../get-ai-instance";

/**
 * processTextToLocalTopology
 * PRIMARY ORCHESTRATOR - Entry → Topology Pipeline
 * 
 * Coordinates the full 3-layer semantic decomposition:
 * 1. Extract specific actions from text
 * 2. Estimate time allocation and proportional weights
 * 3. Map actions to intermediate skills
 * 4. Map skills to abstract characteristics
 * 
 * Runs all steps sequentially with per-call timeouts. If a step fails,
 * returns all derived information up to the failure point.
 * 
 * @param text - User's journal entry text
 * @returns TextToActionResponse containing actions, skills, characteristics, and duration
 */
export const processTextToLocalTopology = async (text: string): Promise<TextToActionResponse> => {
  const ai = await getAiInstance();

  // Step 1: Extract Actions + Estimate Proportions
  console.log('📍 Step 1: Extracting actions from text...');
  const rawActions = await extractActions(ai, text);
  console.log('✅ Actions extracted:', rawActions);

  console.log('📍 Step 2: Estimating time and proportions...');
  const timeAndWeights = await estimateTimeAndProportions(ai, text, rawActions);
  console.log('✅ Time and weights estimated:', timeAndWeights);

  // Step 3: Map Actions to Skills
  console.log('📍 Step 3: Mapping actions to skills...');
  let skills: string[] = [];
  try {
    const actionLabels = timeAndWeights.weightedActions.map(a => a.label);
    skills = await mapActionsToSkills(ai, actionLabels);
    console.log('✅ Skills mapped:', skills);
  } catch (error) {
    console.warn('⚠️ Step 3 failed, returning partial results:', error);
    return {
      weightedActions: timeAndWeights.weightedActions,
      duration: timeAndWeights.duration,
      skills: [],
      characteristics: []
    };
  }

  // Step 4: Map Skills to Characteristics
  console.log('📍 Step 4: Mapping skills to characteristics...');
  let characteristics: string[] = [];
  try {
    characteristics = await mapSkillsToCharacteristics(ai, skills);
    console.log('✅ Characteristics mapped:', characteristics);
  } catch (error) {
    console.warn('⚠️ Step 4 failed, returning partial results:', error);
    return {
      weightedActions: timeAndWeights.weightedActions,
      duration: timeAndWeights.duration,
      skills,
      characteristics: []
    };
  }

  return {
    weightedActions: timeAndWeights.weightedActions,
    duration: timeAndWeights.duration,
    skills,
    characteristics
  };
};
