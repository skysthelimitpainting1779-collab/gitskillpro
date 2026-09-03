import { describe, expect, it } from "vitest";
import { reconcileProjectState } from "../src/recovery/reconcile.js";

describe("recovery tracker/code/runtime reconciliation", () => {
  it("proposes reopening a done issue whose PR never merged", () => {
    const result = reconcileProjectState({
      workItems: [{ id: "L-1", provider: "linear", title: "Feature", status: "done", blockers: [] }],
      pullRequests: [{ id: "pr:1", workItemId: "L-1", state: "open" }],
      completionPolicy: { completionRequires: ["merged"] },
      completionEvidence: { "L-1": { merged: false } },
    });
    expect(result.proposals.some((proposal) => proposal.code === "TRACKER_DONE_PR_UNMERGED" && proposal.targetId === "L-1")).toBe(true);
  });

  it("proposes completion when merged evidence satisfies Definition of Done", () => {
    const result = reconcileProjectState({
      workItems: [{ id: "B-1", provider: "beads", title: "Task", status: "in_progress", blockers: [] }],
      pullRequests: [{ id: "pr:2", workItemId: "B-1", state: "merged" }],
      completionPolicy: { completionRequires: ["merged"] },
      completionEvidence: { "B-1": { merged: true } },
    });
    expect(result.proposals.some((proposal) => proposal.code === "MERGED_WORK_TRACKER_OPEN" && proposal.proposedStatus === "done")).toBe(true);
  });

  it("does not accept closed tracker state when production verification is required and missing", () => {
    const result = reconcileProjectState({
      workItems: [{ id: "G-1", provider: "github", title: "Prod feature", status: "done", blockers: [] }],
      pullRequests: [{ id: "pr:3", workItemId: "G-1", state: "merged" }],
      completionPolicy: { completionRequires: ["merged", "production_verified"] },
      completionEvidence: { "G-1": { merged: true, productionVerified: false } },
    });
    expect(result.proposals.some((proposal) => proposal.code === "TRACKER_DONE_DEFINITION_INCOMPLETE")).toBe(true);
  });

  it("proposes removing a blocker only when merged/resolved evidence is supplied", () => {
    const result = reconcileProjectState({
      workItems: [{ id: "L-2", provider: "linear", title: "Next", status: "blocked", blockers: ["L-0"] }],
      pullRequests: [],
      completionPolicy: { completionRequires: ["merged"] },
      completionEvidence: {},
      resolvedBlockers: [{ workItemId: "L-2", blockerId: "L-0", evidence: ["pr:9 merged as abc"] }],
    });
    expect(result.proposals.some((proposal) => proposal.code === "BLOCKER_RESOLVED" && proposal.blockerId === "L-0")).toBe(true);
  });
});
