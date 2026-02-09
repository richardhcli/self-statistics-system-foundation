/**
 * ForceSyncSnapshot
 *
 * Displays Firestore snapshot data for debug inspection.
 */

import React, { useMemo } from "react";
import JsonContainerRenderer, {
  type FirestoreDeleteTarget,
} from "../../utils/json-container-renderer";
import type { BackendDatastoreSnapshot } from "../../utils/datastore-sync";

interface SnapshotSection {
  label: string;
  rootPath: string;
  rootKind: "doc" | "collection";
  data: Record<string, unknown> | null;
}

interface ForceSyncSnapshotProps {
  uid?: string;
  snapshot: BackendDatastoreSnapshot | null;
  onDelete: (target: FirestoreDeleteTarget) => void;
}

const ForceSyncSnapshot: React.FC<ForceSyncSnapshotProps> = ({
  uid,
  snapshot,
  onDelete,
}) => {
  const sections = useMemo<SnapshotSection[]>(() => {
    if (!uid || !snapshot) return [];

    return [
      {
        label: "User Profile",
        rootPath: `users/${uid}`,
        rootKind: "doc",
        data: snapshot.userProfile ?? {},
      },
      {
        label: "Account Config",
        rootPath: `users/${uid}/account_config`,
        rootKind: "collection",
        data: snapshot.accountConfig ?? {},
      },
      {
        label: "User Information",
        rootPath: `users/${uid}/user_information`,
        rootKind: "collection",
        data: snapshot.userInformation ?? {},
      },
      {
        label: "Journal Tree",
        rootPath: `users/${uid}/journal_meta/tree_structure`,
        rootKind: "doc",
        data: snapshot.journalTree ?? {},
      },
      {
        label: "Journal Entries",
        rootPath: `users/${uid}/journal_entries`,
        rootKind: "collection",
        data: snapshot.journalEntries ?? {},
      },
      {
        label: "Graph Structure",
        rootPath: `users/${uid}/graphs/cdag_topology`,
        rootKind: "doc",
        data: snapshot.graphStructure ?? {},
      },
      {
        label: "Adjacency List",
        rootPath: `users/${uid}/graphs/cdag_topology/adjacency_list`,
        rootKind: "collection",
        data: snapshot.graphAdjacencyList ?? {},
      },
      {
        label: "Node Summaries",
        rootPath: `users/${uid}/graphs/cdag_topology/node_summaries`,
        rootKind: "collection",
        data: snapshot.graphNodeSummaries ?? {},
      },
      {
        label: "Graph Nodes",
        rootPath: `users/${uid}/graphs/cdag_topology/nodes`,
        rootKind: "collection",
        data: snapshot.graphNodes ?? {},
      },
      {
        label: "Graph Edges",
        rootPath: `users/${uid}/graphs/cdag_topology/edges`,
        rootKind: "collection",
        data: snapshot.graphEdges ?? {},
      },
    ];
  }, [snapshot, uid]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black uppercase text-white">
          Backend Snapshot
        </h4>
        <span className="text-[10px] uppercase text-slate-400">
          {snapshot ? "Loaded" : "No data"}
        </span>
      </div>

      {snapshot ? (
        <div className="space-y-6">
          {sections.map((section) => (
            <JsonContainerRenderer
              key={section.label}
              label={section.label}
              data={section.data}
              rootPath={section.rootPath}
              rootKind={section.rootKind}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Fetch backend data to inspect Firestore state.
        </p>
      )}
    </div>
  );
};

export default ForceSyncSnapshot;
