import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface WorktreeDelegationRequest {
  baseRef: string;
  branch: string;
  path: string;
}

export interface WorktreeDelegationResult {
  branch: string;
  path: string;
  baseSha: string;
  createdAt: string;
}

async function git(cwd: string, args: string[], allowFailure = false): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      encoding: "utf8",
      env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" },
    });
    return stdout.trim();
  } catch (error) {
    if (allowFailure) return undefined;
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export class LocalWorktreeDelegator {
  async create(cwd: string, request: WorktreeDelegationRequest): Promise<WorktreeDelegationResult> {
    if (!request.branch.trim()) throw new Error("Worktree branch is required");
    if (!request.baseRef.trim()) throw new Error("Worktree baseRef is required");
    if (!request.path.trim()) throw new Error("Worktree destination path is required");

    const baseSha = await git(cwd, ["rev-parse", "--verify", `${request.baseRef}^{commit}`]);
    if (!baseSha) throw new Error(`Unable to resolve base ref ${request.baseRef}`);

    const branchExists = await git(cwd, ["show-ref", "--verify", `refs/heads/${request.branch}`], true);
    if (branchExists !== undefined) throw new Error(`Branch ${request.branch} already exists`);

    const destination = resolve(request.path);
    if (await pathExists(destination)) throw new Error(`Worktree destination already exists: ${destination}`);

    const existing = await git(cwd, ["worktree", "list", "--porcelain"]);
    if (existing?.includes(`branch refs/heads/${request.branch}`)) throw new Error(`Branch ${request.branch} is already attached to a worktree`);
    if (existing?.includes(`worktree ${destination}`)) throw new Error(`Destination ${destination} is already registered as a worktree`);

    await git(cwd, ["worktree", "add", destination, "-b", request.branch, request.baseRef]);

    const createdBranch = await git(destination, ["branch", "--show-current"]);
    if (createdBranch !== request.branch) throw new Error(`Worktree verification failed: expected ${request.branch}, observed ${createdBranch ?? "unknown"}`);

    return { branch: request.branch, path: destination, baseSha, createdAt: new Date().toISOString() };
  }
}
