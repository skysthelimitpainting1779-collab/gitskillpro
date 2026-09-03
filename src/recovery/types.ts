export type RecoveryArtifactType =
  | "project"
  | "work_item"
  | "branch"
  | "worktree"
  | "commit"
  | "pull_request"
  | "review"
  | "ci_run"
  | "merge"
  | "deployment"
  | "migration"
  | "database_state";

export interface RecoveryArtifact {
  id: string;
  type: RecoveryArtifactType;
  title?: string;
  provider?: string;
  workItemId?: string;
  sha?: string;
  state?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export type RecoveryEdgeKind =
  | "implements"
  | "implemented_by"
  | "contains"
  | "reviewed_by"
  | "verified_by"
  | "merged_as"
  | "deployed_as"
  | "migrated_by"
  | "duplicate_of"
  | "supersedes"
  | "superseded_by"
  | "blocked_by"
  | "related_to";

export interface RecoveryEdge {
  from: string;
  to: string;
  kind: RecoveryEdgeKind;
  explicit: boolean;
  evidence: string[];
  confidence?: number;
  reason?: string;
}

export interface RecoverySnapshot {
  artifacts: RecoveryArtifact[];
  edges: RecoveryEdge[];
}

export interface RecoveryGraphFinding {
  code: string;
  severity: "info" | "warning" | "error";
  observation: string;
  evidence?: Record<string, unknown>;
}

export interface RecoveryEvidenceGraph {
  nodes: RecoveryArtifact[];
  edges: RecoveryEdge[];
  findings: RecoveryGraphFinding[];
}

export type RecoveryClassification =
  | "current"
  | "ready"
  | "blocked"
  | "stale"
  | "duplicate"
  | "superseded"
  | "abandoned"
  | "orphaned"
  | "merged_but_tracker_open"
  | "tracker_done_but_unmerged"
  | "failed_baseline_ci"
  | "failed_pr_specific"
  | "failed_external"
  | "conflicted"
  | "salvageable"
  | "unsafe_to_salvage"
  | "production_active"
  | "unknown";
