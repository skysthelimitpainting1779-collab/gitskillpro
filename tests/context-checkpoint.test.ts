import { describe, expect, it } from "vitest";
import { buildSubagentPacket, createCheckpoint } from "../src/context/checkpoint.js";

describe("context checkpoints", () => {
  it("preserves unresolved unknowns without promoting them to accepted facts", () => {
    const checkpoint = createCheckpoint({
      scope: { repo: "o/r", issueId: "ENG-42" },
      acceptedFacts: ["PR #12 targets main"],
      evidenceRefs: ["github:pr:12"],
      decisions: ["Inspect CI before editing source"],
      unknowns: ["Production deployment revision is unknown"],
      nextAction: "Inspect deployment provider evidence",
    });

    expect(checkpoint.acceptedFacts).not.toContain("Production deployment revision is unknown");
    expect(checkpoint.unknowns).toContain("Production deployment revision is unknown");
  });

  it("rejects the same statement being both accepted and unresolved", () => {
    expect(() => createCheckpoint({
      scope: { repo: "o/r" },
      acceptedFacts: ["Database rollback is compatible"],
      evidenceRefs: [],
      decisions: [],
      unknowns: ["Database rollback is compatible"],
      nextAction: "verify",
    })).toThrow(/accepted.*unknown|unknown.*accepted/i);
  });

  it("computes a delta against the previous checkpoint", () => {
    const first = createCheckpoint({
      scope: { repo: "o/r" },
      acceptedFacts: ["main CI is broken"],
      evidenceRefs: ["ci:100"],
      decisions: [],
      unknowns: ["root cause unknown"],
      nextAction: "inspect failed job",
    });
    const second = createCheckpoint({
      scope: { repo: "o/r" },
      acceptedFacts: ["main CI is broken", "typecheck is the failing step"],
      evidenceRefs: ["ci:100", "job:200"],
      decisions: ["repair CI baseline first"],
      unknowns: [],
      nextAction: "repair typecheck baseline",
      previous: first,
    });

    expect(second.delta?.factsAdded).toEqual(["typecheck is the failing step"]);
    expect(second.delta?.unknownsResolved).toEqual(["root cause unknown"]);
  });

  it("builds a bounded subagent packet without supervisor transcript history", () => {
    const checkpoint = createCheckpoint({
      scope: { repo: "o/r", issueId: "ENG-42" },
      acceptedFacts: ["head is abc"],
      evidenceRefs: ["git:abc", "ci:22"],
      decisions: ["use isolated worktree"],
      unknowns: ["deployment impact unknown"],
      nextAction: "implement task",
    });
    const packet = buildSubagentPacket(checkpoint, {
      task: "Implement parser fix",
      acceptanceCriteria: ["tests pass", "no unrelated files change"],
      relevantEvidenceRefs: ["git:abc"],
    });

    expect(packet.task).toBe("Implement parser fix");
    expect(packet.evidenceRefs).toEqual(["git:abc"]);
    expect(JSON.stringify(packet)).not.toMatch(/transcript|conversation history/i);
  });
});
