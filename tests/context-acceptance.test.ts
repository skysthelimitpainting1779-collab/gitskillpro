import { describe, expect, it } from "vitest";
import {
  buildSubagentPacket,
  context7CacheIdentity,
  createCacheKey,
  createCheckpoint,
  planContext,
  planContext7Request,
  planRetrieval,
  reportContextCost,
} from "../src/index.js";

describe("Context Economy public API acceptance", () => {
  it("carries a task from context plan through bounded handoff and docs/cost planning", () => {
    const context = planContext({
      risk: "R3",
      tokenBudget: 100,
      items: [
        { id: "scope", kind: "scope", estimatedTokens: 40, required: true, reason: "scope" },
        { id: "unknown", kind: "unknown", estimatedTokens: 80, unresolved: true, reason: "deployment unknown" },
        { id: "history", kind: "history", estimatedTokens: 500, priority: 1, reason: "old context" },
      ],
    });
    expect(context.included.map((item) => item.id)).toEqual(["scope", "unknown"]);

    const checkpoint = createCheckpoint({
      scope: { repo: "o/r" },
      acceptedFacts: ["head is abc"],
      evidenceRefs: ["git:abc"],
      decisions: ["use narrow PR retrieval"],
      unknowns: ["deployment unknown"],
      nextAction: "review PR",
    });
    expect(buildSubagentPacket(checkpoint, {
      task: "Review PR",
      acceptanceCriteria: ["do not merge"],
      relevantEvidenceRefs: ["git:abc"],
    }).evidenceRefs).toEqual(["git:abc"]);

    expect(planRetrieval({ mode: "pr", unresolved: false }).steps.at(-1)?.kind).toBe("changed_file_patches");
    const docs = planContext7Request({ libraryName: "Next.js", repoVersion: "16.2.9", concept: "middleware runtime" });
    expect(docs.next).toBe("resolve");
    expect(createCacheKey(context7CacheIdentity({ libraryId: "/vercel/next.js", version: "v16.2.9", query: "middleware runtime" }))).toMatch(/^gsp-cache-v1:/);

    expect(reportContextCost({
      inputTokens: 500,
      outputTokens: 100,
      retrievedTokens: 100,
      cachedTokens: 200,
      avoidedTokens: 1000,
      taskSucceeded: true,
      qualityScoreBefore: 0.9,
      qualityScoreAfter: 0.9,
      evidenceCompletenessBefore: 1,
      evidenceCompletenessAfter: 1,
    }).optimizationSuccessful).toBe(true);
  });
});
