
import { CdagTopology } from '../types';

/**
 * Calculates experience propagation using a "Path-Weighted Cumulative Averaging" approach.
 * 
 * DESIGN PHILOSOPHY:
 * In a complex CDAG, a single task (Action) can influence multiple branches. For instance,
 * "Writing a Technical Blog" might contribute to both "Coding" and "Writing". 
 * 
 * Simply summing these contributions at the Domain level leads to exponential EXP inflation.
 * This algorithm treats each seed action as a discrete unit of effort and calculates the 
 * mean intensity across all possible inheritance paths.
 * 
 * ALGORITHM:
 * 1. For each initial seed (Action):
 *    - Perform a BFS traversal upwards through the topology.
 *    - Maintain a 'pathWeight' that decays as it moves up based on edge proportions.
 *    - Accumulate the weighted seed value and increment a hit counter for every ancestor.
 * 2. After all seeds are processed:
 *    - Normalize the accumulated sums by the hit counts (Path-Averaging).
 * 
 * @param topology - The logical hierarchy (Child -> Parents).
 * @param initialValues - The starting EXP values (seeds from the journal entry).
 * @returns A map of every node in the topology and its resulting propagated EXP.
 */
export const calculateParentPropagation = (
  topology: CdagTopology,
  initialValues: Record<string, number>
): Record<string, number> => {
  const accumulatedSum: Record<string, number> = {};
  const contributionCount: Record<string, number> = {};
  
  Object.entries(initialValues).forEach(([actionLabel, seedValue]) => {
    // Each action starts a new propagation wave
    const queue: { label: string; weight: number }[] = [
      { label: actionLabel, weight: 1.0 }
    ];

    while (queue.length > 0) {
      const { label, weight } = queue.shift()!;

      // We use path-based accumulation. If one action reaches a node via 3 different 
      // paths, it contributes 3 times, which is then handled by the final averaging.
      accumulatedSum[label] = (accumulatedSum[label] || 0) + (seedValue * weight);
      contributionCount[label] = (contributionCount[label] || 0) + 1;

      const parents = topology[label]?.parents || {};
      Object.entries(parents).forEach(([parentLabel, edgeWeight]) => {
        queue.push({
          label: parentLabel,
          weight: weight * edgeWeight
        });
      });
    }
  });

  const result: Record<string, number> = {};
  Object.keys(accumulatedSum).forEach(label => {
    const sum = accumulatedSum[label];
    const count = contributionCount[label];
    
    /**
     * NORMALIZATION STEP:
     * This turns the cumulative sum into a "Mean Intensity". 
     * It ensures that broad domains (roots) reflect the average effort of their sub-trees 
     * rather than a simple sum which would scale poorly with graph density.
     */
    result[label] = count > 0 ? sum / count : 0;
  });

  return result;
};
