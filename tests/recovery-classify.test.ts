import { describe, expect, it } from "vitest";
import { classifyPullRequest } from "../src/recovery/classify.js";
import { resolveSupersession } from "../src/recovery/supersession.js";

describe("recovery pull-request classification", () => {
  it("classifies explicit duplicate and superseded work without deleting history", () => {
    const result = classifyPullRequest({
      id: "pr:1",
      state: "open",
      trackerStatus: "in_progress",
      duplicateOf: "pr:2",
      supersededBy: ["pr:3"],
    });
    expect(result.labels).toEqual(expect.arrayContaining(["duplicate", "superseded"]));
  });

  it("distinguishes shared baseline CI failure from PR-specific failure", () => {
    expect(classifyPullRequest({ id: "pr:4", state: "open", ciFailure: "baseline_broken" }).labels).toContain("failed_baseline_ci");
    expect(classifyPullRequest({ id: "pr:5", state: "open", ciFailure: "pr_specific" }).labels).toContain("failed_pr_specific");
  });

  it("detects tracker/code drift", () => {
    expect(classifyPullRequest({ id: "pr:6", state: "merged", trackerStatus: "in_progress" }).labels).toContain("merged_but_tracker_open");
    expect(classifyPullRequest({ id: "pr:7", state: "open", trackerStatus: "done" }).labels).toContain("tracker_done_but_unmerged");
  });

  it("classifies conflict, orphan and stale evidence independently", () => {
    const result = classifyPullRequest({
      id: "pr:8",
      state: "open",
      conflicted: true,
      linkedWorkItemExists: false,
      updatedAt: "2026-01-01T00:00:00Z",
      staleBefore: "2026-08-01T00:00:00Z",
    });
    expect(result.labels).toEqual(expect.arrayContaining(["conflicted", "orphaned", "stale"]));
  });

  it("preserves unknown when evidence cannot establish a stronger state", () => {
    const result = classifyPullRequest({ id: "pr:9", state: "open" });
    expect(result.labels).toContain("unknown");
  });
});

describe("supersession graph", () => {
  it("does not infer supersession from a newer timestamp alone", () => {
    const result = resolveSupersession([
      { id: "pr:old", workItemId: "ENG-9", updatedAt: "2026-08-01T00:00:00Z" },
      { id: "pr:new", workItemId: "ENG-9", updatedAt: "2026-09-01T00:00:00Z" },
    ]);
    expect(result.edges).toEqual([]);
  });

  it("preserves explicit supersession", () => {
    const result = resolveSupersession([
      { id: "pr:old", workItemId: "ENG-9" },
      { id: "pr:new", workItemId: "ENG-9", explicitSupersedes: ["pr:old"] },
    ]);
    expect(result.edges).toContainEqual(expect.objectContaining({ from: "pr:new", to: "pr:old", explicit: true }));
  });

  it("allows evidence-backed inferred replacement when stable work identity and replacement evidence agree", () => {
    const result = resolveSupersession([
      { id: "pr:old", workItemId: "ENG-10" },
      { id: "pr:new", workItemId: "ENG-10", replacementEvidence: ["PR body: replaces pr:old"] },
    ]);
    expect(result.edges).toContainEqual(expect.objectContaining({ from: "pr:new", to: "pr:old", explicit: false }));
  });
});
