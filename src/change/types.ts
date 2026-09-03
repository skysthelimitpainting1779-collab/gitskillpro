import type { RiskTier } from "../core/types.js";

export interface ChangeVersion {
  versionId: string;
  commitSha: string;
  baseSha?: string;
  createdAt?: string;
  active: boolean;
  prNumber?: number;
  vcsChangeId?: string;
  conflictState?: "clean" | "conflicted" | "unknown";
}

export interface LogicalChange {
  id: string;
  title: string;
  workItemIds?: string[];
  risk?: RiskTier;
  versions: ChangeVersion[];
  supersededBy?: string;
  status?: "planned" | "active" | "review" | "merged" | "released" | "superseded" | "abandoned" | "unknown";
}

export type ChangeDependencyKind = "depends_on" | "stacked_on" | "related";

export interface ChangeDependency {
  from: string;
  to: string;
  kind: ChangeDependencyKind;
}

export interface ChangeGraphInput {
  changes: LogicalChange[];
  dependencies: ChangeDependency[];
}

export interface ChangeGraph extends ChangeGraphInput {
  byId: Map<string, LogicalChange>;
}

export interface ChangeGraphFinding {
  code: "DUPLICATE_CHANGE_ID" | "UNKNOWN_CHANGE_REFERENCE" | "MULTIPLE_ACTIVE_CHANGE_VERSIONS" | "CHANGE_DEPENDENCY_CYCLE" | "INVALID_SUPERSESSION";
  changeId?: string;
  observation: string;
}

export interface ChangeGraphValidation {
  valid: boolean;
  findings: ChangeGraphFinding[];
}
