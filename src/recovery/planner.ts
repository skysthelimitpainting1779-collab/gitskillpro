import type { AuthorityMap, ProjectWorkflowPolicy, WorkItem } from "../work/types.js";
import type { CompletionState } from "../work/readiness.js";
import { auditWorkGraph } from "../audits/workgraph.js";
import { buildRecoveryEvidenceGraph } from "./evidence-graph.js";
import { classifyPrCiFailure, diagnoseCiBaseline, type CiRunEvidence } from "./ci-baseline.js";
import { classifyPullRequest, type PullRequestClassificationResult, type PullRequestRecoveryInput } from "./classify.js";
import { reconcileProjectState, type ReconciliationResult, type ResolvedBlockerEvidence } from "./reconcile.js";
import { planSalvage, type SalvagePlan } from "./salvage.js";
import { resolveSupersession, type SupersessionResolution } from "./supersession.js";
import type { RecoveryArtifact, RecoveryEdge, RecoveryEvidenceGraph } from "./types.js";

export interface ProjectRecoveryPrInput extends PullRequestRecoveryInput {
  workItemId?: string;
  ciRun?: CiRunEvidence;
  explicitSupersedes?: string[];
  replacementEvidence?: string[];
  selectedCommits?: string[];
  selectedFiles?: string[];
  architectureCurrent?: boolean;
  evidenceComplete?: boolean;
}

export interface ProjectRecoveryInput {
  artifacts: RecoveryArtifact[];
  edges: RecoveryEdge[];
  defaultBranchCiRuns: CiRunEvidence[];
  pullRequests: ProjectRecoveryPrInput[];
  workItems: WorkItem[];
  authorityMap?: AuthorityMap;
  completionPolicy: Pick<ProjectWorkflowPolicy, "completionRequires">;
  completionEvidence: Record<string, CompletionState>;
  resolvedBlockers?: ResolvedBlockerEvidence[];
  governanceFindings?: string[];
  deployment?: {
    activeRevision?: string;
    newestMergedRevision?: string;
    healthy?: boolean;
  };
  database?: {
    migrationVersion?: string;
    rollbackCompatibility?: "compatible" | "incompatible" | "unknown";
  };
}

export interface RecoveryLane {
  id:
    | "workgraph_reconciliation"
    | "ci_baseline_repair"
    | "governance_repair"
    | "pr_salvage_cleanup"
    | "deployment_database_reconciliation"
    | "proving_issue";
  title: string;
  dependsOn: string[];
  mutationScopes: string[];
  parallelizableWithDisjointScopes: boolean;
}

export interface CloseOrAbandonProposal {
  artifactId: string;
  action: "close_as_superseded" | "close_as_duplicate" | "mark_abandoned";
  reason: string;
  evidence: string[];
}

export interface ProjectRecoveryPlan {
  mode: "recovery";
  health: { state: "healthy" | "degraded" | "unhealthy"; reasons: string[] };
  evidenceGraph: RecoveryEvidenceGraph;
  ciBaseline: ReturnType<typeof diagnoseCiBaseline>;
  prClassifications: Record<string, PullRequestClassificationResult>;
  supersession: SupersessionResolution;
  salvagePlans: Record<string, SalvagePlan>;
  workGraphAudit: ReturnType<typeof auditWorkGraph>;
  reconciliation: ReconciliationResult;
  closeOrAbandonProposals: CloseOrAbandonProposal[];
  lanes: RecoveryLane[];
  unknowns: string[];
  recoveryWorkItems: Array<{ id: string; title: string; lane: RecoveryLane["id"] }>;
  mutationsPerformed: false;
}

