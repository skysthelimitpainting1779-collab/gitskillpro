import type { GitHubPullRequestSnapshot } from "../adapters/github.js";
import type { RiskTier } from "../core/types.js";
import { compareRisk } from "../core/operation.js";
import { assessReviewEvidence } from "../work/review.js";

export type ImplicationStatus = "none" | "resolved" | "blocking" | "unknown";

export interface PullRequestAuditInput {
  pr: GitHubPullRequestSnapshot;
  risk: RiskTier;
  expectedHeadSha?: string;
  expectedBaseSha?: string;
  requiredChecks: string[];
  implementerId: string;
  deploymentImplication?: ImplicationStatus;
  databaseImplication?: ImplicationStatus;
  rollbackPlan?: string;
}

export interface PullRequestFinding {
  code:
    | "HEAD_UNKNOWN"
    | "HEAD_MOVED"
    | "BASE_MOVED"
    | "CHECK_EVIDENCE_UNKNOWN"
    | "REQUIRED_CHECK_MISSING"
    | "REQUIRED_CHECK_NOT_SUCCESS"
    | "CHECK_STALE_FOR_HEAD"
    | "REVIEW_EVIDENCE_UNKNOWN"
    | "INDEPENDENT_REVIEW_INCOMPLETE"
    | "UNRESOLVED_REVIEW_THREAD"
    | "REVIEW_THREAD_EVIDENCE_UNKNOWN"
    | "DEPLOYMENT_IMPLICATION_UNKNOWN"
    | "DEPLOYMENT_IMPLICATION_BLOCKING"
    | "DATABASE_IMPLICATION_UNKNOWN"
    | "DATABASE_IMPLICATION_BLOCKING"
    | "ROLLBACK_PLAN_MISSING";
  severity: "warning" | "error";
  observation: string;
}

export interface PullRequestAuditResult {
  mergeReady: boolean;
  findings: PullRequestFinding[];
  currentHeadSha?: string;
  currentBaseSha?: string;
}

export function auditPullRequest(input: PullRequestAuditInput): PullRequestAuditResult {
  const findings: PullRequestFinding[] = [];
  const add = (code: PullRequestFinding["code"], observation: string, severity: PullRequestFinding["severity"] = "error") => {
    findings.push({ code, observation, severity });
  };

  if (!input.pr.headSha) add("HEAD_UNKNOWN", "Current PR head SHA is not proven.");
  if (input.expectedHeadSha && input.pr.headSha && input.expectedHeadSha !== input.pr.headSha) {
    add("HEAD_MOVED", `Expected PR head ${input.expectedHeadSha}, observed ${input.pr.headSha}; previous review/check assumptions are stale.`);
  }
  if (input.expectedBaseSha && input.pr.baseSha && input.expectedBaseSha !== input.pr.baseSha) {
    add("BASE_MOVED", `Expected base ${input.expectedBaseSha}, observed ${input.pr.baseSha}; integration assumptions require refresh.`);
  }

  if (input.pr.checksEvidenceStatus !== "proven") {
    add("CHECK_EVIDENCE_UNKNOWN", "Required-check evidence is not proven from the supplied GitHub snapshot.");
  } else {
    for (const required of input.requiredChecks) {
      const check = input.pr.checks.find((candidate) => candidate.name === required);
      if (!check) {
        add("REQUIRED_CHECK_MISSING", `Required check ${required} is absent from the supplied current check set.`);
        continue;
      }
      if (check.conclusion !== "success") {
        add("REQUIRED_CHECK_NOT_SUCCESS", `Required check ${required} conclusion is ${check.conclusion ?? "unknown"}.`);
      }
      if (input.pr.headSha && check.sha && check.sha !== input.pr.headSha) {
        add("CHECK_STALE_FOR_HEAD", `Required check ${required} was recorded for ${check.sha}, not current head ${input.pr.headSha}.`);
      }
    }
  }

  if (input.pr.reviewThreadsEvidenceStatus !== "proven") {
    if (compareRisk(input.risk, "R2") >= 0) add("REVIEW_THREAD_EVIDENCE_UNKNOWN", "Review-thread resolution state is not proven for this integration risk.");
  } else if (input.pr.unresolvedReviewThreadCount > 0) {
    add("UNRESOLVED_REVIEW_THREAD", `${input.pr.unresolvedReviewThreadCount} review thread(s) remain unresolved.`);
  }

  if (input.pr.reviewsEvidenceStatus !== "proven") {
    if (compareRisk(input.risk, "R2") >= 0) add("REVIEW_EVIDENCE_UNKNOWN", "Submitted code-review evidence is not proven for this integration risk.");
  } else {
    const assessment = assessReviewEvidence(input.risk, input.pr.reviews.map((review) => ({
      reviewerId: review.reviewerId ?? "unknown-reviewer",
      implementerId: input.implementerId,
      decision: review.decision,
    })));
    if (!assessment.complete) {
      add("INDEPENDENT_REVIEW_INCOMPLETE", assessment.findings.map((finding) => finding.observation).join(" "));
    }
  }

  if (compareRisk(input.risk, "R3") >= 0) {
    const deployment = input.deploymentImplication ?? "unknown";
    const database = input.databaseImplication ?? "unknown";

    if (deployment === "unknown") add("DEPLOYMENT_IMPLICATION_UNKNOWN", "R3+ change has unresolved deployment implications.");
    if (deployment === "blocking") add("DEPLOYMENT_IMPLICATION_BLOCKING", "Deployment evidence identifies a blocking implication.");
    if (database === "unknown") add("DATABASE_IMPLICATION_UNKNOWN", "R3+ change has unresolved database/migration implications.");
    if (database === "blocking") add("DATABASE_IMPLICATION_BLOCKING", "Database evidence identifies a blocking implication.");
    if (!input.rollbackPlan?.trim()) add("ROLLBACK_PLAN_MISSING", "R3+ change requires an explicit rollback or forward-fix strategy.");
  }

  return {
    mergeReady: findings.every((finding) => finding.severity !== "error"),
    findings,
    currentHeadSha: input.pr.headSha,
    currentBaseSha: input.pr.baseSha,
  };
}
