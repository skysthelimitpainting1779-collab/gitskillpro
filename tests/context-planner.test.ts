import { describe, expect, it } from "vitest";
import { planContext } from "../src/context/planner.js";

describe("context budget planner", () => {
  it("keeps required R3 evidence even when it exceeds the nominal token budget", () => {
    const result = planContext({
      risk: "R3",
      tokenBudget: 120,
      items: [
        { id: "scope", kind: "scope", estimatedTokens: 40, required: true, reason: "task scope" },
        { id: "acceptance", kind: "acceptance", estimatedTokens: 50, required: true, reason: "definition of done" },
        { id: "rollback", kind: "recovery", estimatedTokens: 80, required: true, reason: "R3 rollback evidence" },
        { id: "old-thread", kind: "history", estimatedTokens: 400, required: false, priority: 1, reason: "background" },
      ],
    });

    expect(result.included.map((item) => item.id)).toEqual(["scope", "acceptance", "rollback"]);
    expect(result.deferred.map((item) => item.id)).toContain("old-thread");
    expect(result.estimatedTokens).toBe(170);
    expect(result.budgetExceededForRequiredEvidence).toBe(true);
  });

  it("defers lower-value optional material before higher-priority optional evidence", () => {
    const result = planContext({
      risk: "R1",
      tokenBudget: 160,
      items: [
        { id: "task", kind: "scope", estimatedTokens: 60, required: true, reason: "task" },
        { id: "diff", kind: "diff", estimatedTokens: 80, required: false, priority: 100, reason: "current diff" },
        { id: "history", kind: "history", estimatedTokens: 100, required: false, priority: 10, reason: "old history" },
      ],
    });

    expect(result.included.map((item) => item.id)).toEqual(["task", "diff"]);
    expect(result.deferred.map((item) => item.id)).toEqual(["history"]);
  });

  it("preserves unresolved blockers as required context", () => {
    const result = planContext({
      risk: "R0",
      tokenBudget: 40,
      items: [
        { id: "blocker", kind: "unknown", estimatedTokens: 60, required: false, unresolved: true, reason: "deployment revision unknown" },
      ],
    });

    expect(result.included[0]?.id).toBe("blocker");
    expect(result.included[0]?.effectiveRequired).toBe(true);
  });
});
