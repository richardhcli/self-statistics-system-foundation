/**
 * Skill Grouping Utility
 *
 * Groups "skill" type nodes by their closest "characteristic" parent
 * using the CDAG edge structure. Used by StatusView to display
 * skill clusters under their governing attribute.
 *
 * @module features/statistics/utils/group-skills
 */

import type { NodeData, EdgeData } from '@/stores/cdag-topology/types';
import type { PlayerStatistics } from '@systems/progression';

/** A single skill with its resolved stats. */
export interface SkillEntry {
  id: string;
  label: string;
  experience: number;
  level: number;
}

/** A characteristic group containing its child skills. */
export interface SkillCluster {
  characteristicId: string;
  characteristicLabel: string;
  totalExp: number;
  skills: SkillEntry[];
}

/**
 * Build a child → parent lookup from the edge table.
 * Each child maps to an array of parent node IDs.
 */
const buildChildToParents = (
  edges: Record<string, EdgeData>,
): Record<string, string[]> => {
  const map: Record<string, string[]> = {};
  Object.values(edges).forEach((edge) => {
    if (!map[edge.target]) map[edge.target] = [];
    map[edge.target].push(edge.source);
  });
  return map;
};

/**
 * Find the closest "characteristic" ancestor for a given node.
 * BFS upward through parents until a characteristic node is found.
 */
const findClosestCharacteristic = (
  nodeId: string,
  nodes: Record<string, NodeData>,
  childToParents: Record<string, string[]>,
): string | null => {
  const visited = new Set<string>();
  const queue = [...(childToParents[nodeId] ?? [])];

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    if (visited.has(parentId)) continue;
    visited.add(parentId);

    const parentNode = nodes[parentId];
    if (parentNode?.type === 'characteristic') return parentId;

    (childToParents[parentId] ?? []).forEach((gp) => {
      if (!visited.has(gp)) queue.push(gp);
    });
  }

  return null;
};

/**
 * Group skill nodes by their closest characteristic parent.
 *
 * @param nodes - Full CDAG node lookup.
 * @param edges - Full CDAG edge lookup.
 * @param stats - Player statistics (EXP/Level per node).
 * @param maxGroups - Max characteristic groups to return (sorted by total EXP desc).
 * @param maxSkillsPerGroup - Max skills per group (sorted by EXP desc).
 * @returns Sorted skill clusters.
 */
export const groupSkillsByCharacteristic = (
  nodes: Record<string, NodeData>,
  edges: Record<string, EdgeData>,
  stats: PlayerStatistics,
  maxGroups = 5,
  maxSkillsPerGroup = 5,
): SkillCluster[] => {
  const childToParents = buildChildToParents(edges);
  const clusterMap: Record<string, SkillCluster> = {};

  Object.values(nodes).forEach((node) => {
    if (node.type !== 'skill') return;

    const charId = findClosestCharacteristic(node.id, nodes, childToParents);
    if (!charId) return;

    const charNode = nodes[charId];
    if (!charNode) return;

    if (!clusterMap[charId]) {
      clusterMap[charId] = {
        characteristicId: charId,
        characteristicLabel: charNode.label,
        totalExp: 0,
        skills: [],
      };
    }

    const nodeStats = stats[node.label] ?? { experience: 0, level: 0 };
    clusterMap[charId].skills.push({
      id: node.id,
      label: node.label,
      experience: nodeStats.experience,
      level: nodeStats.level,
    });
    clusterMap[charId].totalExp += nodeStats.experience;
  });

  return Object.values(clusterMap)
    .sort((a, b) => b.totalExp - a.totalExp)
    .slice(0, maxGroups)
    .map((cluster) => ({
      ...cluster,
      skills: cluster.skills
        .sort((a, b) => b.experience - a.experience)
        .slice(0, maxSkillsPerGroup),
    }));
};
