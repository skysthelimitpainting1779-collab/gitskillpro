import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { planProjectRecovery } from "../src/index.js";

const fixture = JSON.parse(readFileSync("tests/fixtures/recovery/messy-project.json", "utf8"));

describe("recovery public API acceptance", () => {
  it("turns a tangled project snapshot into an evidence-backed non-mutating recovery plan", () => {
    const plan = planProjectRecovery(fixture);

    expect(plan.mode).toBe("recovery");
    expect(plan.mutationsPerformed).toBe(false);
    expect(plan.ciBaseline.state).toBe("baseline_broken");
    expect(plan.prClassifications["pr:20"]?.labels).toContain("failed_pr_specific");
    expect(plan.supersession.edges).toContainEqual(expect.objectContaining({ from: "pr:11", to: "pr:10", explicit: true }));
    expect(plan.lanes.at(-1)?.id).toBe("proving_issue");
    expect(plan.unknowns).toContain("database_rollback_compatibility");
  });
});
