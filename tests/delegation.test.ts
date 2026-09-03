import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createTaskBranchName, planDelegation } from "../src/delegation/planner.js";
import { LocalWorktreeDelegator } from "../src/delegation/worktree.js";

describe("delegation planning", () => {
  it("prefers a local worktree when persistent worktree capability is proven", () => {
    const plan = planDelegation({
      issueId: "ENG-42",
      title: "Add work graph",
      capabilities: ["git.local.write", "git.worktree", "fs.persistent"],
    });
    expect(plan.mode).toBe("local_worktree");
    expect(plan.branch).toBe("eng-42-add-work-graph");
    expect(plan.risk).toBe("R1");
  });

  it("falls back to remote isolation without pretending a worktree exists", () => {
    const plan = planDelegation({ issueId: "ENG-42", title: "Add work graph", capabilities: ["github.write"] });
    expect(plan.mode).toBe("remote_branch");
    expect(plan.risk).toBe("R2");
  });

  it("creates deterministic safe task branch names", () => {
    expect(createTaskBranchName("ENG 42", "Fix / Weird -- Thing!!!")).toBe("eng-42-fix-weird-thing");
  });
});

describe("local worktree delegation", () => {
  it("creates one isolated branch/worktree without changing the supervisor working tree", async () => {
    const root = await mkdtemp(join(tmpdir(), "gsp-delegation-"));
    const repo = join(root, "repo");
    const worktree = join(root, "worker-eng-42");
    execFileSync("git", ["init", "-b", "main", repo]);
    execFileSync("git", ["config", "user.email", "delegation@example.com"], { cwd: repo });
    execFileSync("git", ["config", "user.name", "Delegation Test"], { cwd: repo });
    await writeFile(join(repo, "baseline.txt"), "baseline\n");
    execFileSync("git", ["add", "baseline.txt"], { cwd: repo });
    execFileSync("git", ["commit", "-m", "baseline"], { cwd: repo });
    await writeFile(join(repo, "supervisor-untracked.txt"), "do not touch\n");
    const before = execFileSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" });

    const result = await new LocalWorktreeDelegator().create(repo, {
      baseRef: "main",
      branch: "eng-42-work-graph",
      path: worktree,
    });

    expect(result.branch).toBe("eng-42-work-graph");
    expect(execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: repo, encoding: "utf8" })).toContain(worktree);
    expect(execFileSync("git", ["branch", "--show-current"], { cwd: worktree, encoding: "utf8" }).trim()).toBe("eng-42-work-graph");
    expect(execFileSync("git", ["status", "--porcelain"], { cwd: repo, encoding: "utf8" })).toBe(before);
  });
});
