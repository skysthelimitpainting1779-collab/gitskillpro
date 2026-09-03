import { describe, expect, it } from "vitest";
import { planGreenfieldBootstrap } from "../src/bootstrap/greenfield.js";

describe("greenfield bootstrap planning", () => {
  it("plans workflow infrastructure before feature implementation", () => {
    const plan = planGreenfieldBootstrap({ repositoryExists: true, workTracker: "linear", executionGraph: "beads" });
    expect(plan.steps.map((step) => step.id)).toEqual(expect.arrayContaining([
      "repo_instructions",
      "work_authority",
      "ci_baseline",
      "pr_policy",
      "definition_of_done",
      "proving_issue",
    ]));
    expect(plan.steps.at(-1)?.id).toBe("proving_issue");
  });

  it("does not invent license or maintainers", () => {
    const plan = planGreenfieldBootstrap({ repositoryExists: true });
    expect(plan.unknowns).toEqual(expect.arrayContaining(["license_policy", "maintainers"]));
  });

  it("records selected tracker/work-graph systems without making either canonical by name alone", () => {
    const plan = planGreenfieldBootstrap({ repositoryExists: true, workTracker: "linear", executionGraph: "beads" });
    expect(plan.inputs.workTracker).toBe("linear");
    expect(plan.inputs.executionGraph).toBe("beads");
    expect(plan.steps.find((step) => step.id === "work_authority")?.evidence).toContain("Explicit authority map required");
  });
});
