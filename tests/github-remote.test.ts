import { describe, expect, it } from "vitest";
import { normalizeGitHubPullRequest, normalizeGitHubRepository } from "../src/adapters/github.js";

describe("GitHub host normalization", () => {
  it("normalizes repository metadata without inventing branch protection", () => {
    const repo = normalizeGitHubRepository({
      repositoryFullName: "acme/app",
      defaultBranch: "main",
      allowAutoMerge: false,
      mergeMethods: ["squash", "rebase"],
    });
    expect(repo.fullName).toBe("acme/app");
    expect(repo.defaultBranch).toBe("main");
    expect(repo.rulesEvidenceStatus).toBe("unknown");
  });

  it("normalizes PR head/base/check/review/thread evidence as distinct artifacts", () => {
    const pr = normalizeGitHubPullRequest({
      number: 42,
      state: "open",
      draft: false,
      base: "main",
      baseSha: "base123",
      head: "eng-42-fix",
      headSha: "head123",
      changedFiles: ["src/a.ts", "tests/a.test.ts"],
      checks: [
        { name: "CI / verify", status: "completed", conclusion: "success", sha: "head123", completedAt: "2026-09-03T10:00:00Z" },
      ],
      conversationComments: [{ id: "c1", author: "agent", body: "looks good" }],
      reviews: [{ id: "r1", reviewerId: "agent-b", state: "APPROVED", commitId: "head123" }],
      reviewThreads: [{ id: "t1", resolved: false, comments: [{ id: "rc1", body: "Fix this", author: "agent-c" }] }],
      workflowRuns: [{ id: 99, name: "CI", status: "completed", conclusion: "success", headSha: "head123" }],
    });

    expect(pr.headSha).toBe("head123");
    expect(pr.checks[0]?.conclusion).toBe("success");
    expect(pr.comments).toHaveLength(1);
    expect(pr.reviews[0]?.decision).toBe("approve");
    expect(pr.reviewThreads[0]?.resolved).toBe(false);
    expect(pr.unresolvedReviewThreadCount).toBe(1);
    expect(pr.comments[0]?.body).toBe("looks good");
    expect(pr.comments[0]).not.toHaveProperty("decision");
  });

  it("preserves missing check/review fields as unknown rather than success", () => {
    const pr = normalizeGitHubPullRequest({ number: 1, state: "open", base: "main", head: "x" });
    expect(pr.headSha).toBeUndefined();
    expect(pr.checksEvidenceStatus).toBe("unknown");
    expect(pr.reviewsEvidenceStatus).toBe("unknown");
  });
});