export function planProjectRecovery(input: ProjectRecoveryInput): ProjectRecoveryPlan {
  const evidenceGraph = buildRecoveryEvidenceGraph({ artifacts: input.artifacts, edges: input.edges });
  const ciBaseline = diagnoseCiBaseline(input.defaultBranchCiRuns);

  const prClassifications: Record<string, PullRequestClassificationResult> = {};
  const salvagePlans: Record<string, SalvagePlan> = {};

  for (const pr of input.pullRequests) {
    const ciFailure = pr.ciRun ? classifyPrCiFailure(pr.ciRun, ciBaseline).classification : undefined;
    const linkedWorkItemExists = pr.workItemId
      ? input.workItems.some((item) => item.id === pr.workItemId)
      : pr.linkedWorkItemExists;

    const classification = classifyPullRequest({
      ...pr,
      ciFailure,
      linkedWorkItemExists,
    });
    prClassifications[pr.id] = classification;

    salvagePlans[pr.id] = planSalvage({
      artifactId: pr.id,
      classifications: classification.labels,
      selectedCommits: pr.selectedCommits,
      selectedFiles: pr.selectedFiles,
      architectureCurrent: pr.architectureCurrent,
      evidenceComplete: pr.evidenceComplete ?? false,
    });
  }

  const supersession = resolveSupersession(input.pullRequests.map((pr) => ({
    id: pr.id,
    workItemId: pr.workItemId,
    updatedAt: pr.updatedAt,
    explicitSupersedes: pr.explicitSupersedes,
    replacementEvidence: pr.replacementEvidence,
  })));

  const workGraphAudit = auditWorkGraph({ items: input.workItems, authorityMap: input.authorityMap });
  const reconciliation = reconcileProjectState({
    workItems: input.workItems,
    pullRequests: input.pullRequests
      .filter((pr): pr is ProjectRecoveryPrInput & { workItemId: string } => Boolean(pr.workItemId))
      .map((pr) => ({ id: pr.id, workItemId: pr.workItemId, state: pr.state })),
    completionPolicy: input.completionPolicy,
    completionEvidence: input.completionEvidence,
    resolvedBlockers: input.resolvedBlockers,
  });

  const closeOrAbandonProposals: CloseOrAbandonProposal[] = [];
  for (const [artifactId, result] of Object.entries(prClassifications)) {
    if (result.labels.includes("superseded")) {
      closeOrAbandonProposals.push({
        artifactId,
        action: "close_as_superseded",
        reason: `${artifactId} is classified superseded; preserve history and link its replacement before closure.`,
        evidence: result.reasons.filter((reason) => reason.label === "superseded").map((reason) => reason.reason),
      });
    } else if (result.labels.includes("duplicate")) {
      closeOrAbandonProposals.push({
        artifactId,
        action: "close_as_duplicate",
        reason: `${artifactId} is explicitly classified duplicate; preserve the canonical target link.`,
        evidence: result.reasons.filter((reason) => reason.label === "duplicate").map((reason) => reason.reason),
      });
    } else if (result.labels.includes("abandoned")) {
      closeOrAbandonProposals.push({
        artifactId,
        action: "mark_abandoned",
        reason: `${artifactId} has explicit abandonment evidence.`,
        evidence: result.reasons.filter((reason) => reason.label === "abandoned").map((reason) => reason.reason),
      });
    }
  }

  const reasons: string[] = [];
  const unknowns: string[] = [];

  if (ciBaseline.state === "baseline_broken") reasons.push("Default-branch CI baseline is broken; shared PR failures cannot be treated as source regressions until it is repaired.");
  if (!workGraphAudit.healthy) reasons.push("Work-graph reconciliation has material duplicate, supersession, blocker, stale-claim, or authority findings.");
  for (const finding of input.governanceFindings ?? []) reasons.push(`Repository governance finding: ${finding}`);

  if (Object.values(prClassifications).some((classification) => classification.labels.includes("failed_pr_specific"))) {
    reasons.push("At least one PR has a failure classified as PR-specific after comparison with the default-branch baseline.");
  }

  if (input.deployment?.activeRevision && input.deployment?.newestMergedRevision && input.deployment.activeRevision !== input.deployment.newestMergedRevision) {
    reasons.push(`Deployment active revision ${input.deployment.activeRevision} differs from newest merged revision ${input.deployment.newestMergedRevision}; runtime/code reconciliation is required.`);
  }

  if (input.database?.rollbackCompatibility === "unknown") {
    unknowns.push("database_rollback_compatibility");
  } else if (input.database?.rollbackCompatibility === "incompatible") {
    reasons.push("Database evidence says rollback compatibility is incompatible with an older application revision.");
  }

  for (const unknown of supersession.unknowns) unknowns.push(`supersession:${unknown}`);
  for (const finding of evidenceGraph.findings.filter((finding) => finding.severity !== "info")) unknowns.push(`evidence_graph:${finding.code}`);

  const lanes: RecoveryLane[] = [
    {
      id: "workgraph_reconciliation",
      title: "Reconcile tracker/work-graph authority, duplicates, claims and blockers",
      dependsOn: [],
      mutationScopes: ["work_management"],
      parallelizableWithDisjointScopes: true,
    },
    {
      id: "ci_baseline_repair",
      title: "Repair and prove the default-branch CI baseline",
      dependsOn: [],
      mutationScopes: ["ci_workflows"],
      parallelizableWithDisjointScopes: true,
    },
    {
      id: "governance_repair",
      title: "Repair repository rule/check wiring after the CI baseline is understood",
      dependsOn: ["ci_baseline_repair"],
      mutationScopes: ["repository_governance"],
      parallelizableWithDisjointScopes: false,
    },
    {
      id: "pr_salvage_cleanup",
      title: "Re-evaluate PRs, selectively salvage useful work and close only proven obsolete artifacts",
      dependsOn: ["ci_baseline_repair", "workgraph_reconciliation"],
      mutationScopes: ["branches", "pull_requests"],
      parallelizableWithDisjointScopes: false,
    },
    {
      id: "deployment_database_reconciliation",
      title: "Reconcile deployed revision, migration state and rollback/forward-fix compatibility",
      dependsOn: ["pr_salvage_cleanup"],
      mutationScopes: ["deployment", "database"],
      parallelizableWithDisjointScopes: false,
    },
    {
      id: "proving_issue",
      title: "Run one representative issue through the restored workflow",
      dependsOn: ["governance_repair", "pr_salvage_cleanup", "deployment_database_reconciliation"],
      mutationScopes: ["work_management", "branches", "pull_requests", "ci_workflows", "deployment", "database"],
      parallelizableWithDisjointScopes: false,
    },
  ];

  const recoveryWorkItems = lanes.map((lane, index) => ({
    id: `REC-${String(index + 1).padStart(2, "0")}`,
    title: lane.title,
    lane: lane.id,
  }));

  const healthState: ProjectRecoveryPlan["health"]["state"] = reasons.length > 0 ? "unhealthy" : (unknowns.length > 0 ? "degraded" : "healthy");

  return {
    mode: "recovery",
    health: { state: healthState, reasons },
    evidenceGraph,
    ciBaseline,
    prClassifications,
    supersession,
    salvagePlans,
    workGraphAudit,
    reconciliation,
    closeOrAbandonProposals,
    lanes,
    unknowns: [...new Set(unknowns)],
    recoveryWorkItems,
    mutationsPerformed: false,
  };
}
