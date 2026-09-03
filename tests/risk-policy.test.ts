import { describe, expect, it } from "vitest";
import { compareRisk, isMutationRisk, planIntent } from "../src/core/operation.js";

describe("risk vocabulary", () => {
  it("orders R0 through R4", () => {
    expect(compareRisk("R0", "R3")).toBeLessThan(0);
    expect(compareRisk("R4", "R3")).toBeGreaterThan(0);
  });

  it("treats R1+ as mutation risk", () => {
    expect(isMutationRisk("R0")).toBe(false);
    expect(isMutationRisk("R1")).toBe(true);
  });

  it("defaults unknown execution intents to high-risk planning only", () => {
    expect(planIntent("do something novel").risk).toBe("R3");
  });
});
