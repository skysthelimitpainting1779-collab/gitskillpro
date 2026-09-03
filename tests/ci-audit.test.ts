import { describe, expect, it } from "vitest";
import { auditCi, classifyCiFailure } from "../src/audits/ci.js";

describe("CI causality classification", () => {
  const cases = [
    ["source", { name: "build", category: "source", logExcerpt: "compiler error" }],
    ["test", { name: "test", category: "test", logExcerpt: "AssertionError" }],
    ["type_static", { name: "typecheck", category: "type", logExcerpt: "TS2345" }],
    ["dependency", { name: "install", category: "dependency", logExcerpt: "npm ERR lockfile" }],
    ["workflow", { name: "workflow", category: "workflow", logExcerpt: "Invalid workflow file" }],
    ["permission", { name: "api", category: "permission", logExcerpt: "Resource not accessible by integration" }],
    ["secret", { name: "deploy", category: "secret", logExcerpt: "secret DEPLOY_TOKEN not found" }],
    ["runtime", { name: "setup", category: "runtime", logExcerpt: "Unsupported Node version" }],
    ["runner", { name: "runner", category: "runner", logExcerpt: "runner lost communication" }],
    ["cache_artifact", { name: "cache", category: "cache", logExcerpt: "cache archive corrupt" }],
    ["concurrency", { name: "cancel", category: "concurrency", logExcerpt: "cancelled due to concurrency" }],
    ["external", { name: "api", category: "external", logExcerpt: "ECONNRESET upstream" }],
    ["quota", { name: "quota", category: "quota", logExcerpt: "rate limit exceeded" }],
    ["deployment", { name: "deploy", category: "deployment", logExcerpt: "Vercel deployment failed" }],
    ["database", { name: "db", category: "database", logExcerpt: "migration failed" }],
  ] as const;

  for (const [expected, step] of cases) {
    it(`classifies ${expected}`, () => {
      expect(classifyCiFailure(step).classification).toBe(expected);
    });
  }

  it("uses bounded log patterns when structured category is absent", () => {
    expect(classifyCiFailure({ name: "typecheck", logExcerpt: "error TS2345: Argument of type" }).classification).toBe("type_static");
    expect(classifyCiFailure({ name: "tests", logExcerpt: "AssertionError: expected 2 to be 3" }).classification).toBe("test");
  });

  it("preserves unknown for ambiguous logs", () => {
    expect(classifyCiFailure({ name: "mystery", logExcerpt: "something went wrong" }).classification).toBe("unknown");
  });
});

describe("CI audit", () => {
  it("separates root-cause candidates from hardening findings", () => {
    const result = auditCi({
      status: "failure",
      failedSteps: [{ name: "typecheck", category: "type", logExcerpt: "TS2345" }],
      hardeningFindings: ["actions should be pinned to immutable SHAs"],
    });
    expect(result.rootCauses[0]?.classification).toBe("type_static");
    expect(result.hardeningFindings).toContain("actions should be pinned to immutable SHAs");
    expect(result.rootCauses.map((cause) => cause.summary).join(" ")).not.toMatch(/pinned/i);
  });

  it("detects a required check whose name is not emitted by current workflows", () => {
    const result = auditCi({
      status: "success",
      failedSteps: [],
      requiredChecks: ["CI / verify", "security-old"],
      emittedChecks: ["CI / verify", "dependency-review"],
    });
    expect(result.wiringFindings).toContainEqual(expect.objectContaining({ code: "REQUIRED_CHECK_NOT_EMITTED", check: "security-old" }));
  });
});
