import { describe, expect, it } from "vitest";
import { compareRisk, isMutationRisk, planIntent } from "../src/core/operation.js";
import { evaluatePolicy } from "../src/core/policy.js";
import { classifyOperationRisk } from "../src/core/risk.js";

describe("risk vocabulary", () => {
  it("orders R0 through R4", () => {
    expect(compareRisk("R0", "R3")).toBeLessThan(0);
    expect(compareRisk("R4", "R3")).toBeGreaterThan(0);
  });

  it("treats R1+ as mutation risk", () => {
    expect(isMutationRisk("R0")).toBe(false);
    expect(isMutationRisk("R1")).toBe(true);
  });

  it("classifies production/database changes as R3 and destructive/security changes as R4", () => {
    expect(classifyOperationRisk({ database: true })).toBe("R3");
    expect(classifyOperationRisk({ security: true })).toBe("R4");
  });

  it("defaults unknown execution intents to high-risk planning only", () => {
    expect(planIntent("do something novel").risk).toBe("R3");
  });

  it("denies an R3 operation without explicit mutation authority", () => {
    const decision = evaluatePolicy(
      {
        intent: "merge-default",
        risk: "R3",
        requiredCapabilities: ["github.write"],
        preconditions: [],
        expectedState: {},
        steps: [],
        recovery: [],
      },
      { maxRisk: "R2", allowedCapabilities: ["github.write"] },
    );
    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toMatch(/exceeds/i);
  });

  it("allows read-only inspection with proven read capability", () => {
    const decision = evaluatePolicy(
      {
        intent: "inspect",
        risk: "R0",
        requiredCapabilities: ["git.local.read"],
        preconditions: [],
        expectedState: {},
        steps: [],
        recovery: [],
      },
      { maxRisk: "R0", allowedCapabilities: ["git.local.read"] },
    );
    expect(decision.allowed).toBe(true);
  });
});
