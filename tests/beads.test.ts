import { describe, expect, it } from "vitest";
import { assessBeadsConcurrency, parseBeadsCapabilities } from "../src/adapters/beads.js";

describe("Beads discovery", () => {
  it("feature-detects commands instead of assuming a fixed bd version", () => {
    const caps = parseBeadsCapabilities(`Usage: bd <command>\nCommands:\n  ready\n  list\n  doctor\n  update\n`);
    expect(caps.has("ready")).toBe(true);
    expect(caps.has("doctor")).toBe(true);
    expect(caps.has("dolt")).toBe(false);
  });

  it("does not treat unknown storage mode as multi-agent safe", () => {
    const result = assessBeadsConcurrency({
      installed: true,
      projectPresent: true,
      storageMode: "unknown",
      capabilities: [],
      serverHealthy: undefined,
    });
    expect(result.safeConcurrentWrites).toBe(false);
  });

  it("requires explicit healthy server evidence for shared writes", () => {
    expect(assessBeadsConcurrency({ installed: true, projectPresent: true, storageMode: "shared_server", capabilities: [], serverHealthy: true }).safeConcurrentWrites).toBe(true);
    expect(assessBeadsConcurrency({ installed: true, projectPresent: true, storageMode: "shared_server", capabilities: [], serverHealthy: undefined }).safeConcurrentWrites).toBe(false);
  });
});
