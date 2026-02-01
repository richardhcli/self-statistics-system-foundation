# Soul Topology Library

`lib/soulTopology` is the home for all **brain structure logic**. It owns the utilities that build, merge, and propagate the CDAG topology and provides the entry-processing helpers used by the journal feature.

## Responsibilities
- Topology utilities (merge, node checks, node creation)
- EXP propagation across the hierarchy
- AI-driven topology building and generalization chains
- Journal entry brain processing helpers

## Key Exports
- `mergeTopology`, `nodeExists`, `createNode`
- `calculateParentPropagation`
- `prepareAiJournalEntryProcessor`, `prepareManualJournalEntryProcessor`
- `SoulTopologyStore`, `soulTopologyStoreKey`

## Related Store
The store declaration and API wrappers remain in `stores/cdag-topology`. This library only contains logic that operates on the topology store.
