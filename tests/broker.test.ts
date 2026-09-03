import { describe, expect, it } from "vitest";
import { CapabilityBroker } from "../src/core/capability-broker.js";
import type { CapabilityId } from "../src/core/types.js";

const caps = (...values: CapabilityId[]) => new Set<CapabilityId>(values);

describe("capability broker", () => {
  it("refuses an adapter that cannot prove a required fact", () => {
    const broker = new CapabilityBroker([
      { id: "github", priority: 100, capabilities: caps("github.read") },
    ]);
    expect(() => broker.select("inspect-local-status", ["git.local.read"])).toThrow(/no adapter/i);
  });

  it("selects the highest-priority semantically capable adapter", () => {
    const broker = new CapabilityBroker([
      { id: "fallback", priority: 10, capabilities: caps("github.read") },
      { id: "native", priority: 100, capabilities: caps("github.read") },
    ]);
    expect(broker.select("inspect-pr", ["github.read"]).id).toBe("native");
  });

  it("requires all requested capabilities", () => {
    const broker = new CapabilityBroker([
      { id: "read-only", priority: 100, capabilities: caps("github.read") },
      { id: "read-write", priority: 10, capabilities: caps("github.read", "github.write") },
    ]);
    expect(broker.select("update-pr", ["github.read", "github.write"]).id).toBe("read-write");
  });
});
