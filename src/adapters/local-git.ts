import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RemoteSnapshot, RepositorySnapshot, WorktreeSnapshot } from "../core/types.js";

const execFileAsync = promisify(execFile);

export class GitInspectionError extends Error {
  constructor(message: string, readonly cwd: string, readonly command?: string[]) {
    super(message);
    this.name = "GitInspectionError";
  }
}

async function git(cwd: string, args: string[], allowFailure = false): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    });
    return stdout.trimEnd();
  } catch (error) {
    if (allowFailure) return undefined;
    const message = error instanceof Error ? error.message : String(error);
    throw new GitInspectionError(`Git inspection failed: ${message}`, cwd, args);
  }
}

function parseStatus(output: string): Pick<RepositorySnapshot, "branch" | "detached" | "dirty" | "staged" | "unstaged" | "untracked" | "upstream" | "ahead" | "behind"> {
  let branch: string | null = null;
  let detached = false;
  let upstream: string | undefined;
  let ahead: number | undefined;
  let behind: number | undefined;
  let staged = false;
  let unstaged = false;
  let untracked = false;
  let dirty = false;

  for (const line of output.split(/\r?\n/)) {
    if (!line) continue;
    if (line.startsWith("# branch.head ")) {
      const value = line.slice("# branch.head ".length);
      detached = value === "(detached)";
      branch = detached ? null : value;
      continue;
    }
    if (line.startsWith("# branch.upstream ")) {
      upstream = line.slice("# branch.upstream ".length);
      continue;
    }
    if (line.startsWith("# branch.ab ")) {
      const match = line.match(/\+(\d+)\s+-(\d+)/);
      if (match) {
        ahead = Number(match[1]);
        behind = Number(match[2]);
      }
      continue;
    }
    if (line.startsWith("#")) continue;

    dirty = true;
    if (line.startsWith("? ")) {
      untracked = true;
      continue;
    }
    if (line.startsWith("! ")) continue;

    const fields = line.split(" ");
    const xy = fields[1] ?? "..";
    const x = xy[0] ?? ".";
    const y = xy[1] ?? ".";
    if (x !== "." && x !== "?") staged = true;
    if (y !== "." && y !== "?") unstaged = true;
  }

  return { branch, detached, dirty, staged, unstaged, untracked, upstream, ahead, behind };
}

function parseRemotes(output: string): RemoteSnapshot[] {
  const byName = new Map<string, RemoteSnapshot>();
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([^\s]+)\s+(.+)\s+\((fetch|push)\)$/);
    if (!match) continue;
    const [, name, url, mode] = match;
    const current = byName.get(name) ?? { name };
    if (mode === "fetch") current.fetchUrl = url;
    if (mode === "push") current.pushUrl = url;
    byName.set(name, current);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function parseWorktrees(output: string): WorktreeSnapshot[] {
  const result: WorktreeSnapshot[] = [];
  let current: WorktreeSnapshot | undefined;

  const flush = () => {
    if (current) result.push(current);
    current = undefined;
  };

  for (const line of output.split(/\r?\n/)) {
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("worktree ")) {
      flush();
      current = { path: line.slice(9), headSha: null, branch: null };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("HEAD ")) current.headSha = line.slice(5);
    else if (line.startsWith("branch ")) current.branch = line.slice(7).replace(/^refs\/heads\//, "");
    else if (line === "detached") current.branch = null;
    else if (line === "bare") current.bare = true;
    else if (line.startsWith("locked")) current.locked = true;
    else if (line.startsWith("prunable")) current.prunable = true;
  }
  flush();
  return result;
}

export class LocalGitAdapter {
  readonly id = "local-git";
  readonly priority = 50;
  readonly capabilities = new Set(["git.local.read"] as const);

  async listWorktrees(cwd: string): Promise<WorktreeSnapshot[]> {
    const output = await git(cwd, ["worktree", "list", "--porcelain"]);
    return parseWorktrees(output ?? "");
  }

  async inspectRepository(cwd = process.cwd()): Promise<RepositorySnapshot> {
    const root = await git(cwd, ["rev-parse", "--show-toplevel"]);
    if (!root) throw new GitInspectionError("Not inside a Git working tree", cwd);

    const gitDir = await git(cwd, ["rev-parse", "--path-format=absolute", "--git-dir"]);
    const commonDir = await git(cwd, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
    if (!gitDir || !commonDir) throw new GitInspectionError("Unable to resolve Git directories", cwd);

    const [headSha, statusOutput, remotesOutput, worktrees, shallowOutput, gitVersion] = await Promise.all([
      git(cwd, ["rev-parse", "--verify", "HEAD"], true),
      git(cwd, ["status", "--porcelain=v2", "--branch", "--show-stash"]),
      git(cwd, ["remote", "-v"], true),
      this.listWorktrees(cwd),
      git(cwd, ["rev-parse", "--is-shallow-repository"], true),
      git(cwd, ["--version"], true),
    ]);

    const status = parseStatus(statusOutput ?? "");
    return {
      root,
      gitDir,
      commonDir,
      branch: status.branch,
      headSha: headSha ?? null,
      detached: status.detached,
      dirty: status.dirty,
      staged: status.staged,
      unstaged: status.unstaged,
      untracked: status.untracked,
      upstream: status.upstream,
      ahead: status.ahead,
      behind: status.behind,
      shallow: shallowOutput === "true" ? true : shallowOutput === "false" ? false : undefined,
      gitVersion,
      remotes: parseRemotes(remotesOutput ?? ""),
      worktrees,
      capturedAt: new Date().toISOString(),
    };
  }
}
