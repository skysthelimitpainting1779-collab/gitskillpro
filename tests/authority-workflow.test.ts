import { describe, expect, it } from "vitest";
import { resolveAuthority, validateAuthorityMap } from "../src/work/authority.js";
import { nextWorkflowStage } from "../src/work/lifecycle.js";
import { assessCompletion, assessReadiness } from "../src/work/readiness.js";
import { mapProviderStatus } from "../src/work/status.js";

describe("work authority map", () => {
  it("rejects two canonical providers for the same semantic domain", () => {
    const result = validateAuthorityMap({
      bindings: [
        { domain: "project_intent", provider: "linear", canonical: true },
        { domain: "project_intent", provider: "github", canonical: true },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/project_intent/i);
  });

  it("resolves layered Linear + Beads + GitHub authority explicitly", () => {
    const map = {
      bindings: [
        { domain: "project_intent", provider: "linear", canonical: true },
        { domain: "execution_graph", provider: "beads", canonical: true },
        { domain: "scm", provider: "github", canonical: true },
      ],
    } as const;

    expect(resolveAuthority(map, "execution_graph")?.provider).toBe("beads");
  });
});

describe("workflow readiness and completion", () => {
  it("maps provider status through project configuration instead of hard-coded names", () => {
    expect(mapProviderStatus("Started", { Started: "in_progress", Review: "in_review" })).toBe("in_progress");
    expect(mapProviderStatus("Mystery", {})).toBe("unknown");
  });

  it("blocks readiness when acceptance criteria or repository identity are missing", () => {
    const result = assessReadiness(
      { id: "ENG-1", provider: "linear", title: "Ship it", status: "ready", blockers: [] },
      { requireAcceptanceCriteria: true, requireRepository: true, completionRequires: ["merged"] },
    );

    expect(result.ready).toBe(false);
    expect(result.findings.map((finding) => finding.code)).toContain("MISSING_ACCEPTANCE_CRITERIA");
    expect(result.findings.map((finding) => finding.code)).toContain("MISSING_REPOSITORY");
  });

  it("does not call a work item done when policy requires production verification", () => {
    const result = assessCompletion(
      { merged: true, deployed: true, productionVerified: false },
      { completionRequires: ["merged", "production_verified"] },
    );
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("production_verified");
  });

  it("returns the first unsatisfied required lifecycle stage", () => {
    expect(nextWorkflowStage({ claimed: true, implementing: true, localVerified: false })).toBe("local_verified");
  });
});
