import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeAutomationLoops,
  auditAutomation,
  evaluateAutomationAuthority,
  executeCheckpointCommit,
  planCheckpointCommit,
  verifyIdempotency,
} from "../src/index.js";
import type { AutomationActor } from "../src/index.js";

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

describe("repository automation public API acceptance", () => {
  it("keeps commit authority local and does not imply push", async () => {
    const root = await mkdtemp(join(tmpdir(), "gsp-auto-accept-root-"));
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.email", "test@example.com"]);
    git(root, ["config", "user.name", "Test"]);
    await mkdir(join(root, "src"));
    await writeFile(join(root, "src", "a.txt"), "one\n");
    git(root, ["add", "src/a.txt"]);
    git(root, ["commit", "-m", "initial"]);
    const head = git(root, ["rev-parse", "HEAD"]);
    const worktree = join(await mkdtemp(join(tmpdir(), "gsp-auto-accept-wt-")), "task");
    git(root, ["worktree", "add", "-b", "agent/ENG-7", worktree, head]);
    await writeFile(join(worktree, "src", "a.txt"), "two\n");

    const actor: AutomationActor = {
      id: "checkpoint",
      kind: "checkpoint",
      source: "gitskillpro",
      trigger: "checkpoint",
      authorities: ["auto-stage", "auto-commit"],
      allowedBranches: ["agent/*"],
      allowedPaths: ["src/**"],
      stagePolicy: "explicit",
      requireIsolatedWorktree: true,
      expectedStatePolicy: "required",
    };

    expect(evaluateAutomationAuthority(actor, "auto-push").allowed).toBe(false);
    const result = await executeCheckpointCommit(await planCheckpointCommit({
      cwd: worktree,
      actor,
      taskId: "ENG-7",
      expectedHead: head,
      paths: ["src/a.txt"],
      message: "checkpoint: ENG-7",
    }));
    expect(result.ok).toBe(true);
    expect(result.pushed).toBe(false);
    expect(result.persistence).toBeUndefined();

    expect(auditAutomation({ actors: [actor], sharedWritableWorktree: false, defaultBranch: "main" }).findings.some((f) => f.severity === "error")).toBe(false);
    expect(analyzeAutomationLoops({ actors: [] }).safe).toBe(true);
    expect(verifyIdempotency({ inputHash: "a", firstOutputHash: "b", secondOutputHash: "b" }).idempotent).toBe(true);
  });
});
