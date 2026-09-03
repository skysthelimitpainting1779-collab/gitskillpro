import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli/index.js";

function capture(cwd = process.cwd()) {
  let stdout = "";
  let stderr = "";
  return {
    io: {
      cwd,
      stdout: (value: string) => { stdout += value; },
      stderr: (value: string) => { stderr += value; },
    },
    stdout: () => stdout,
    stderr: () => stderr,
  };
}

describe("Context Economy CLI", () => {
  it("plans minimum sufficient context from a JSON snapshot", async () => {
    const c = capture();
    expect(await runCli(["context", "plan", "tests/fixtures/context/plan.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.included.map((item: { id: string }) => item.id)).toContain("rollback");
    expect(result.deferred.map((item: { id: string }) => item.id)).toContain("history");
  });

  it("creates a compact checkpoint from data without executing it", async () => {
    const c = capture();
    expect(await runCli(["context", "checkpoint", "tests/fixtures/context/checkpoint.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.unknowns).toContain("production deployment revision unknown");
  });

  it("plans the host-native Context7 call instead of performing network IO", async () => {
    const c = capture();
    expect(await runCli(["docs", "plan", "tests/fixtures/context/docs.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.next).toBe("resolve");
    expect(result.libraryName).toBe("Next.js");
  });

  it("reports token savings with quality/evidence guardrails", async () => {
    const c = capture();
    expect(await runCli(["cost", "report", "tests/fixtures/context/cost.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.optimizationSuccessful).toBe(true);
    expect(result.avoidedTokens).toBe(1500);
  });
});
