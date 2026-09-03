import { describe, expect, it } from "vitest";
import { analyzeAutomationLoops } from "../src/automation/loops.js";
import { verifyIdempotency } from "../src/automation/idempotency.js";

describe("automation loop analysis", () => {
  it("detects a workflow that triggers on push and pushes its own generated commit", () => {
    const result = analyzeAutomationLoops({
      actors: [{ id: "gen-ci", triggerEvents: ["push"], emittedEvents: ["push"], provenanceGuard: false, pathGuard: false, concurrencyGuard: false }],
    });
    expect(result.loops.some((loop) => loop.actorIds.includes("gen-ci"))).toBe(true);
    expect(result.safe).toBe(false);
  });

  it("does not call a guarded push workflow a proven loop when provenance prevents self-trigger", () => {
    const result = analyzeAutomationLoops({
      actors: [{ id: "gen-ci", triggerEvents: ["push"], emittedEvents: ["push"], provenanceGuard: true, pathGuard: false, concurrencyGuard: true }],
    });
    expect(result.loops).toEqual([]);
    expect(result.safe).toBe(true);
  });

  it("detects a multi-actor push cycle", () => {
    const result = analyzeAutomationLoops({
      actors: [
        { id: "a", triggerEvents: ["push:a"], emittedEvents: ["push:b"], provenanceGuard: false, pathGuard: false, concurrencyGuard: false },
        { id: "b", triggerEvents: ["push:b"], emittedEvents: ["push:a"], provenanceGuard: false, pathGuard: false, concurrencyGuard: false },
      ],
    });
    expect(result.loops.some((loop) => loop.actorIds.length === 2)).toBe(true);
  });
});

describe("automation idempotency", () => {
  it("passes when repeated identical inputs produce the same semantic output", () => {
    expect(verifyIdempotency({ inputHash: "in", firstOutputHash: "out", secondOutputHash: "out" }).idempotent).toBe(true);
  });

  it("reports non-idempotent output instead of normalizing the difference away", () => {
    const result = verifyIdempotency({ inputHash: "in", firstOutputHash: "out-1", secondOutputHash: "out-2" });
    expect(result.idempotent).toBe(false);
    expect(result.finding?.code).toBe("NON_IDEMPOTENT_AUTOMATION");
  });
});
