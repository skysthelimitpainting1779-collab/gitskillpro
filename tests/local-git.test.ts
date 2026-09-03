import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalGitAdapter } from "../src/adapters/local-git.js";

async function repo(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "gsp-git-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: dir });
  await writeFile(join(dir, "a.txt"), "one\n");
  execFileSync("git", ["add", "a.txt"], { cwd: dir });
  execFileSync("git", ["commit", "-m", "init"], { cwd: dir });
  return dir;
}

describe("LocalGitAdapter", () => {
  it("reports dirty state without changing it", async () => {
    const dir = await repo();
    await writeFile(join(dir, "a.txt"), "two\n");

    const before = execFileSync("git", ["status", "--porcelain"], { cwd: dir, encoding: "utf8" });
    const snapshot = await new LocalGitAdapter().inspectRepository(dir);
    const after = execFileSync("git", ["status", "--porcelain"], { cwd: dir, encoding: "utf8" });

    expect(snapshot.branch).toBe("main");
    expect(snapshot.dirty).toBe(true);
    expect(snapshot.unstaged).toBe(true);
    expect(snapshot.headSha).toMatch(/^[0-9a-f]{40,64}$/);
    expect(after).toBe(before);
  });

  it("reports untracked files", async () => {
    const dir = await repo();
    await writeFile(join(dir, "new.txt"), "new\n");
    const snapshot = await new LocalGitAdapter().inspectRepository(dir);
    expect(snapshot.untracked).toBe(true);
  });

  it("lists the current worktree", async () => {
    const dir = await repo();
    const worktrees = await new LocalGitAdapter().listWorktrees(dir);
    expect(worktrees.some((worktree) => worktree.path === dir && worktree.branch === "main")).toBe(true);
  });
});
