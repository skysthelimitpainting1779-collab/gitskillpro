import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { isAbsolute, normalize, relative, resolve } from "node:path";
import { promisify } from "node:util";
import { evaluateAutomationAuthority } from "./policy.js";
import type { AutomationActor } from "./types.js";

const execFileAsync = promisify(execFile);

export class CheckpointCommitError extends Error {
  constructor(message: string, readonly details?: Record<string, unknown>) {
    super(message);
    this.name = "CheckpointCommitError";
  }
}

export interface CheckpointCommitInput {
  cwd: string;
  actor: AutomationActor;
  taskId: string;
  expectedHead: string;
  paths: string[];
  message: string;
}

export interface CheckpointCommitPlan {
  cwd: string;
  actor: AutomationActor;
  taskId: string;
  expectedHead: string;
  branch: string;
  paths: string[];
  message: string;
  initialChangedPaths: string[];
  initialWorkingSetHash: string;
  gitDir: string;
  commonDir: string;
  isolatedWorktree: true;
}

export interface CheckpointCommitResult {
  ok: boolean;
  actorId: string;
  taskId: string;
  initialHead: string;
  commitSha: string;
  branch: string;
  stagedPaths: string[];
  stagedDiffHash: string;
  committedPaths: string[];
  hookChangedPaths: string[];
  pushed: false;
  persistence?: undefined;
  postCommitChangedPaths: string[];
}

async function git(cwd: string, args: string[], allowFailure = false): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout.trimEnd();
  } catch (error) {
    if (allowFailure) return undefined;
    const stderr = typeof error === "object" && error && "stderr" in error ? String((error as { stderr?: unknown }).stderr ?? "") : "";
    const message = error instanceof Error ? error.message : String(error);
    throw new CheckpointCommitError(`Git operation failed: ${message}${stderr ? `: ${stderr.trim()}` : ""}`, { args });
  }
}

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function cleanPath(path: string): string {
  if (!path.trim()) throw new CheckpointCommitError("Checkpoint path must not be empty");
  if (isAbsolute(path)) throw new CheckpointCommitError(`Checkpoint path must be repository-relative: ${path}`);
  const value = normalize(path).replace(/\\/g, "/").replace(/^\.\//, "");
  if (value === ".." || value.startsWith("../")) throw new CheckpointCommitError(`Checkpoint path escapes repository: ${path}`);
  return value;
}

function uniqueSorted(paths: string[]): string[] {
  return [...new Set(paths.map(cleanPath))].sort();
}

async function repositoryRoot(cwd: string): Promise<string> {
  const root = await git(cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) throw new CheckpointCommitError("Checkpoint commit requires a Git working tree");
  return resolve(root);
}

async function changedPaths(cwd: string): Promise<string[]> {
  const tracked = (await git(cwd, ["diff", "HEAD", "--name-only", "-z"], true)) ?? "";
  const untracked = (await git(cwd, ["ls-files", "--others", "--exclude-standard", "-z"], true)) ?? "";
  return uniqueSorted([...tracked.split("\0"), ...untracked.split("\0")].filter(Boolean));
}

async function pathFingerprint(root: string, paths: string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const path of uniqueSorted(paths)) {
    hash.update(path);
    const full = resolve(root, path);
    if (relative(root, full).startsWith("..")) throw new CheckpointCommitError(`Path escapes repository: ${path}`);
    try {
      const info = await stat(full);
      hash.update(`:${info.mode}:${info.size}:`);
      if (info.isFile()) hash.update(await readFile(full));
      else hash.update("<non-file>");
    } catch {
      hash.update(":<deleted>");
    }
  }
  return hash.digest("hex");
}

async function branch(cwd: string): Promise<string> {
  const value = await git(cwd, ["symbolic-ref", "--quiet", "--short", "HEAD"], true);
  if (!value) throw new CheckpointCommitError("Checkpoint commit requires a named branch; detached HEAD is not allowed");
  return value;
}

async function head(cwd: string): Promise<string> {
  const value = await git(cwd, ["rev-parse", "--verify", "HEAD"]);
  if (!value) throw new CheckpointCommitError("Checkpoint commit requires an existing HEAD commit");
  return value;
}

function sameSet(a: string[], b: string[]): boolean {
  const aa = uniqueSorted(a);
  const bb = uniqueSorted(b);
  return aa.length === bb.length && aa.every((value, index) => value === bb[index]);
}

