import type { RiskTier } from "../core/types.js";

export type WorkDomain =
  | "project_intent"
  | "execution_graph"
  | "scm"
  | "ci"
  | "deployment"
  | "database";

export type WorkProvider =
  | "linear"
  | "beads"
  | "github"
  | "gitlab"
  | "jira"
  | "azure_boards"
  | "other";

export type SemanticWorkStatus =
  | "triage"
  | "backlog"
  | "ready"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "merged"
  | "deploying"
  | "done"
  | "canceled"
  | "unknown";

export interface AuthorityBinding {
  domain: WorkDomain;
  provider: WorkProvider;
  canonical: boolean;
  scope?: string;
}

export interface AuthorityMap {
  bindings: readonly AuthorityBinding[];
}

export interface WorkLink {
  kind: "parent" | "child" | "blocks" | "blocked_by" | "related" | "duplicate" | "supersedes" | "superseded_by" | "discovered_from";
  targetId: string;
  explicit: boolean;
}

export interface WorkItem {
  id: string;
  provider: WorkProvider;
  title: string;
  status: SemanticWorkStatus;
  projectId?: string;
  repository?: string;
  branchName?: string;
  acceptanceCriteria?: string[];
  blockers: string[];
  links?: WorkLink[];
  duplicateOf?: string;
  supersedes?: string[];
  supersededBy?: string[];
  assigneeId?: string;
  delegateId?: string;
  risk?: RiskTier;
  updatedAt?: string;
}

export type CompletionGate =
  | "merged"
  | "deployed"
  | "database_verified"
  | "production_verified"
  | "documentation"
  | "release";

export interface ProjectWorkflowPolicy {
  requireAcceptanceCriteria?: boolean;
  requireRepository?: boolean;
  requireNoBlockers?: boolean;
  completionRequires: CompletionGate[];
  independentReviewFromRisk?: RiskTier;
}
