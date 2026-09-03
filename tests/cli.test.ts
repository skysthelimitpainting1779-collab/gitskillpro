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
  it("prints help including workflow, recovery and provider/database commands", async () => {
    const c = capture();
    expect(await runCli(["--help"], c.io)).toBe(0);
    expect(c.stdout()).toBe(HELP);
    for (const command of [
      "gsp audit git",
      "gsp audit beads",
      "gsp bootstrap plan",
      "gsp delegate plan",
      "gsp recover project",
      "gsp recover ci",
      "gsp detect providers",
      "gsp audit ci",
      "gsp audit pr",
      "gsp audit deploy",
      "gsp audit db",
    ]) expect(c.stdout()).toContain(command);
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

  it("plans project recovery from a JSON evidence snapshot without mutation", async () => {
    const c = capture();
    expect(await runCli(["recover", "project", "tests/fixtures/recovery/messy-project.json", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.mode).toBe("recovery");
    expect(result.mutationsPerformed).toBe(false);
    expect(result.ciBaseline.state).toBe("baseline_broken");
  });

  it("diagnoses default-branch CI baseline from a recovery snapshot", async () => {
    const c = capture();
    expect(await runCli(["recover", "ci", "tests/fixtures/recovery/messy-project.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).state).toBe("baseline_broken");
  });

  it("detects repository provider configuration signals", async () => {
    const c = capture();
    expect(await runCli(["detect", "providers", "--json"], c.io)).toBe(0);
    expect(Array.isArray(JSON.parse(c.stdout()))).toBe(true);
  });

  it("audits CI evidence from JSON", async () => {
    const c = capture();
    expect(await runCli(["audit", "ci", "tests/fixtures/providers/ci.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).rootCauses[0].classification).toBe("type_static");
  });

  it("audits autonomous PR evidence from JSON", async () => {
    const c = capture();
    expect(await runCli(["audit", "pr", "tests/fixtures/providers/pr.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).mergeReady).toBe(true);
  });

  it("audits deployment evidence from JSON", async () => {
    const c = capture();
    expect(await runCli(["audit", "deploy", "tests/fixtures/providers/deploy.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).readyToPromote).toBe(true);
  });

  it("audits database evidence from JSON", async () => {
    const c = capture();
    expect(await runCli(["audit", "db", "tests/fixtures/providers/db.json", "--json"], c.io)).toBe(0);
    expect(JSON.parse(c.stdout()).readyToMigrate).toBe(true);
  });

  it("reports unknown commands without guessing", async () => {
    const c = capture();
    expect(await runCli(["warp-speed"], c.io)).toBe(2);
    expect(c.stderr()).toMatch(/unknown command/i);
  });
});
