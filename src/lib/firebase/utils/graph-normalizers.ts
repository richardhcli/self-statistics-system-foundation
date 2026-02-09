/**
 * Shared normalization helpers for CDAG Firestore payloads.
 */

import type { EdgeData, NodeData } from '@/types';

const filterUndefined = <T extends Record<string, unknown>>(payload: T): T => {
  const entries = Object.entries(payload).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

export const buildEdgeId = (source: string, target: string) => `${source}->${target}`;

export const normalizeNodeDocument = (docId: string, payload?: Partial<NodeData>): NodeData => {
  const id = payload?.id ?? docId;

  return {
    id,
    label: payload?.label ?? id,
    type: payload?.type ?? 'none',
    metadata: payload?.metadata,
    createdAt: payload?.createdAt,
    updatedAt: payload?.updatedAt,
  };
};

export const normalizeEdgeDocument = (docId: string, payload?: Partial<EdgeData>): EdgeData => {
  const id = payload?.id ?? docId;
  const [fallbackSource, fallbackTarget] = id.split('->');

  return {
    id,
    source: payload?.source ?? fallbackSource,
    target: payload?.target ?? fallbackTarget,
    weight: payload?.weight ?? 1.0,
    label: payload?.label,
    createdAt: payload?.createdAt,
    updatedAt: payload?.updatedAt,
  };
};

export const serializeNodeDocument = (payload: NodeData): NodeData =>
  filterUndefined({
    id: payload.id,
    label: payload.label,
    type: payload.type,
    metadata: payload.metadata,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  });

export const serializeEdgeDocument = (payload: EdgeData): EdgeData =>
  filterUndefined({
    id: payload.id,
    source: payload.source,
    target: payload.target,
    weight: payload.weight,
    label: payload.label,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  });

export const serializeNodeUpdate = (nodeId: string, payload: Partial<NodeData>) =>
  filterUndefined({
    id: payload.id ?? nodeId,
    label: payload.label,
    type: payload.type,
    metadata: payload.metadata,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  });

export const serializeEdgeUpdate = (edgeId: string, payload: Partial<EdgeData>) => {
  const [fallbackSource, fallbackTarget] = edgeId.split('->');

  return filterUndefined({
    id: payload.id ?? edgeId,
    source: payload.source ?? fallbackSource,
    target: payload.target ?? fallbackTarget,
    weight: payload.weight,
    label: payload.label,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  });
};
