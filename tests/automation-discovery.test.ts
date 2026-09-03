import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { discoverRepositoryAutomation } from "../src/automation/discovery.js";

async function repo(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "gsp-auto-discovery-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: dir });
  return dir;
}

describe("repository automation discovery", () => {
  it("detects active Git hooks and hook managers", async () => {
    const dir = await repo();
    const hookDir = join(dir, ".git", "hooks");
    await writeFile(join(hookDir, "pre-commit"), "#!/bin/sh\necho check\n", { mode: 0o755 });
    await mkdir(join(dir, ".husky"));
    await writeFile(join(dir, ".husky", "pre-commit"), "npm test\n");

    const result = await discoverRepositoryAutomation(dir);
    expect(result.actors.some((actor) => actor.kind === "hook" && actor.source.includes("pre-commit"))).toBe(true);
    expect(result.evidence.some((item) => item.source.includes(".husky/pre-commit"))).toBe(true);
  });

  it("detects package scripts and workflows that commit or push", async () => {
    const dir = await repo();
    await writeFile(join(dir, "package.json"), JSON.stringify({
      scripts: {
        checkpoint: "git add src/generated && git commit -m checkpoint",
        test: "vitest run"
      }
    }));
    await mkdir(join(dir, ".github", "workflows"), { recursive: true });
    await writeFile(join(dir, ".github", "workflows", "generate.yml"), `name: generate\non: push\njobs:\n  gen:\n    steps:\n      - run: git commit -am generated\n      - run: git push\n`);

    const result = await discoverRepositoryAutomation(dir);
    expect(result.actors.some((actor) => actor.source === "package.json#scripts.checkpoint" && actor.observedOperations.includes("commit"))).toBe(true);
    expect(result.actors.some((actor) => actor.source.endsWith("generate.yml") && actor.observedOperations.includes("push"))).toBe(true);
    expect(result.actors.some((actor) => actor.source === "package.json#scripts.test")).toBe(false);
  });

  it("detects custom core.hooksPath", async () => {
    const dir = await repo();
    await mkdir(join(dir, ".githooks"));
    await writeFile(join(dir, ".githooks", "commit-msg"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    execFileSync("git", ["config", "core.hooksPath", ".githooks"], { cwd: dir });

    const result = await discoverRepositoryAutomation(dir);
    expect(result.gitHooksPath).toContain(".githooks");
    expect(result.actors.some((actor) => actor.source.includes(".githooks/commit-msg"))).toBe(true);
  });

  it("reports dependency and release bot configuration without inventing write authority", async () => {
    const dir = await repo();
    await mkdir(join(dir, ".github"));
    await writeFile(join(dir, ".github", "dependabot.yml"), "version: 2\nupdates: []\n");
    await writeFile(join(dir, "renovate.json"), "{}\n");

    const result = await discoverRepositoryAutomation(dir);
    const bots = result.actors.filter((actor) => actor.kind === "dependency-bot");
    expect(bots.length).toBe(2);
    expect(bots.every((actor) => actor.authorities.length === 0)).toBe(true);
  });
});