export async function planCheckpointCommit(input: CheckpointCommitInput): Promise<CheckpointCommitPlan> {
  const cwd = await repositoryRoot(input.cwd);
  const currentHead = await head(cwd);
  if (currentHead !== input.expectedHead) {
    throw new CheckpointCommitError(`Stale expected HEAD: expected ${input.expectedHead}, observed ${currentHead}`);
  }
  const currentBranch = await branch(cwd);
  const gitDir = resolve((await git(cwd, ["rev-parse", "--path-format=absolute", "--git-dir"]))!);
  const commonDir = resolve((await git(cwd, ["rev-parse", "--path-format=absolute", "--git-common-dir"]))!);
  const isolatedWorktree = gitDir !== commonDir;
  if (!isolatedWorktree) throw new CheckpointCommitError("Checkpoint automation requires a proven isolated linked worktree");

  const paths = uniqueSorted(input.paths);
  if (!paths.length) throw new CheckpointCommitError("Checkpoint commit requires explicit paths");
  const authority = evaluateAutomationAuthority(input.actor, "checkpoint-commit", {
    branch: currentBranch,
    paths,
    isolatedWorktree,
  });
  if (!authority.allowed) throw new CheckpointCommitError(`Automation authority denied: ${authority.reasons.join(" ")}`, { authority });

  const observedChangedPaths = await changedPaths(cwd);
  if (!observedChangedPaths.length) throw new CheckpointCommitError("No changed paths exist for checkpoint commit");
  const explicit = new Set(paths);
  const unexplained = observedChangedPaths.filter((path) => !explicit.has(path));
  if (unexplained.length) {
    throw new CheckpointCommitError(`Unexplained changed paths exist outside the explicit checkpoint set: ${unexplained.join(", ")}`, { unexplained });
  }

  const taskId = input.taskId.trim();
  const message = input.message.trim();
  if (!taskId) throw new CheckpointCommitError("Checkpoint taskId is required");
  if (!message) throw new CheckpointCommitError("Checkpoint commit message is required");

  return {
    cwd,
    actor: input.actor,
    taskId,
    expectedHead: currentHead,
    branch: currentBranch,
    paths,
    message,
    initialChangedPaths: observedChangedPaths,
    initialWorkingSetHash: await pathFingerprint(cwd, observedChangedPaths),
    gitDir,
    commonDir,
    isolatedWorktree: true,
  };
}

export async function executeCheckpointCommit(plan: CheckpointCommitPlan): Promise<CheckpointCommitResult> {
  const currentHead = await head(plan.cwd);
  if (currentHead !== plan.expectedHead) throw new CheckpointCommitError(`Stale checkpoint plan: HEAD moved from ${plan.expectedHead} to ${currentHead}`);
  const currentBranch = await branch(plan.cwd);
  if (currentBranch !== plan.branch) throw new CheckpointCommitError(`Stale checkpoint plan: branch changed from ${plan.branch} to ${currentBranch}`);
  const currentChanged = await changedPaths(plan.cwd);
  if (!sameSet(currentChanged, plan.initialChangedPaths)) {
    throw new CheckpointCommitError("Concurrent/unexpected changed-path state detected before checkpoint commit", { expected: plan.initialChangedPaths, actual: currentChanged });
  }
  const currentFingerprint = await pathFingerprint(plan.cwd, currentChanged);
  if (currentFingerprint !== plan.initialWorkingSetHash) {
    throw new CheckpointCommitError("Concurrent/unexpected file content change detected before checkpoint commit");
  }

  await git(plan.cwd, ["add", "--", ...plan.paths]);
  const stagedRaw = (await git(plan.cwd, ["diff", "--cached", "--name-only", "-z"])) ?? "";
  const stagedPaths = uniqueSorted(stagedRaw.split("\0").filter(Boolean));
  if (!stagedPaths.length) throw new CheckpointCommitError("Checkpoint staging produced no staged changes");
  const allowed = new Set(plan.paths);
  const unexpectedStaged = stagedPaths.filter((path) => !allowed.has(path));
  if (unexpectedStaged.length) throw new CheckpointCommitError(`Unexpected staged paths detected: ${unexpectedStaged.join(", ")}`);

  const stagedDiff = (await git(plan.cwd, ["diff", "--cached", "--binary"])) ?? "";
  const stagedDiffHash = sha256(stagedDiff);

  try {
    await git(plan.cwd, ["commit", "-m", plan.message]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new CheckpointCommitError(`Checkpoint commit failed; hook/commit rejection was not bypassed: ${message}`);
  }

  const commitSha = await head(plan.cwd);
  if (commitSha === plan.expectedHead) throw new CheckpointCommitError("Checkpoint commit did not advance HEAD");
  const committedRaw = (await git(plan.cwd, ["diff-tree", "--no-commit-id", "--name-only", "-r", "-z", commitSha])) ?? "";
  const committedPaths = uniqueSorted(committedRaw.split("\0").filter(Boolean));
  const unexpectedCommitted = committedPaths.filter((path) => !allowed.has(path));
  if (unexpectedCommitted.length) {
    throw new CheckpointCommitError(`Hook/commit absorbed unexpected paths: ${unexpectedCommitted.join(", ")}`, {
      commitSha,
      recovery: `git revert ${commitSha}`,
    });
  }

  const committedDiff = (await git(plan.cwd, ["show", "--format=", "--binary", commitSha])) ?? "";
  const hookChangedPaths = sha256(committedDiff) === stagedDiffHash ? [] : committedPaths;
  const postCommitChangedPaths = await changedPaths(plan.cwd);

  return {
    ok: postCommitChangedPaths.length === 0,
    actorId: plan.actor.id,
    taskId: plan.taskId,
    initialHead: plan.expectedHead,
    commitSha,
    branch: plan.branch,
    stagedPaths,
    stagedDiffHash,
    committedPaths,
    hookChangedPaths,
    pushed: false,
    persistence: undefined,
    postCommitChangedPaths,
  };
}
