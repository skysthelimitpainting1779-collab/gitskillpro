import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { executeCheckpointCommit, planCheckpointCommit } from "../src/automation/checkpoint.js";
import type { AutomationActor } from "../src/automation/types.js";

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

async function isolatedRepo(): Promise<{ root: string; worktree: string; head: string; actor: AutomationActor }> {
  const root = await mkdtemp(join(tmpdir(), "gsp-auto-root-"));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "user.email", "test@example.com"]);
  git(root, ["config", "user.name", "Test"]);
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "a.txt"), "one\n");
  git(root, ["add", "src/a.txt"]);
  git(root, ["commit", "-m", "initial"]);
  const head = git(root, ["rev-parse", "HEAD"]);
  const worktree = join(await mkdtemp(join(tmpdir(), "gsp-auto-wt-parent-")), "task");
  git(root, ["worktree", "add", "-b", "agent/ENG-1", worktree, head]);
  const actor: AutomationActor = {
    id: "agent-checkpoint",
    kind: "checkpoint",
    source: "gitskillpro",
    trigger: "agent_checkpoint",
    authorities: ["auto-stage", "auto-commit"],
    allowedBranches: ["agent/*"],
    allowedPaths: ["src/**"],
    stagePolicy: "explicit",
    commitPolicy: "checkpoint",
    requireIsolatedWorktree: true,
    expectedStatePolicy: "required",
    concurrencyPolicy: "isolated",
  };
  return { root, worktree, head, actor };
}

describe("guarded checkpoint commits", () => {
  it("commits only explicit allowlisted task paths in an isolated worktree and never pushes", async () => {
    const { worktree, head, actor } = await isolatedRepo();
    await writeFile(join(worktree, "src", "a.txt"), "two\n");
    const plan = await planCheckpointCommit({ cwd: worktree, actor, taskId: "ENG-1", expectedHead: head, paths: ["src/a.txt"], message: "checkpoint: ENG-1" });
    const result = await executeCheckpointCommit(plan);

    expect(result.ok).toBe(true);
    expect(result.commitSha).toMatch(/^[0-9a-f]{40,64}$/);
    expect(result.committedPaths).toEqual(["src/a.txt"]);
    expect(result.pushed).toBe(false);
    expect(result.persistence).toBeUndefined();
    expect(git(worktree, ["status", "--porcelain"])).toBe("");
  });

  it("blocks a stale expected HEAD before staging or committing", async () => {
    const { worktree, actor } = await isolatedRepo();
    await writeFile(join(worktree, "src", "a.txt"), "two\n");
    await expect(planCheckpointCommit({ cwd: worktree, actor, taskId: "ENG-1", expectedHead: "0".repeat(40), paths: ["src/a.txt"], message: "checkpoint" }))
      .rejects.toThrow(/expected.*head|stale/i);
    expect(git(worktree, ["status", "--porcelain"])).not.toBe("");
  });

  it("refuses to absorb an unexplained changed path outside the explicit commit set", async () => {
    const { worktree, head, actor } = await isolatedRepo();
    await writeFile(join(worktree, "src", "a.txt"), "two\n");
    await writeFile(join(worktree, "notes.txt"), "someone else\n");
    await expect(planCheckpointCommit({ cwd: worktree, actor, taskId: "ENG-1", expectedHead: head, paths: ["src/a.txt"], message: "checkpoint" }))
      .rejects.toThrow(/unexplained|outside.*path|notes\.txt/i);
  });

  it("honors a pre-commit hook and re-inspects its allowlisted mutation", async () => {
    const { worktree, head, actor } = await isolatedRepo();
    const common = git(worktree, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
    const hooks = join(common, "hooks");
    await writeFile(join(hooks, "pre-commit"), `#!/bin/sh\nprintf 'hooked\\n' >> src/a.txt\ngit add src/a.txt\n`, { mode: 0o755 });
    await writeFile(join(worktree, "src", "a.txt"), "two\n");
    const plan = await planCheckpointCommit({ cwd: worktree, actor, taskId: "ENG-1", expectedHead: head, paths: ["src/a.txt"], message: "checkpoint" });
    const result = await executeCheckpointCommit(plan);

    expect(result.ok).toBe(true);
    expect(result.hookChangedPaths).toContain("src/a.txt");
    expect(await readFile(join(worktree, "src", "a.txt"), "utf8")).toContain("hooked");
  });

  it("fails on a rejecting hook and never retries with hook bypass", async () => {
    const { worktree, head, actor } = await isolatedRepo();
    const common = git(worktree, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
    await writeFile(join(common, "hooks", "pre-commit"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
    await writeFile(join(worktree, "src", "a.txt"), "two\n");
    const plan = await planCheckpointCommit({ cwd: worktree, actor, taskId: "ENG-1", expectedHead: head, paths: ["src/a.txt"], message: "checkpoint" });
    await expect(executeCheckpointCommit(plan)).rejects.toThrow(/commit|hook/i);
    expect(git(worktree, ["rev-parse", "HEAD"])).toBe(head);
  });
});
