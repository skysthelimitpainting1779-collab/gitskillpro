import { describe, expect, it } from "vitest";
import {
  assertPrivacySafeDocsQuery,
  context7CacheIdentity,
  normalizeContext7Resolution,
  planContext7Request,
} from "../src/adapters/context7.js";

describe("Context7 host adapter", () => {
  it("plans library resolution before docs query when no exact library ID is known", () => {
    const plan = planContext7Request({ libraryName: "Next.js", repoVersion: "16.2.9", concept: "middleware runtime" });
    expect(plan.next).toBe("resolve");
    expect(plan.libraryName).toBe("Next.js");
    expect(plan.query).toBe("middleware runtime");
  });

  it("skips resolution when an exact Context7 library ID is already known", () => {
    const plan = planContext7Request({ exactLibraryId: "/vercel/next.js/v16.2.9", concept: "middleware runtime" });
    expect(plan.next).toBe("query");
    expect(plan.libraryId).toBe("/vercel/next.js/v16.2.9");
  });

  it("normalizes host resolution evidence without inventing a version", () => {
    const evidence = normalizeContext7Resolution({
      libraryId: "/vercel/next.js",
      name: "Next.js",
      sourceReputation: "High",
      benchmarkScore: 86.5,
      versions: ["v16.2.9", "v16.1.6"],
    }, { requestedVersion: "19.0.0" });
    expect(evidence.libraryId).toBe("/vercel/next.js");
    expect(evidence.resolvedVersion).toBeUndefined();
    expect(evidence.requestedVersion).toBe("19.0.0");
  });

  it("rejects obvious secrets instead of sending them to external docs retrieval", () => {
    expect(() => assertPrivacySafeDocsQuery("debug token sk-proj-abcdefghijklmnopqrstuvwxyz")).toThrow(/secret|sensitive/i);
    expect(() => assertPrivacySafeDocsQuery("password=hunter2 middleware bug")).toThrow(/secret|sensitive/i);
    expect(() => assertPrivacySafeDocsQuery("middleware runtime behavior")).not.toThrow();
  });

  it("keys docs evidence by exact library/version/query identity", () => {
    expect(context7CacheIdentity({ libraryId: "/vercel/next.js", version: "v16.2.9", query: "middleware runtime" }))
      .not.toEqual(context7CacheIdentity({ libraryId: "/vercel/next.js", version: "v16.2.9", query: "server actions" }));
  });
});
