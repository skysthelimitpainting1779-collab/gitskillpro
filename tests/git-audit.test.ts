import { describe, expect, it } from "vitest";
import { auditGit } from "../src/audits/git.js";

describe("git audit", () => {
  it("flags unexplained dirty work as a collision risk instead of suggesting destructive cleanup", () => {
    const result = auditGit({ branch: "main", headSha: "abc", dirty: true, detached: false, worktrees: [] });
    expect(result.findings.some((finding) => finding.code === "UNEXPLAINED_DIRTY_WORK")).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/reset --hard/i);
    expect(JSON.stringify(result)).not.toMatch(/git clean/i);
  });

  it("flags detached HEAD as an integration risk", () => {
    const result = auditGit({ branch: null, headSha: "abc", dirty: false, detached: true, worktrees: [] });
    expect(result.findings.some((finding) => finding.code === "DETACHED_HEAD")).toBe(true);
  });

  it("warns when the same branch is observed in multiple worktrees", () => {
    const result = auditGit({
      branch: "main",
      headSha: "abc",
      dirty: false,
      detached: false,
      worktrees: [
        { path: "/a", branch: "task", headSha: "1" },
        { path: "/b", branch: "task", headSha: "1" },
      ],
    });
    expect(result.findings.some((finding) => finding.code === "DUPLICATE_WORKTREE_BRANCH")).toBe(true);
  });

  it("separates shallow-history uncertainty from application-code health", () => {
    const result = auditGit({ branch: "main", headSha: "abc", dirty: false, detached: false, worktrees: [], shallow: true });
    expect(result.findings.some((finding) => finding.code === "SHALLOW_REPOSITORY")).toBe(true);
  });
});
