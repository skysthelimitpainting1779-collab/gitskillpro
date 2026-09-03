import { describe, expect, it } from "vitest";
import {
  assessReadiness,
  auditWorkGraph,
  createEvidencePacket,
  normalizeLinearIssue,
  planDelegation,
  planGreenfieldBootstrap,
  resolveAuthority,
  validateAuthorityMap,
} from "../src/index.js";

describe("workflow layer acceptance", () => {
  it("keeps work intent, execution graph, SCM and persistence boundaries explicit", () => {
    const authorityMap = {
      bindings: [
        { domain: "project_intent", provider: "linear", canonical: true },
        { domain: "execution_graph", provider: "beads", canonical: true },
        { domain: "scm", provider: "github", canonical: true },
      ],
    } as const;

    expect(validateAuthorityMap(authorityMap).valid).toBe(true);
    expect(resolveAuthority(authorityMap, "execution_graph")?.provider).toBe("beads");

    const normalized = normalizeLinearIssue(
      {
        id: "uuid-42",
        identifier: "ENG-42",
        title: "Add work graph",
        status: { name: "Ready" },
        acceptanceCriteria: ["Authority is explicit", "No persistence is fabricated"],
        blockedBy: [],
      },
      { Ready: "ready" },
    );

    const issue = { ...normalized, repository: "skysthelimitpainting1779-collab/gitskillpro" };
    expect(assessReadiness(issue, {
      requireAcceptanceCriteria: true,
      requireRepository: true,
      completionRequires: ["merged", "production_verified"],
    }).ready).toBe(true);

    const delegation = planDelegation({
      issueId: issue.id,
      title: issue.title,
      capabilities: ["git.local.write", "git.worktree", "fs.persistent"],
    });
    expect(delegation.mode).toBe("local_worktree");

    const workGraph = auditWorkGraph({ items: [issue], authorityMap });
    expect(workGraph.links).toEqual([]);
    expect(workGraph.findings.some((finding) => finding.code === "INVALID_AUTHORITY_MAP")).toBe(false);

    const evidence = createEvidencePacket({
      operationId: "workflow-acceptance",
      intent: "delegate work",
      risk: delegation.risk,
    });
    expect(evidence.persistence).toBeUndefined();

    const bootstrap = planGreenfieldBootstrap({ repositoryExists: true, workTracker: "linear", executionGraph: "beads" });
    expect(bootstrap.steps.at(-1)?.id).toBe("proving_issue");
  });
});
