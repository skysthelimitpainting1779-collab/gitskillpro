#!/usr/bin/env node

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { LocalGitAdapter } from "../adapters/local-git.js";
import { discoverBeads } from "../adapters/beads.js";
import { auditGit } from "../audits/git.js";
import { planGreenfieldBootstrap } from "../bootstrap/greenfield.js";
import { inspectCurrentEnvironment } from "../core/environment.js";
import { planIntent } from "../core/operation.js";
import { planDelegation } from "../delegation/planner.js";

export const HELP = `GitSkillPro (gsp)\n\nUsage:\n  gsp doctor [--json]\n  gsp inspect [--json]\n  gsp audit git [--json]\n  gsp audit beads [--json]\n  gsp bootstrap plan [--json]\n  gsp delegate plan <issue-id> <title> [--json]\n  gsp plan <intent> [--json]\n`;

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
