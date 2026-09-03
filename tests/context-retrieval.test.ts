import { describe, expect, it } from "vitest";
import { planRetrieval } from "../src/context/retrieval.js";

describe("progressive retrieval", () => {
  it("keeps CI retrieval narrow unless the failed-step evidence is unresolved", () => {
    expect(planRetrieval({ mode: "ci", unresolved: false }).steps.map((step) => step.kind)).toEqual([
      "workflow_run",
      "failed_job",
      "failed_step_excerpt",
    ]);

    expect(planRetrieval({ mode: "ci", unresolved: true }).steps.map((step) => step.kind)).toEqual([
      "workflow_run",
      "failed_job",
      "failed_step_excerpt",
      "wider_job_log",
    ]);
  });

  it("retrieves PR metadata and patches before wider repository context", () => {
    const plan = planRetrieval({ mode: "pr", unresolved: true });
    expect(plan.steps.map((step) => step.kind)).toEqual([
      "pr_metadata",
      "changed_filenames",
      "changed_file_patches",
      "related_source",
      "wider_repository",
    ]);
  });

  it("starts recovery with inventory metadata before expanding problematic clusters", () => {
    const plan = planRetrieval({ mode: "recovery", unresolved: true });
    expect(plan.steps[0]?.kind).toBe("inventory_metadata");
    expect(plan.steps[1]?.kind).toBe("problem_clusters");
    expect(plan.steps.at(-1)?.kind).toBe("exact_history_evidence");
  });

  it("plans docs retrieval from dependency version to one focused Context7 concept", () => {
    const plan = planRetrieval({ mode: "docs", unresolved: false, concept: "transaction retries" });
    expect(plan.steps.map((step) => step.kind)).toEqual([
      "dependency_version",
      "context7_library_resolution",
      "context7_concept_query",
    ]);
    expect(plan.steps.at(-1)?.query).toBe("transaction retries");
  });
});
