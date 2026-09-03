import { describe, expect, it } from "vitest";
import { buildRecoveryEvidenceGraph } from "../src/recovery/evidence-graph.js";

describe("recovery evidence graph", () => {
  it("preserves explicit cross-layer links", () => {
    const graph = buildRecoveryEvidenceGraph({
      artifacts: [
        { id: "issue:ENG-42", type: "work_item", title: "Fix CI" },
        { id: "pr:12", type: "pull_request", title: "Fix CI" },
        { id: "commit:abc", type: "commit" },
        { id: "deploy:prod-1", type: "deployment" },
      ],
      edges: [
        { from: "issue:ENG-42", to: "pr:12", kind: "implements", explicit: true, evidence: ["linear-github-link"] },
        { from: "pr:12", to: "commit:abc", kind: "contains", explicit: true, evidence: ["github-pr-commit"] },
        { from: "commit:abc", to: "deploy:prod-1", kind: "deployed_as", explicit: true, evidence: ["provider-revision"] },
      ],
    });

    expect(graph.edges).toHaveLength(3);
    expect(graph.edges.every((edge) => edge.explicit)).toBe(true);
  });

  it("does not link same-title artifacts without evidence", () => {
    const graph = buildRecoveryEvidenceGraph({
      artifacts: [
        { id: "issue:ENG-1", type: "work_item", title: "Auth cleanup" },
        { id: "pr:99", type: "pull_request", title: "Auth cleanup" },
      ],
      edges: [],
    });

    expect(graph.edges).toEqual([]);
  });

  it("marks supplied inferred links as inferred and retains their evidence", () => {
    const graph = buildRecoveryEvidenceGraph({
      artifacts: [
        { id: "issue:ENG-7", type: "work_item", workItemId: "ENG-7" },
        { id: "branch:eng-7-fix", type: "branch", workItemId: "ENG-7" },
      ],
      edges: [
        { from: "issue:ENG-7", to: "branch:eng-7-fix", kind: "implemented_by", explicit: false, evidence: ["shared-stable-work-id:ENG-7"] },
      ],
    });

    expect(graph.edges[0]?.explicit).toBe(false);
    expect(graph.edges[0]?.evidence).toContain("shared-stable-work-id:ENG-7");
  });
});
