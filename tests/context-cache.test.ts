import { describe, expect, it } from "vitest";
import { ContextCache, createCacheKey } from "../src/context/cache.js";

describe("context cache", () => {
  it("changes cache identity when a PR head changes", () => {
    const a = createCacheKey({ kind: "pr", repo: "o/r", number: 42, headSha: "aaa" });
    const b = createCacheKey({ kind: "pr", repo: "o/r", number: 42, headSha: "bbb" });
    expect(a).not.toBe(b);
  });

  it("is deterministic regardless of object property insertion order", () => {
    expect(createCacheKey({ kind: "ci", runId: 7, attempt: 2, sha: "abc" }))
      .toBe(createCacheKey({ sha: "abc", attempt: 2, runId: 7, kind: "ci" }));
  });

  it("treats expired evidence as a cache miss", () => {
    const cache = new ContextCache();
    const key = createCacheKey({ kind: "deployment", provider: "vercel", deploymentId: "dpl_1" });
    cache.put(key, { ok: true }, { source: "vercel", observedAt: "2026-09-03T10:00:00.000Z", maxAgeMs: 1_000 });
    expect(cache.get(key, Date.parse("2026-09-03T10:00:02.000Z"))).toBeUndefined();
  });

  it("keys Context7 documentation by library, version and focused query", () => {
    const base = { kind: "context7", libraryId: "/vercel/next.js", version: "19.0.0" };
    expect(createCacheKey({ ...base, query: "middleware runtime" }))
      .not.toBe(createCacheKey({ ...base, query: "server actions" }));
  });
});
