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

describe("frontier CLI", () => {
  it("creates and validates a proof-carrying Change Manifest", async () => {
    const c = capture();
    expect(await runCli(["change", "manifest", "tests/fixtures/frontier/manifest.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.validation.valid).toBe(true);
    expect(result.manifest.fingerprint).toMatch(/^sha256:/);
  });

  it("audits stacked change freshness", async () => {
    const c = capture();
    expect(await runCli(["change", "audit-stack", "tests/fixtures/frontier/stack.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.current).toBe(false);
    expect(result.findings.map((f: { code: string }) => f.code)).toContain("STALE_STACK_DEPENDENCY");
  });

  it("audits merge-group evidence separately from PR-head evidence", async () => {
    const c = capture();
    expect(await runCli(["merge-group", "audit", "tests/fixtures/frontier/merge-group.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).ready).toBe(false);
  });

  it("plans progressive release after deployment", async () => {
    const c = capture();
    expect(await runCli(["release", "plan", "tests/fixtures/frontier/release.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.releaseComplete).toBe(false);
    expect(result.steps.some((step: { kind: string }) => step.kind === "increase_exposure")).toBe(true);
  });
});
