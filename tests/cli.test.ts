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
  it("prints help", async () => {
    const c = capture();
    expect(await runCli(["--help"], c.io)).toBe(0);
    expect(c.stdout()).toBe(HELP);
    expect(c.stdout()).toContain("gsp audit git");
  });

  it("emits a machine-readable plan without executing it", async () => {
    const c = capture();
    expect(await runCli(["plan", "merge", "default", "--json"], c.io)).toBe(0);
    const result = JSON.parse(c.stdout());
    expect(result.risk).toBe("R3");
    expect(result.steps).toContain("Inspect and classify before any mutation");
  });

  it("reports unknown commands without guessing", async () => {
    const c = capture();
    expect(await runCli(["warp-speed"], c.io)).toBe(2);
    expect(c.stderr()).toMatch(/unknown command/i);
  });
});
