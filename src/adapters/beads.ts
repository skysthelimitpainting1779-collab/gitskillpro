import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type BeadsStorageMode = "embedded" | "single_writer" | "server" | "shared_server" | "unknown";

export interface BeadsSnapshot {
  installed: boolean;
  version?: string;
  projectPresent: boolean;
  projectPath?: string;
  storageMode: BeadsStorageMode;
  capabilities: string[];
  serverHealthy?: boolean;
  capturedAt?: string;
}

export interface BeadsConcurrencyAssessment {
  safeConcurrentWrites: boolean;
  reason: string;
}

const KNOWN_COMMANDS = [
  "ready",
  "list",
  "show",
  "status",
  "doctor",
  "update",
  "create",
  "close",
  "reopen",
  "dep",
  "dolt",
  "sync",
] as const;

async function runBd(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("bd", args, { cwd, encoding: "utf8" });
    return stdout.trim();
  } catch {
    return undefined;
  }
}

export function parseBeadsCapabilities(help: string): Set<string> {
  const found = new Set<string>();
  for (const command of KNOWN_COMMANDS) {
    const pattern = new RegExp(`(^|\\s)${command.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?=\\s|$)`, "m");
    if (pattern.test(help)) found.add(command);
  }
  return found;
}

function inferStorageMode(text: string): BeadsStorageMode {
  const normalized = text.toLowerCase();
  if (/shared[_ -]?server/.test(normalized)) return "shared_server";
  if (/\bserver\b/.test(normalized)) return "server";
  if (/single[_ -]?writer/.test(normalized)) return "single_writer";
  if (/\bembedded\b/.test(normalized)) return "embedded";
  return "unknown";
}

async function inspectProjectConfig(projectPath: string): Promise<BeadsStorageMode> {
  const candidates = ["config.json", "config.yaml", "config.yml", "metadata.json", "README.md"];
  for (const file of candidates) {
    try {
      const content = await readFile(join(projectPath, file), "utf8");
      const inferred = inferStorageMode(content);
      if (inferred !== "unknown") return inferred;
    } catch {
      // Absence or unreadable optional configuration remains unknown.
    }
  }
  return "unknown";
}

export async function discoverBeads(cwd = process.cwd()): Promise<BeadsSnapshot> {
  const [versionOutput, helpOutput] = await Promise.all([runBd(cwd, ["--version"]), runBd(cwd, ["--help"])]);
  const projectPath = join(cwd, ".beads");
  let projectPresent = false;
  try {
    await access(projectPath, constants.R_OK);
    projectPresent = true;
  } catch {
    projectPresent = false;
  }

  const storageMode = projectPresent ? await inspectProjectConfig(projectPath) : "unknown";
  return {
    installed: versionOutput !== undefined || helpOutput !== undefined,
    version: versionOutput,
    projectPresent,
    projectPath: projectPresent ? projectPath : undefined,
    storageMode,
    capabilities: [...parseBeadsCapabilities(helpOutput ?? "")].sort(),
    capturedAt: new Date().toISOString(),
  };
}

export function assessBeadsConcurrency(snapshot: Pick<BeadsSnapshot, "installed" | "projectPresent" | "storageMode" | "capabilities" | "serverHealthy">): BeadsConcurrencyAssessment {
  if (!snapshot.installed) return { safeConcurrentWrites: false, reason: "Beads is not proven installed." };
  if (!snapshot.projectPresent) return { safeConcurrentWrites: false, reason: "No Beads project is proven for this working directory." };

  if (snapshot.storageMode === "server" || snapshot.storageMode === "shared_server") {
    if (snapshot.serverHealthy === true) return { safeConcurrentWrites: true, reason: "Server-backed storage has explicit healthy-server evidence." };
    return { safeConcurrentWrites: false, reason: "Server-backed storage lacks explicit healthy-server evidence." };
  }

  if (snapshot.storageMode === "embedded" || snapshot.storageMode === "single_writer") {
    return { safeConcurrentWrites: false, reason: `${snapshot.storageMode} storage is not treated as safe for concurrent agent writers.` };
  }

  return { safeConcurrentWrites: false, reason: "Beads storage/concurrency mode is unknown." };
}
