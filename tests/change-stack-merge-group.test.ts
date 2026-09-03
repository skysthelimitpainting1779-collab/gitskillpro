import { describe, expect, it } from "vitest";
import { auditChangeStack } from "../src/change/stack.js";
import { auditMergeGroup } from "../src/audits/merge-group.js";

describe("stacked change audit", () => {
  it("marks an upper layer stale when its recorded lower-layer head no longer matches", () => {
    const result = auditChangeStack({
      layers: [
        { changeId: "base", prNumber: 10, headSha: "a".repeat(40), dependencyHeads: {} },
        { changeId: "upper", prNumber: 11, headSha: "b".repeat(40), dependencyHeads: { base: "a".repeat(40) } },
      ],
      currentHeads: { base: "c".repeat(40), upper: "b".repeat(40) },
    });
    expect(result.findings.some((f) => f.code === "STALE_STACK_DEPENDENCY" && f.changeId === "upper")).toBe(true);
  });

  it("accepts a stack whose recorded dependency heads are current", () => {
    const result = auditChangeStack({
      layers: [
        { changeId: "base", prNumber: 10, headSha: "a".repeat(40), dependencyHeads: {} },
        { changeId: "upper", prNumber: 11, headSha: "b".repeat(40), dependencyHeads: { base: "a".repeat(40) } },
      ],
      currentHeads: { base: "a".repeat(40), upper: "b".repeat(40) },
    });
    expect(result.current).toBe(true);
  });
});

describe("merge-group audit", () => {
  it("does not reuse PR-head checks as merge-group proof", () => {
    const result = auditMergeGroup({
      mergeGroupRequired: true,
      prHeadSha: "a".repeat(40),
      mergeGroupSha: "b".repeat(40),
      requiredChecks: ["CI"],
      checks: [{ name: "CI", sha: "a".repeat(40), status: "success" }],
    });
    expect(result.ready).toBe(false);
    expect(result.findings.map((f) => f.code)).toContain("MISSING_MERGE_GROUP_CHECK");
  });

  it("requires successful checks on the exact merge-group SHA", () => {
    const sha = "b".repeat(40);
    const result = auditMergeGroup({
      mergeGroupRequired: true,
      prHeadSha: "a".repeat(40),
      mergeGroupSha: sha,
      requiredChecks: ["CI", "security"],
      checks: [
        { name: "CI", sha, status: "success" },
        { name: "security", sha, status: "success" },
      ],
    });
    expect(result.ready).toBe(true);
  });

  it("does not require merge-group evidence when the repository does not use that gate", () => {
    expect(auditMergeGroup({
      mergeGroupRequired: false,
      prHeadSha: "a".repeat(40),
      requiredChecks: [],
      checks: [],
    }).ready).toBe(true);
  });
});
