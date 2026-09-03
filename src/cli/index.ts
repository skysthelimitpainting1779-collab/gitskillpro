#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { discoverBeads } from "../adapters/beads.js";
import { LocalGitAdapter } from "../adapters/local-git.js";
import { auditGit } from "../audits/git.js";
import { planGreenfieldBootstrap } from "../bootstrap/greenfield.js";
import { inspectCurrentEnvironment } from "../core/environment.js";
import { planIntent } from "../core/operation.js";
import { planDelegation } from "../delegation/planner.js";
import { diagnoseCiBaseline, type CiRunEvidence } from "../recovery/ci-baseline.js";
import { planProjectRecovery, type ProjectRecoveryInput } from "../recovery/planner.js";

export const HELP = `GitSkillPro (gsp)\n\nUsage:\n  gsp doctor [--json]\n  gsp inspect [--json]\n  gsp audit git [--json]\n  gsp audit beads [--json]\n  gsp bootstrap plan [--json]\n  gsp delegate plan <issue-id> <title> [--json]\n  gsp recover project <snapshot.json> [--json]\n  gsp recover ci <snapshot.json> [--json]\n  gsp plan <intent> [--json]\n`;

export interface CliIO {
  cwd: string;
  stdout: (value: string) => void;
  stderr: (value: string) => void;
}

const defaultIO: CliIO = {
  cwd: process.cwd(),
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
};

function jsonFlag(argv: string[]): boolean {
  return argv.includes("--json");
}

function withoutFlags(argv: string[]): string[] {
  return argv.filter((value) => !value.startsWith("--"));
}

function write(io: CliIO, value: unknown, asJson: boolean): void {
  if (asJson) {
    io.stdout(`${JSON.stringify(value, null, 2)}\n`);
    return;
  }
  if (typeof value === "string") io.stdout(`${value.endsWith("\n") ? value : `${value}\n`}`);
  else io.stdout(`${JSON.stringify(value, null, 2)}\n`);
}

function humanDoctor(snapshot: Awaited<ReturnType<typeof inspectCurrentEnvironment>>): string {
  return [
    `Environment: ${snapshot.kind}`,
    `Persistence: ${snapshot.persistence}`,
    `Capabilities: ${snapshot.capabilities.length ? snapshot.capabilities.join(", ") : "none proven"}`,
    snapshot.gitVersion ? `Git: ${snapshot.gitVersion}` : "Git: not proven",
  ].join("\n");
}

function humanInspect(snapshot: Awaited<ReturnType<LocalGitAdapter["inspectRepository"]>>): string {
  return [
    `Repository: ${snapshot.root}`,
    `Branch: ${snapshot.branch ?? "detached/unknown"}`,
    `HEAD: ${snapshot.headSha ?? "unborn/unknown"}`,
    `Dirty: ${snapshot.dirty ? "yes" : "no"}`,
    `Worktrees: ${snapshot.worktrees.length}`,
  ].join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasArray(record: Record<string, unknown>, key: string): boolean {
  return Array.isArray(record[key]);
}

function validateRecoverySnapshot(value: unknown): asserts value is ProjectRecoveryInput {
  if (!isRecord(value)) throw new Error("Recovery snapshot must be a JSON object");
  for (const key of ["artifacts", "edges", "defaultBranchCiRuns", "pullRequests", "workItems"]) {
    if (!hasArray(value, key)) throw new Error(`Recovery snapshot field ${key} must be an array`);
  }
  if (!isRecord(value.completionPolicy)) throw new Error("Recovery snapshot completionPolicy must be an object");
  if (!isRecord(value.completionEvidence)) throw new Error("Recovery snapshot completionEvidence must be an object");
}

function recoveryCiRuns(value: unknown): CiRunEvidence[] {
  if (!isRecord(value) || !Array.isArray(value.defaultBranchCiRuns)) {
    throw new Error("Recovery CI snapshot must contain defaultBranchCiRuns as an array");
  }
  return value.defaultBranchCiRuns as CiRunEvidence[];
}

async function readJsonSnapshot(cwd: string, inputPath: string): Promise<unknown> {
  const fullPath = resolve(cwd, inputPath);
  const raw = await readFile(fullPath, "utf8");
  return JSON.parse(raw) as unknown;
}

export async function runCli(argv: string[] = process.argv.slice(2), io: CliIO = defaultIO): Promise<number> {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    io.stdout(HELP);
    return 0;
  }

  const asJson = jsonFlag(argv);
  const args = withoutFlags(argv);
  const [command, subcommand, ...rest] = args;

  try {
    if (command === "doctor") {
      const snapshot = await inspectCurrentEnvironment(io.cwd);
      write(io, asJson ? snapshot : humanDoctor(snapshot), asJson);
      return 0;
    }

    if (command === "inspect") {
      const snapshot = await new LocalGitAdapter().inspectRepository(io.cwd);
      write(io, asJson ? snapshot : humanInspect(snapshot), asJson);
      return 0;
    }

    if (command === "audit" && subcommand === "git") {
      const snapshot = await new LocalGitAdapter().inspectRepository(io.cwd);
      const audit = auditGit(snapshot);
      write(io, { repository: { root: snapshot.root, branch: snapshot.branch, headSha: snapshot.headSha }, ...audit }, asJson);
      return audit.findings.some((finding) => finding.severity === "error") ? 1 : 0;
    }

    if (command === "audit" && subcommand === "beads") {
      const snapshot = await discoverBeads(io.cwd);
      write(io, snapshot, asJson);
      return 0;
    }

    if (command === "bootstrap" && subcommand === "plan") {
      const plan = planGreenfieldBootstrap({
        repositoryExists: existsSync(resolve(io.cwd, ".git")),
      });
      write(io, plan, asJson);
      return 0;
    }

    if (command === "delegate" && subcommand === "plan") {
      const [issueId, ...titleParts] = rest;
      const title = titleParts.join(" ").trim();
      if (!issueId || !title) {
        io.stderr("gsp delegate plan requires <issue-id> and <title>\n");
        return 2;
      }
      const environment = await inspectCurrentEnvironment(io.cwd);
      const plan = planDelegation({ issueId, title, capabilities: environment.capabilities });
      write(io, plan, asJson);
      return 0;
    }

    if (command === "recover" && (subcommand === "project" || subcommand === "ci")) {
      const [snapshotPath] = rest;
      if (!snapshotPath) {
        io.stderr(`gsp recover ${subcommand} requires <snapshot.json>\n`);
        return 2;
      }
      const snapshot = await readJsonSnapshot(io.cwd, snapshotPath);
      if (subcommand === "project") {
        validateRecoverySnapshot(snapshot);
        write(io, planProjectRecovery(snapshot), asJson);
      } else {
        write(io, diagnoseCiBaseline(recoveryCiRuns(snapshot)), asJson);
      }
      return 0;
    }

    if (command === "plan") {
      const intent = [subcommand, ...rest].filter(Boolean).join(" ").trim();
      if (!intent) {
        io.stderr("gsp plan requires an intent\n");
        return 2;
      }
      const plan = planIntent(intent);
      write(io, plan, asJson);
      return 0;
    }

    io.stderr(`Unknown command: ${args.join(" ")}\n\n${HELP}`);
    return 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (asJson) io.stderr(`${JSON.stringify({ ok: false, error: message }, null, 2)}\n`);
    else io.stderr(`GitSkillPro error: ${message}\n`);
    return 1;
  }
}

const entry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : undefined;
if (entry === import.meta.url) {
  runCli().then((code) => {
    process.exitCode = code;
  });
}
