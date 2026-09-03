import { describe, expect, it } from "vitest";
import { evaluateAutomationAuthority } from "../src/automation/policy.js";
import type { AutomationActor } from "../src/automation/types.js";

const checkpointActor: AutomationActor = {
  id: "agent-checkpoint",
  kind: "checkpoint",
  source: "scripts/checkpoint.mjs",
  trigger: "agent_checkpoint",
  authorities: ["auto-stage", "auto-commit"],
  allowedBranches: ["agent/*"],
  allowedPaths: ["src/**", "tests/**"],
  requireIsolatedWorktree: true,
};

describe("automation authority", () => {
  it("does not infer push, PR, review, merge or deploy from commit authority", () => {
    expect(evaluateAutomationAuthority(checkpointActor, "auto-commit").allowed).toBe(true);
    for (const capability of ["auto-push", "auto-pr", "auto-review", "auto-merge", "auto-deploy"] as const) {
      expect(evaluateAutomationAuthority(checkpointActor, capability).allowed, capability).toBe(false);
    }
  });

  it("requires both auto-stage and auto-commit for a checkpoint commit plan", () => {
    const commitOnly: AutomationActor = { ...checkpointActor, authorities: ["auto-commit"] };
    const result = evaluateAutomationAuthority(commitOnly, "checkpoint-commit");
    expect(result.allowed).toBe(false);
    expect(result.missing).toContain("auto-stage");
  });

  it("does not allow an automation actor to exceed its branch or path scope", () => {
    expect(evaluateAutomationAuthority(checkpointActor, "auto-commit", {
      branch: "main",
      paths: ["src/a.ts"],
    }).allowed).toBe(false);

    expect(evaluateAutomationAuthority(checkpointActor, "auto-commit", {
      branch: "agent/eng-42",
      paths: [".env"],
    }).allowed).toBe(false);
  });

  it("allows explicitly scoped commit authority on the matching branch and paths", () => {
    const result = evaluateAutomationAuthority(checkpointActor, "checkpoint-commit", {
      branch: "agent/eng-42",
      paths: ["src/a.ts", "tests/a.test.ts"],
      isolatedWorktree: true,
    });
    expect(result.allowed).toBe(true);
    expect(result.missing).toEqual([]);
  });
});
