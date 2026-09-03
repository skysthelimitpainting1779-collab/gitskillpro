import { describe, expect, it } from "vitest";
import {
  createEvidencePacket,
  isExpectedStateCurrent,
  recordAttempt,
  recordPersistenceProof,
} from "../src/core/evidence.js";

describe("evidence", () => {
  it("does not imply persistence from an attempted operation", () => {
    const packet = recordAttempt(
      createEvidencePacket({ operationId: "op-1", intent: "push" }),
      { action: "push", ok: true, summary: "provider call returned success" },
    );
    expect(packet.stage).toBe("attempted");
    expect(packet.persistence).toBeUndefined();
  });

  it("requires an explicit proof reference for persistence", () => {
    expect(() =>
      recordPersistenceProof(createEvidencePacket({ operationId: "op-2", intent: "push" }), {
        provider: "github",
        reference: "",
      }),
    ).toThrow(/reference/i);
  });

  it("records explicit persistence separately", () => {
    const packet = recordPersistenceProof(createEvidencePacket({ operationId: "op-3", intent: "push" }), {
      provider: "github",
      reference: "refs/heads/task@abc",
    });
    expect(packet.persistence?.reference).toBe("refs/heads/task@abc");
  });

  it("detects stale expected state", () => {
    expect(isExpectedStateCurrent({ headSha: "a" }, { headSha: "a" })).toBe(true);
    expect(isExpectedStateCurrent({ headSha: "a" }, { headSha: "b" })).toBe(false);
  });
});
