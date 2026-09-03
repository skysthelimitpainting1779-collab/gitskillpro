import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import type { CapabilityId, EnvironmentKind, EnvironmentSnapshot, PersistenceKind } from "./types.js";

const execFileAsync = promisify(execFile);

export interface EnvironmentProbe {
  cwd: string;
  hasGit?: boolean;
  hasWritableFs?: boolean;
  hasReadableFs?: boolean;
  canSpawn?: boolean;
  persistence?: PersistenceKind;
  ci?: boolean;
  container?: boolean;
  vps?: boolean;
  pluginOnly?: boolean;
  readOnly?: boolean;
  isWorktree?: boolean;
  gitVersion?: string;
  gitDir?: string;
  gitCommonDir?: string;
  signals?: Record<string, string | boolean | number | null>;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function classifyEnvironment(input: EnvironmentProbe): EnvironmentSnapshot {
  let kind: EnvironmentKind = "unknown";
  if (input.ci) kind = "ci_runner";
  else if (input.pluginOnly) kind = "plugin_only";
  else if (input.readOnly) kind = "read_only";
  else if (input.persistence === "ephemeral") kind = "ephemeral_sandbox";
  else if (input.isWorktree) kind = "worktree";
  else if (input.vps) kind = "vps";
  else if (input.container) kind = "container";
  else if (input.hasGit) kind = "local";

  const capabilities: CapabilityId[] = [];
  if (input.hasReadableFs !== false) capabilities.push("fs.read");
  if (input.hasWritableFs && !input.readOnly) capabilities.push("fs.write");
  if (input.persistence === "persistent") capabilities.push("fs.persistent");
  if (input.canSpawn) capabilities.push("process.spawn", "shell");
  if (input.hasGit) capabilities.push("git.local.read");
  if (input.hasGit && input.hasWritableFs && !input.readOnly) capabilities.push("git.local.write");
  if (input.hasGit && input.hasWritableFs && input.persistence === "persistent" && !input.readOnly) capabilities.push("git.worktree");

  return {
    kind,
    cwd: input.cwd,
    persistence: input.persistence ?? "unknown",
    capabilities: unique(capabilities),
    capturedAt: new Date().toISOString(),
    gitVersion: input.gitVersion,
    gitDir: input.gitDir,
    gitCommonDir: input.gitCommonDir,
    signals: input.signals ?? {},
  };
}

async function canAccess(path: string, mode: number): Promise<boolean> {
  try {
    await access(path, mode);
    return true;
  } catch {
    return false;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function gitOutput(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, encoding: "utf8" });
    return stdout.trim();
  } catch {
    return undefined;
  }
}

export async function inspectCurrentEnvironment(cwd = process.cwd()): Promise<EnvironmentSnapshot> {
  const absoluteCwd = resolve(cwd);
  const readable = await canAccess(absoluteCwd, constants.R_OK);
  const writable = await canAccess(absoluteCwd, constants.W_OK);
  const gitVersion = await gitOutput(absoluteCwd, ["--version"]);
  const insideGit = (await gitOutput(absoluteCwd, ["rev-parse", "--is-inside-work-tree"])) === "true";
  const gitDir = insideGit ? await gitOutput(absoluteCwd, ["rev-parse", "--path-format=absolute", "--git-dir"]) : undefined;
  const gitCommonDir = insideGit ? await gitOutput(absoluteCwd, ["rev-parse", "--path-format=absolute", "--git-common-dir"]) : undefined;
  const isWorktree = Boolean(gitDir && gitCommonDir && resolve(gitDir) !== resolve(gitCommonDir));
  const ci = process.env.GITHUB_ACTIONS === "true" || process.env.CI === "true";
  const container = (await pathExists("/.dockerenv")) || Boolean(process.env.KUBERNETES_SERVICE_HOST);
  const explicitPersistence = process.env.GSP_PERSISTENCE;
  const persistence: PersistenceKind = explicitPersistence === "persistent" || explicitPersistence === "ephemeral"
    ? explicitPersistence
    : ci
      ? "ephemeral"
      : "unknown";

  let containerName: string | null = null;
  try {
    containerName = container ? (await readFile("/etc/hostname", "utf8")).trim() : null;
  } catch {
    containerName = null;
  }

  return classifyEnvironment({
    cwd: absoluteCwd,
    hasGit: insideGit && Boolean(gitVersion),
    hasWritableFs: writable,
    hasReadableFs: readable,
    canSpawn: Boolean(gitVersion),
    persistence,
    ci,
    container,
    isWorktree,
    gitVersion,
    gitDir,
    gitCommonDir,
    signals: {
      githubActions: process.env.GITHUB_ACTIONS === "true",
      ci: Boolean(process.env.CI),
      container,
      containerName,
    },
  });
}
