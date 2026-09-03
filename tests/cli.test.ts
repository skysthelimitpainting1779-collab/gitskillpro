import { describe, expect, it } from "vitest";
import { HELP, runCli } from "../src/cli/index.js";

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

describe("CLI", () => {
  it("prints help including workflow commands", async () => {
    const c = capture();
    expect(await runCli(["--help"], c.io)).toBe(0);
    expect(c.stdout()).toBe(HELP);
    expect(c.stdout()).toContain("gsp audit git");
    expect(c.stdout()).toContain("gsp audit beads");
    expect(c.stdout()).toContain("gsp bootstrap plan");
    expect(c.stdout()).toContain("gsp delegate plan");
  });

  it("emits a machine-readable plan without executing it", async () => {
    const c = capture();
    expect(await runCli(["plan", "merge", "default", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.risk).toBe("R3");
    expect(result.steps).toContain("Inspect and classify before any mutation");
  });

  it("audits Beads discovery without requiring bd to exist", async () => {
    const c = capture();
    expect(await runCli(["audit", "beads", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(typeof result.installed).toBe("boolean");
    expect(result).toHaveProperty("storageMode");
  });

  it("emits a greenfield bootstrap plan", async () => {
    const c = capture();
    expect(await runCli(["bootstrap", "plan", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.mode).toBe("greenfield");
    expect(result.steps.at(-1).id).toBe("proving_issue");
  });

  it("plans delegation without executing it", async () => {
    const c = capture();
    expect(await runCli(["delegate", "plan", "ENG-42", "Add work graph", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.branch).toBe("eng-42-add-work-graph");
    expect(["local_worktree", "remote_branch", "unavailable"]).toContain(result.mode);
  });

  it("reports unknown commands without guessing", async () => {
    const c = capture();
    expect(await runCli(["warp-speed"], c.io)).toBe(2);
    expect(c.stderr()).toMatch(/unknown command/i);
  });
});
