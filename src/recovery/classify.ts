import type { PrCiFailureClassification } from "./ci-baseline.js";
import type { RecoveryClassification } from "./types.js";

export interface PullRequestRecoveryInput {
  id: string;
  state: "open" | "closed" | "merged" | "draft";
  trackerStatus?: string;
  duplicateOf?: string;
  supersededBy?: string[];
  ciFailure?: PrCiFailureClassification;
  conflicted?: boolean;
  linkedWorkItemExists?: boolean;
  updatedAt?: string;
  staleBefore?: string;
  abandoned?: boolean;
  explicitCurrent?: boolean;
  productionActive?: boolean;
  salvageable?: boolean;
  unsafeToSalvage?: boolean;
}

export interface ClassificationReason {
  label: RecoveryClassification;
  reason: string;
  evidence?: Record<string, unknown>;
}

export interface PullRequestClassificationResult {
  id: string;
  labels: RecoveryClassification[];
  reasons: ClassificationReason[];
}

function trackerOpen(status: string | undefined): boolean {
  if (!status) return false;
  return !new Set(["done", "closed", "canceled", "cancelled", "completed"]).has(status.trim().toLowerCase());
}

function trackerDone(status: string | undefined): boolean {
  if (!status) return false;
  return new Set(["done", "closed", "completed"]).has(status.trim().toLowerCase());
}

export function classifyPullRequest(input: PullRequestRecoveryInput): PullRequestClassificationResult {
  const reasons: ClassificationReason[] = [];
  const add = (label: RecoveryClassification, reason: string, evidence?: Record<string, unknown>) => {
    if (reasons.some((entry) => entry.label === label)) return;
    reasons.push({ label, reason, evidence });
  };

  if (input.duplicateOf) add("duplicate", `${input.id} is explicitly marked duplicate of ${input.duplicateOf}.`, { duplicateOf: input.duplicateOf });
  if ((input.supersededBy?.length ?? 0) > 0) add("superseded", `${input.id} has explicit superseding artifacts.`, { supersededBy: input.supersededBy });

  if (input.ciFailure === "baseline_broken") add("failed_baseline_ci", "The PR reproduces an active default-branch CI baseline failure.");
  else if (input.ciFailure === "pr_specific") add("failed_pr_specific", "The PR has a failure not attributed to the current default-branch baseline.");

  if (input.conflicted) add("conflicted", "The PR has an observed merge conflict.");
  if (input.linkedWorkItemExists === false) add("orphaned", "No authoritative linked work item is currently proven.");
  if (input.updatedAt && input.staleBefore && input.updatedAt < input.staleBefore) {
    add("stale", "The PR update timestamp predates the supplied recovery staleness threshold.", { updatedAt: input.updatedAt, staleBefore: input.staleBefore });
  }
  if (input.abandoned) add("abandoned", "The artifact is explicitly evidenced as abandoned.");
  if (input.productionActive) add("production_active", "Runtime evidence identifies this artifact/revision as active in production.");
  if (input.salvageable) add("salvageable", "Evidence identifies reusable work that can be selectively salvaged.");
  if (input.unsafeToSalvage) add("unsafe_to_salvage", "Evidence indicates salvage would carry unacceptable or unresolved risk.");

  if (input.state === "merged" && trackerOpen(input.trackerStatus)) {
    add("merged_but_tracker_open", "The PR is merged while the linked tracker item remains open/in progress.", { trackerStatus: input.trackerStatus });
  }
  if (input.state !== "merged" && trackerDone(input.trackerStatus)) {
    add("tracker_done_but_unmerged", "The tracker item is done while the PR is not merged.", { trackerStatus: input.trackerStatus, prState: input.state });
  }

  if (input.explicitCurrent) add("current", "The recovery snapshot explicitly identifies this PR as current work.");
  if (reasons.length === 0) add("unknown", "Available evidence does not establish a stronger recovery classification.");

  return { id: input.id, labels: reasons.map((entry) => entry.label), reasons };
}
