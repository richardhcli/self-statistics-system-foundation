import React from "react";
import { Trash2 } from "lucide-react";

export type FirestoreDeleteTarget =
  | { type: "doc"; path: string }
  | { type: "collection"; path: string }
  | { type: "field"; path: string; fieldPath: string }
  | { type: "array-value"; path: string; fieldPath: string; value: unknown };

export interface JsonContainerRendererProps {
  label: string;
  data: unknown;
  rootPath: string;
  rootKind: "doc" | "collection";
  onDelete: (target: FirestoreDeleteTarget) => void;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const formatPrimitive = (value: unknown) => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
};

const formatArrayItem = (value: unknown) => {
  if (isPlainObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return formatPrimitive(value);
};

const buildFieldPath = (rootKind: "doc" | "collection", path: string[]) => {
  if (rootKind === "collection") {
    return path.slice(1).join(".");
  }
  return path.join(".");
};

const resolveDocPath = (
  rootKind: "doc" | "collection",
  rootPath: string,
  path: string[]
) => {
  if (rootKind === "doc") return rootPath;
  return path.length > 0 ? `${rootPath}/${path[0]}` : rootPath;
};

const DeleteButton = ({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
    aria-label={label}
    title={label}
  >
    <Trash2 className="w-3.5 h-3.5" />
  </button>
);

const JsonNode: React.FC<{
  value: unknown;
  path: string[];
  rootKind: "doc" | "collection";
  rootPath: string;
  onDelete: (target: FirestoreDeleteTarget) => void;
}> = ({ value, path, rootKind, rootPath, onDelete }) => {
  if (Array.isArray(value)) {
    const docPath = resolveDocPath(rootKind, rootPath, path);
    const arrayFieldPath = buildFieldPath(rootKind, path);

    return (
      <details className="bg-slate-900/40 rounded-lg border border-slate-800 p-3">
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-slate-200">
          <span>Array ({value.length})</span>
          <DeleteButton
            onClick={() =>
              onDelete({
                type: "field",
                path: docPath,
                fieldPath: arrayFieldPath,
              })
            }
            label="Delete array"
          />
        </summary>
        <div className="mt-2 space-y-2">
          {value.map((item, index) => (
            <div
              key={`${arrayFieldPath}-${index}`}
              className="flex items-start justify-between gap-3 text-xs text-slate-300"
            >
              <span className="font-mono text-slate-400">[{index}]</span>
              <span className="flex-1 text-xs font-mono text-slate-300">
                {formatArrayItem(item)}
              </span>
              <DeleteButton
                onClick={() =>
                  onDelete({
                    type: "array-value",
                    path: docPath,
                    fieldPath: arrayFieldPath,
                    value: item,
                  })
                }
                label="Remove array value"
              />
            </div>
          ))}
        </div>
      </details>
    );
  }

  if (isPlainObject(value)) {
    const isCollectionDoc = rootKind === "collection" && path.length === 1;
    const containerDeleteTarget: FirestoreDeleteTarget | null = isCollectionDoc
      ? { type: "doc", path: `${rootPath}/${path[0]}` }
      : path.length === 0
        ? rootKind === "collection"
          ? { type: "collection", path: rootPath }
          : { type: "doc", path: rootPath }
        : {
            type: "field",
            path: resolveDocPath(rootKind, rootPath, path),
            fieldPath: buildFieldPath(rootKind, path),
          };

    return (
      <details className="bg-slate-900/40 rounded-lg border border-slate-800 p-3" open={path.length === 0}>
        <summary className="flex items-center justify-between cursor-pointer text-xs font-bold text-slate-200">
          <span>Object</span>
          {containerDeleteTarget ? (
            <DeleteButton
              onClick={() => onDelete(containerDeleteTarget)}
              label="Delete container"
            />
          ) : null}
        </summary>
        <div className="mt-2 space-y-2">
          {Object.entries(value).map(([key, child]) => {
            const childPath = [...path, key];
            const docPath = resolveDocPath(rootKind, rootPath, childPath);
            const fieldPath = buildFieldPath(rootKind, childPath);
            const isDocKey = rootKind === "collection" && path.length === 0;

            return (
              <div
                key={fieldPath || key}
                className="flex items-start justify-between gap-3 text-xs text-slate-300"
              >
                <span className="font-mono text-slate-400">{key}</span>
                <div className="flex-1">
                  <JsonNode
                    value={child}
                    path={childPath}
                    rootKind={rootKind}
                    rootPath={rootPath}
                    onDelete={onDelete}
                  />
                </div>
                <DeleteButton
                  onClick={() =>
                    onDelete(
                      isDocKey
                        ? { type: "doc", path: `${rootPath}/${key}` }
                        : { type: "field", path: docPath, fieldPath }
                    )
                  }
                  label="Delete field"
                />
              </div>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <span className="text-xs font-mono text-slate-300">
      {formatPrimitive(value)}
    </span>
  );
};

const JsonContainerRenderer: React.FC<JsonContainerRendererProps> = ({
  label,
  data,
  rootPath,
  rootKind,
  onDelete,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </h4>
        <DeleteButton
          onClick={() =>
            onDelete(
              rootKind === "collection"
                ? { type: "collection", path: rootPath }
                : { type: "doc", path: rootPath }
            )
          }
          label={`Delete ${label}`}
        />
      </div>
      <JsonNode
        value={data}
        path={[]}
        rootKind={rootKind}
        rootPath={rootPath}
        onDelete={onDelete}
      />
    </div>
  );
};

export default JsonContainerRenderer;
