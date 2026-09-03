import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { planProjectRecovery } from "../src/recovery/planner.js";

const fixture = JSON.parse(readFileSync("tests/fixtures/recovery/messy-project.json", "utf8"));

describe("project recovery planning", () => {
  it("builds ordered recovery lanes from a tangled project snapshot", () => {
    const plan = planProjectRecovery(fixture);
    expect(plan.health.state).toBe("unhealthy");
    expect(plan.ciBaseline.state).toBe("baseline_broken");
    expect(plan.lanes.map((lane) => lane.id)).toEqual([
      "workgraph_reconciliation",
      "ci_baseline_repair",
      "governance_repair",
      "pr_salvage_cleanup",
      "deployment_database_reconciliation",
      "proving_issue"
    ]);
  });

  it("separates baseline failures from a PR-specific failure", () => {
    const plan = planProjectRecovery(fixture);
    expect(plan.prClassifications["pr:10"]?.labels).toContain("failed_baseline_ci");
    expect(plan.prClassifications["pr:11"]?.labels).toContain("failed_baseline_ci");
    expect(plan.prClassifications["pr:20"]?.labels).toContain("failed_pr_specific");
  });

  it("preserves explicit supersession and creates selective salvage instead of merging stale work", () => {
    const plan = planProjectRecovery(fixture);
    expect(plan.supersession.edges).toContainEqual(expect.objectContaining({ from: "pr:11", to: "pr:10", explicit: true }));
    expect(plan.salvagePlans["pr:10"]?.strategy).toBe("rerun_after_baseline");
    expect(plan.closeOrAbandonProposals).toContainEqual(expect.objectContaining({ artifactId: "pr:10", reason: expect.stringMatching(/supersed/i) }));
  });

  it("surfaces deployment drift and unknown database rollback compatibility", () => {
    const plan = planProjectRecovery(fixture);
    expect(plan.unknowns).toContain("database_rollback_compatibility");
    expect(plan.health.reasons.join(" ")).toMatch(/deployment.*revision/i);
  });

  it("includes tracker reconciliation proposals without executing them", () => {
    const plan = planProjectRecovery(fixture);
    expect(plan.reconciliation.proposals.some((proposal) => proposal.code === "TRACKER_DONE_PR_UNMERGED")).toBe(true);
    expect(plan.mutationsPerformed).toBe(false);
  });
});
