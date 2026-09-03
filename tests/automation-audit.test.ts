import { describe, expect, it } from "vitest";
import { auditAutomation } from "../src/audits/automation.js";
import type { AutomationActor } from "../src/automation/types.js";

function actor(overrides: Partial<AutomationActor> = {}): AutomationActor {
  return {
    id: "bot",
    kind: "ci-bot",
    source: ".github/workflows/bot.yml",
    trigger: "push",
    authorities: [],
    ...overrides,
  };
}

describe("repository automation audit", () => {
  it("blocks auto-commit actors in a shared writable worktree by default", () => {
    const result = auditAutomation({
      actors: [actor({ authorities: ["auto-stage", "auto-commit"] })],
      sharedWritableWorktree: true,
      defaultBranch: "main",
    });
    expect(result.findings.some((f) => f.code === "AUTO_COMMIT_SHARED_WORKTREE" && f.severity === "error")).toBe(true);
  });

  it("flags broad staging and unexpected sensitive paths", () => {
    const result = auditAutomation({
      actors: [actor({ authorities: ["auto-stage", "auto-commit"], stagePolicy: "broad", allowedPaths: ["**"] })],
      sharedWritableWorktree: false,
      defaultBranch: "main",
      changedPaths: ["src/a.ts", ".env"],
    });
    expect(result.findings.some((f) => f.code === "BROAD_AUTO_STAGE")).toBe(true);
    expect(result.findings.some((f) => f.code === "SENSITIVE_PATH_IN_AUTOMATION_SCOPE")).toBe(true);
  });

  it("reports observed operations that exceed configured authority", () => {
    const result = auditAutomation({
      actors: [actor({ authorities: ["auto-commit"], observedOperations: ["commit", "push"] })],
      sharedWritableWorktree: false,
      defaultBranch: "main",
    });
    expect(result.findings.some((f) => f.code === "OBSERVED_AUTHORITY_ESCALATION" && /push/i.test(f.observation))).toBe(true);
  });

  it("blocks background direct push and force push to the default branch", () => {
    const result = auditAutomation({
      actors: [actor({
        authorities: ["auto-push"],
        observedOperations: ["force-push"],
        allowedBranches: ["main"],
      })],
      sharedWritableWorktree: false,
      defaultBranch: "main",
    });
    expect(result.findings.some((f) => f.code === "AUTOMATION_DEFAULT_BRANCH_PUSH")).toBe(true);
    expect(result.findings.some((f) => f.code === "AUTOMATION_FORCE_PUSH" && f.severity === "error")).toBe(true);
  });

  it("surfaces unknown active writers and hook bypass", () => {
    const result = auditAutomation({
      actors: [],
      sharedWritableWorktree: false,
      defaultBranch: "main",
      unknownWriterRisk: true,
      bypassHooks: true,
    });
    expect(result.findings.map((f) => f.code)).toContain("UNKNOWN_BACKGROUND_WRITER");
    expect(result.findings.map((f) => f.code)).toContain("HOOK_BYPASS");
  });
});
