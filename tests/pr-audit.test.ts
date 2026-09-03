import { describe, expect, it } from "vitest";
import { auditPullRequest } from "../src/audits/pr.js";
import type { GitHubPullRequestSnapshot } from "../src/adapters/github.js";

function basePr(overrides: Partial<GitHubPullRequestSnapshot> = {}): GitHubPullRequestSnapshot {
  return {
    number: 42,
    state: "open",
    draft: false,
    base: "main",
    baseSha: "base123",
    head: "eng-42",
    headSha: "head123",
    changedFiles: ["src/a.ts"],
    checks: [{ name: "CI / verify", status: "completed", conclusion: "success", sha: "head123", completedAt: "2026-09-03T10:00:00Z" }],
    checksEvidenceStatus: "proven",
    comments: [],
    commentsEvidenceStatus: "proven",
    reviews: [{ id: "r1", reviewerId: "reviewer-b", decision: "approve", commitId: "head123", rawState: "APPROVED" }],
    reviewsEvidenceStatus: "proven",
    reviewThreads: [],
    reviewThreadsEvidenceStatus: "proven",
    unresolvedReviewThreadCount: 0,
    workflowRuns: [],
    workflowRunsEvidenceStatus: "proven",
    ...overrides,
  };
}

describe("autonomous PR audit", () => {
  it("rejects stale expected head state", () => {
    const result = auditPullRequest({ pr: basePr(), risk: "R2", expectedHeadSha: "older", requiredChecks: ["CI / verify"], implementerId: "agent-a" });
    expect(result.mergeReady).toBe(false);
    expect(result.findings.map((finding) => finding.code)).toContain("HEAD_MOVED");
  });

  it("rejects a missing required check", () => {
    const result = auditPullRequest({ pr: basePr(), risk: "R2", expectedHeadSha: "head123", requiredChecks: ["CI / verify", "security"], implementerId: "agent-a" });
    expect(result.findings.map((finding) => finding.code)).toContain("REQUIRED_CHECK_MISSING");
  });

  it("rejects unresolved review threads", () => {
    const result = auditPullRequest({ pr: basePr({ unresolvedReviewThreadCount: 1 }), risk: "R2", expectedHeadSha: "head123", requiredChecks: ["CI / verify"], implementerId: "agent-a" });
    expect(result.findings.map((finding) => finding.code)).toContain("UNRESOLVED_REVIEW_THREAD");
  });

  it("requires independent R3 review", () => {
    const result = auditPullRequest({
      pr: basePr({ reviews: [{ id: "r1", reviewerId: "agent-a", decision: "approve", commitId: "head123", rawState: "APPROVED" }] }),
      risk: "R3",
      expectedHeadSha: "head123",
      requiredChecks: ["CI / verify"],
      implementerId: "agent-a",
      deploymentImplication: "resolved",
      databaseImplication: "resolved",
      rollbackPlan: "revert/forward-fix with provider-specific verification",
    });
    expect(result.findings.map((finding) => finding.code)).toContain("INDEPENDENT_REVIEW_INCOMPLETE");
  });

  it("does not treat green CI as sufficient when R3 deployment/database implications are unresolved", () => {
    const result = auditPullRequest({
      pr: basePr(),
      risk: "R3",
      expectedHeadSha: "head123",
      requiredChecks: ["CI / verify"],
      implementerId: "agent-a",
      deploymentImplication: "unknown",
      databaseImplication: "unknown",
      rollbackPlan: "provider-specific rollback pending",
    });
    expect(result.mergeReady).toBe(false);
    expect(result.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["DEPLOYMENT_IMPLICATION_UNKNOWN", "DATABASE_IMPLICATION_UNKNOWN"]));
  });

  it("can become merge-ready when all supplied R3 evidence is current and resolved", () => {
    const result = auditPullRequest({
      pr: basePr(),
      risk: "R3",
      expectedHeadSha: "head123",
      requiredChecks: ["CI / verify"],
      implementerId: "agent-a",
      deploymentImplication: "resolved",
      databaseImplication: "resolved",
      rollbackPlan: "revert code only if schema compatible; otherwise forward-fix",
    });
    expect(result.mergeReady).toBe(true);
  });
});
