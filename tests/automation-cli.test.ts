import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli/index.js";

function capture(cwd = process.cwd()) {
  let stdout = "";
  let stderr = "";
  return {
    io: { cwd, stdout: (value: string) => { stdout += value; }, stderr: (value: string) => { stderr += value; } },
    stdout: () => stdout,
    stderr: () => stderr,
  };
}

describe("automation CLI", () => {
  it("discovers repository automation without mutating it", async () => {
    const c = capture();
    expect(await runCli(["automation", "discover", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(Array.isArray(result.actors)).toBe(true);
  });

  it("audits an automation snapshot", async () => {
    const c = capture();
    expect(await runCli(["automation", "audit", "tests/fixtures/automation/audit.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.findings.map((f: { code: string }) => f.code)).toContain("AUTO_COMMIT_SHARED_WORKTREE");
  });

  it("plans authority without executing the mutation", async () => {
    const c = capture();
    expect(await runCli(["automation", "plan", "tests/fixtures/automation/plan.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.allowed).toBe(true);
    expect(result.executionPerformed).toBe(false);
  });

  it("detects trigger loops", async () => {
    const c = capture();
    expect(await runCli(["automation", "detect-loops", "tests/fixtures/automation/loops.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).safe).toBe(false);
  });

  it("verifies generator idempotency from evidence hashes", async () => {
    const c = capture();
    expect(await runCli(["automation", "verify-idempotency", "tests/fixtures/automation/idempotency.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).idempotent).toBe(true);
  });
});
