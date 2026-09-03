import { describe, expect, it } from "vitest";
import { auditWorkGraph } from "../src/audits/workgraph.js";

describe("work-graph audit", () => {
  it("flags two active work items that explicitly duplicate one another", () => {
    const result = auditWorkGraph({
      items: [
        { id: "B-1", provider: "beads", title: "A", status: "in_progress", blockers: [], duplicateOf: "B-2" },
        { id: "B-2", provider: "beads", title: "A2", status: "in_progress", blockers: [] },
      ],
    });
    expect(result.findings.some((finding) => finding.code === "ACTIVE_DUPLICATE_WORK")).toBe(true);
    expect(result.links.some((link) => link.kind === "duplicate" && link.sourceId === "B-1" && link.targetId === "B-2")).toBe(true);
  });

  it("flags a ready item that still has blockers", () => {
    const result = auditWorkGraph({
      items: [{ id: "B-3", provider: "beads", title: "Blocked", status: "ready", blockers: ["B-2"] }],
    });
    expect(result.findings.some((finding) => finding.code === "BLOCKED_BUT_READY")).toBe(true);
  });

  it("preserves unknown cross-tracker identity instead of linking similar names", () => {
    const result = auditWorkGraph({
      items: [
        { id: "L-1", provider: "linear", title: "Auth", status: "in_progress", blockers: [] },
        { id: "B-1", provider: "beads", title: "Auth", status: "ready", blockers: [] },
      ],
    });
    expect(result.links).toEqual([]);
  });
});
