import { describe, expect, it } from "vitest";
import { buildChangeGraph, currentChangeVersion, validateChangeGraph } from "../src/change/graph.js";

describe("logical Change Graph", () => {
  it("keeps a stable logical change identity across physical commit replacement", () => {
    const graph = buildChangeGraph({
      changes: [{
        id: "chg-auth",
        title: "Add auth guard",
        versions: [
          { versionId: "v1", commitSha: "a".repeat(40), createdAt: "2026-09-03T10:00:00Z", active: false },
          { versionId: "v2", commitSha: "b".repeat(40), createdAt: "2026-09-03T11:00:00Z", active: true },
        ],
      }],
      dependencies: [],
    });
    expect(graph.changes[0]?.id).toBe("chg-auth");
    expect(currentChangeVersion(graph, "chg-auth")?.commitSha).toBe("b".repeat(40));
  });

  it("rejects more than one active physical version for the same logical change", () => {
    const result = validateChangeGraph(buildChangeGraph({
      changes: [{
        id: "chg-1",
        title: "one",
        versions: [
          { versionId: "a", commitSha: "a".repeat(40), active: true },
          { versionId: "b", commitSha: "b".repeat(40), active: true },
        ],
      }],
      dependencies: [],
    }));
    expect(result.valid).toBe(false);
    expect(result.findings.map((f) => f.code)).toContain("MULTIPLE_ACTIVE_CHANGE_VERSIONS");
  });

  it("detects dependency cycles", () => {
    const result = validateChangeGraph(buildChangeGraph({
      changes: [
        { id: "a", title: "A", versions: [{ versionId: "1", commitSha: "a".repeat(40), active: true }] },
        { id: "b", title: "B", versions: [{ versionId: "1", commitSha: "b".repeat(40), active: true }] },
      ],
      dependencies: [
        { from: "a", to: "b", kind: "depends_on" },
        { from: "b", to: "a", kind: "depends_on" },
      ],
    }));
    expect(result.findings.some((f) => f.code === "CHANGE_DEPENDENCY_CYCLE")).toBe(true);
  });

  it("preserves explicit supersession instead of deleting old changes", () => {
    const graph = buildChangeGraph({
      changes: [
        { id: "old", title: "old", versions: [{ versionId: "1", commitSha: "a".repeat(40), active: false }], supersededBy: "new" },
        { id: "new", title: "new", versions: [{ versionId: "1", commitSha: "b".repeat(40), active: true }] },
      ],
      dependencies: [],
    });
    expect(graph.changes.find((c) => c.id === "old")?.supersededBy).toBe("new");
    expect(graph.changes).toHaveLength(2);
  });
});
