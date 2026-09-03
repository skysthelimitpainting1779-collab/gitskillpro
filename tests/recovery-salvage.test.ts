import { describe, expect, it } from "vitest";
import { planSalvage } from "../src/recovery/salvage.js";

describe("recovery salvage planning", () => {
  it("salvages selected commits onto a fresh branch instead of merging a stale branch wholesale", () => {
    const plan = planSalvage({
      artifactId: "pr:old",
      classifications: ["stale", "salvageable"],
      selectedCommits: ["abc123", "def456"],
      architectureCurrent: true,
      evidenceComplete: true,
    });
    expect(plan.strategy).toBe("fresh_branch_cherry_pick");
    expect(plan.selectedCommits).toEqual(["abc123", "def456"]);
    expect(plan.steps.join(" ")).not.toMatch(/merge.*stale/i);
  });

  it("reimplements from current intent when the old architecture is obsolete", () => {
    const plan = planSalvage({
      artifactId: "pr:obsolete",
      classifications: ["stale", "salvageable"],
      architectureCurrent: false,
      evidenceComplete: true,
    });
    expect(plan.strategy).toBe("reimplement_current_spec");
  });

  it("reruns after baseline repair when the only material failure is shared CI", () => {
    const plan = planSalvage({
      artifactId: "pr:ci-only",
      classifications: ["failed_baseline_ci"],
      architectureCurrent: true,
      evidenceComplete: true,
    });
    expect(plan.strategy).toBe("rerun_after_baseline");
  });

  it("holds when evidence or salvage safety is unknown", () => {
    expect(planSalvage({ artifactId: "pr:unknown", classifications: ["unknown"], evidenceComplete: false }).strategy).toBe("hold_unknown");
    expect(planSalvage({ artifactId: "pr:unsafe", classifications: ["unsafe_to_salvage"], evidenceComplete: true }).strategy).toBe("no_salvage");
  });
});
