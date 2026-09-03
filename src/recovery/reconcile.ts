import type { ProjectWorkflowPolicy, SemanticWorkStatus, WorkDomain, WorkItem } from "../work/types.js";
import { assessCompletion, type CompletionState } from "../work/readiness.js";

export interface RecoveryPullRequestState {
  id: string;
  workItemId: string;
  state: "open" | "closed" | "merged" | "draft";
}

export interface ResolvedBlockerEvidence {
  workItemId: string;
  blockerId: string;
  evidence: string[];
}

export interface ReconciliationInput {
  workItems: readonly WorkItem[];
  pullRequests: readonly RecoveryPullRequestState[];
  completionPolicy: Pick<ProjectWorkflowPolicy, "completionRequires">;
  completionEvidence: Readonly<Record<string, CompletionState>>;
  resolvedBlockers?: readonly ResolvedBlockerEvidence[];
}

export interface ReconciliationProposal {
  code:
    | "TRACKER_DONE_PR_UNMERGED"
    | "TRACKER_DONE_DEFINITION_INCOMPLETE"
    | "MERGED_WORK_TRACKER_OPEN"
    | "BLOCKER_RESOLVED";
  targetId: string;
  provider: WorkItem["provider"];
  authorityDomain: WorkDomain;
  action: "set_status" | "remove_blocker";
  proposedStatus?: SemanticWorkStatus;
  blockerId?: string;
  reason: string;
  evidence: string[];
}

export interface ReconciliationResult {
  proposals: ReconciliationProposal[];
}

function domainFor(item: WorkItem): WorkDomain {
  return item.provider === "beads" ? "execution_graph" : "project_intent";
}

function activeStatus(status: SemanticWorkStatus): boolean {
  return status !== "done" && status !== "canceled";
}

export function reconcileProjectState(input: ReconciliationInput): ReconciliationResult {
  const proposals: ReconciliationProposal[] = [];
  const prsByWorkItem = new Map<string, RecoveryPullRequestState[]>();
  for (const pr of input.pullRequests) {
    const current = prsByWorkItem.get(pr.workItemId) ?? [];
    current.push(pr);
    prsByWorkItem.set(pr.workItemId, current);
  }

  for (const item of input.workItems) {
    const linkedPrs = prsByWorkItem.get(item.id) ?? [];
    const mergedPr = linkedPrs.find((pr) => pr.state === "merged");
    const activePr = linkedPrs.find((pr) => pr.state === "open" || pr.state === "draft");
    const completionState = input.completionEvidence[item.id] ?? {};
    const completion = assessCompletion(completionState, input.completionPolicy);

    if (item.status === "done" && linkedPrs.length > 0 && !mergedPr) {
      proposals.push({
        code: "TRACKER_DONE_PR_UNMERGED",
        targetId: item.id,
        provider: item.provider,
        authorityDomain: domainFor(item),
        action: "set_status",
        proposedStatus: activePr ? "in_review" : "ready",
        reason: "The tracker says done, but the linked PR set contains no merged PR.",
        evidence: linkedPrs.map((pr) => `${pr.id}:${pr.state}`),
      });
    }

    if (item.status === "done" && !completion.complete) {
      proposals.push({
        code: "TRACKER_DONE_DEFINITION_INCOMPLETE",
        targetId: item.id,
        provider: item.provider,
        authorityDomain: domainFor(item),
        action: "set_status",
        proposedStatus: mergedPr ? "deploying" : (activePr ? "in_review" : "in_progress"),
        reason: `Definition of Done is incomplete; missing gates: ${completion.missing.join(", ")}.`,
        evidence: completion.missing.map((gate) => `missing:${gate}`),
      });
    }

    if (mergedPr && activeStatus(item.status) && completion.complete) {
      proposals.push({
        code: "MERGED_WORK_TRACKER_OPEN",
        targetId: item.id,
        provider: item.provider,
        authorityDomain: domainFor(item),
        action: "set_status",
        proposedStatus: "done",
        reason: "Merged code and supplied completion evidence satisfy the configured Definition of Done while the tracker remains active.",
        evidence: [mergedPr.id, ...input.completionPolicy.completionRequires.map((gate) => `satisfied:${gate}`)],
      });
    }
  }

  for (const resolved of input.resolvedBlockers ?? []) {
    if (resolved.evidence.length === 0) continue;
    const item = input.workItems.find((candidate) => candidate.id === resolved.workItemId);
    if (!item || !item.blockers.includes(resolved.blockerId)) continue;
    proposals.push({
      code: "BLOCKER_RESOLVED",
      targetId: item.id,
      provider: item.provider,
      authorityDomain: domainFor(item),
      action: "remove_blocker",
      blockerId: resolved.blockerId,
      reason: `Blocker ${resolved.blockerId} has explicit resolved/merged evidence.`,
      evidence: [...resolved.evidence],
    });
  }

  return { proposals };
}
