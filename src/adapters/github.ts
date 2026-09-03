import type { EvidenceStatus } from "../providers/types.js";
import type { ReviewDecision } from "../work/comments.js";

export interface GitHubRepositoryPayload {
  repositoryFullName: string;
  defaultBranch?: string;
  allowAutoMerge?: boolean;
  mergeMethods?: Array<"merge" | "squash" | "rebase">;
  rulesets?: unknown[];
  branchProtection?: unknown;
}

export interface GitHubRepositorySnapshot {
  fullName: string;
  defaultBranch?: string;
  allowAutoMerge?: boolean;
  mergeMethods: Array<"merge" | "squash" | "rebase">;
  rulesEvidenceStatus: EvidenceStatus;
  rulesets?: unknown[];
  branchProtection?: unknown;
}

export interface GitHubCheckPayload {
  name: string;
  status: string;
  conclusion?: string | null;
  sha?: string;
  completedAt?: string;
  detailsUrl?: string;
}

export interface GitHubCommentPayload {
  id: string | number;
  author?: string;
  body: string;
}

export interface GitHubReviewPayload {
  id: string | number;
  reviewerId?: string;
  state: string;
  commitId?: string;
  body?: string;
}

export interface GitHubReviewThreadPayload {
  id: string;
  resolved: boolean;
  comments?: GitHubCommentPayload[];
}

export interface GitHubWorkflowRunPayload {
  id: string | number;
  name: string;
  status: string;
  conclusion?: string | null;
  headSha?: string;
  url?: string;
}

export interface GitHubPullRequestPayload {
  number: number;
  state: "open" | "closed" | "merged";
  draft?: boolean;
  base: string;
  baseSha?: string;
  head: string;
  headSha?: string;
  changedFiles?: string[];
  checks?: GitHubCheckPayload[];
  conversationComments?: GitHubCommentPayload[];
  reviews?: GitHubReviewPayload[];
  reviewThreads?: GitHubReviewThreadPayload[];
  workflowRuns?: GitHubWorkflowRunPayload[];
}

export interface GitHubReviewSnapshot {
  id: string;
  reviewerId?: string;
  decision: ReviewDecision;
  commitId?: string;
  body?: string;
  rawState: string;
}

export interface GitHubPullRequestSnapshot {
  number: number;
  state: GitHubPullRequestPayload["state"];
  draft: boolean;
  base: string;
  baseSha?: string;
  head: string;
  headSha?: string;
  changedFiles: string[];
  checks: Array<GitHubCheckPayload & { conclusion?: string }>;
  checksEvidenceStatus: EvidenceStatus;
  comments: GitHubCommentPayload[];
  commentsEvidenceStatus: EvidenceStatus;
  reviews: GitHubReviewSnapshot[];
  reviewsEvidenceStatus: EvidenceStatus;
  reviewThreads: GitHubReviewThreadPayload[];
  reviewThreadsEvidenceStatus: EvidenceStatus;
  unresolvedReviewThreadCount: number;
  workflowRuns: GitHubWorkflowRunPayload[];
  workflowRunsEvidenceStatus: EvidenceStatus;
}

function evidenceFor(value: unknown[] | undefined): EvidenceStatus {
  return value === undefined ? "unknown" : "proven";
}

function reviewDecision(state: string): ReviewDecision {
  switch (state.trim().toUpperCase()) {
    case "APPROVED": return "approve";
    case "CHANGES_REQUESTED": return "request_changes";
    default: return "comment";
  }
}

export function normalizeGitHubRepository(payload: GitHubRepositoryPayload): GitHubRepositorySnapshot {
  return {
    fullName: payload.repositoryFullName,
    defaultBranch: payload.defaultBranch,
    allowAutoMerge: payload.allowAutoMerge,
    mergeMethods: [...(payload.mergeMethods ?? [])],
    rulesEvidenceStatus: payload.rulesets !== undefined || payload.branchProtection !== undefined ? "proven" : "unknown",
    rulesets: payload.rulesets ? [...payload.rulesets] : undefined,
    branchProtection: payload.branchProtection,
  };
}

export function normalizeGitHubPullRequest(payload: GitHubPullRequestPayload): GitHubPullRequestSnapshot {
  const checks = (payload.checks ?? []).map((check) => ({
    ...check,
    conclusion: check.conclusion ?? undefined,
  }));
  const comments = (payload.conversationComments ?? []).map((comment) => ({ ...comment }));
  const reviews = (payload.reviews ?? []).map((review) => ({
    id: String(review.id),
    reviewerId: review.reviewerId,
    decision: reviewDecision(review.state),
    commitId: review.commitId,
    body: review.body,
    rawState: review.state,
  }));
  const reviewThreads = (payload.reviewThreads ?? []).map((thread) => ({
    ...thread,
    comments: thread.comments?.map((comment) => ({ ...comment })),
  }));
  const workflowRuns = (payload.workflowRuns ?? []).map((run) => ({ ...run }));

  return {
    number: payload.number,
    state: payload.state,
    draft: payload.draft ?? false,
    base: payload.base,
    baseSha: payload.baseSha,
    head: payload.head,
    headSha: payload.headSha,
    changedFiles: [...(payload.changedFiles ?? [])],
    checks,
    checksEvidenceStatus: evidenceFor(payload.checks),
    comments,
    commentsEvidenceStatus: evidenceFor(payload.conversationComments),
    reviews,
    reviewsEvidenceStatus: evidenceFor(payload.reviews),
    reviewThreads,
    reviewThreadsEvidenceStatus: evidenceFor(payload.reviewThreads),
    unresolvedReviewThreadCount: reviewThreads.filter((thread) => !thread.resolved).length,
    workflowRuns,
    workflowRunsEvidenceStatus: evidenceFor(payload.workflowRuns),
  };
}
