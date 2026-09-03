import { describe, expect, it } from "vitest";
import { normalizeVcsChange } from "../src/adapters/change-vcs.js";

describe("alternative VCS change normalization", () => {
  it("requires caller-proven logical identity for plain Git evidence", () => {
    expect(() => normalizeVcsChange({ kind: "git", commitSha: "a".repeat(40), active: true })).toThrow(/logical.*change/i);
    const result = normalizeVcsChange({ kind: "git", logicalChangeId: "chg-1", commitSha: "a".repeat(40), active: true });
    expect(result.logicalChangeId).toBe("chg-1");
    expect(result.physicalCommitSha).toBe("a".repeat(40));
  });

  it("preserves a stable Jujutsu-style change ID separately from the physical commit ID", () => {
    const result = normalizeVcsChange({
      kind: "jujutsu",
      changeId: "qsnkmzqv",
      commitId: "b".repeat(40),
      active: true,
      conflictState: "clean",
    });
    expect(result.logicalChangeId).toBe("qsnkmzqv");
    expect(result.physicalCommitSha).toBe("b".repeat(40));
  });

  it("does not turn a persisted conflict into resolved state", () => {
    const result = normalizeVcsChange({
      kind: "jujutsu",
      changeId: "abc",
      commitId: "c".repeat(40),
      active: true,
      conflictState: "conflicted",
    });
    expect(result.conflictState).toBe("conflicted");
    expect(result.safeToIntegrate).toBe(false);
  });
});
