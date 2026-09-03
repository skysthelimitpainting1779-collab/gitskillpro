#!/usr/bin/env node

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { discoverBeads } from "../adapters/beads.js";
import { planContext7Request, type Context7PlanInput } from "../adapters/context7.js";
import { LocalGitAdapter } from "../adapters/local-git.js";
import { verifyIdempotency, type IdempotencyInput } from "../automation/idempotency.js";
import { analyzeAutomationLoops, type AutomationLoopInput } from "../automation/loops.js";
import { evaluateAutomationAuthority } from "../automation/policy.js";
import { discoverRepositoryAutomation } from "../automation/discovery.js";
import type { AutomationActor, AutomationOperation, AutomationScope } from "../automation/types.js";
import { auditAutomation, type AutomationAuditInput } from "../audits/automation.js";
import { auditCi, type CiAuditInput } from "../audits/ci.js";
import { auditDatabase, type DatabaseAuditInput } from "../audits/database.js";
import { auditDeployment, type DeploymentAuditInput } from "../audits/deployment.js";
import { auditGit } from "../audits/git.js";
import { auditMergeGroup, type MergeGroupAuditInput } from "../audits/merge-group.js";
import { auditPullRequest, type PullRequestAuditInput } from "../audits/pr.js";
import { planGreenfieldBootstrap } from "../bootstrap/greenfield.js";
import { createChangeManifest, validateChangeManifest, type ChangeManifestInput } from "../change/manifest.js";
import { auditChangeStack, type ChangeStackAuditInput } from "../change/stack.js";
import { createCheckpoint, type ContextCheckpointInput } from "../context/checkpoint.js";
import { reportContextCost, type ContextCostInput } from "../context/cost.js";
import { planContext } from "../context/planner.js";
import type { ContextPlanInput } from "../context/types.js";
import { inspectCurrentEnvironment } from "../core/environment.js";
import { planIntent } from "../core/operation.js";
import { planDelegation } from "../delegation/planner.js";
import { detectRepositoryProviders } from "../providers/detect.js";
import { diagnoseCiBaseline, type CiRunEvidence } from "../recovery/ci-baseline.js";
import { planProjectRecovery, type ProjectRecoveryInput } from "../recovery/planner.js";
import { planRelease, type ReleasePlanInput } from "../release/plan.js";

interface AutomationPlanSnapshot {
  actor: AutomationActor;
  operation: AutomationOperation;
  scope?: AutomationScope;
}

export const HELP = `GitSkillPro (gsp)\n\nUsage:\n  gsp doctor [--json]\n  gsp inspect [--json]\n  gsp detect providers [--json]\n  gsp audit git [--json]\n  gsp audit beads [--json]\n  gsp audit ci <snapshot.json> [--json]\n  gsp audit pr <snapshot.json> [--json]\n  gsp audit deploy <snapshot.json> [--json]\n  gsp audit db <snapshot.json> [--json]\n  gsp automation discover [--json]\n  gsp automation audit <snapshot.json> [--json]\n  gsp automation plan <snapshot.json> [--json]\n  gsp automation detect-loops <snapshot.json> [--json]\n  gsp automation verify-idempotency <snapshot.json> [--json]\n  gsp change manifest <snapshot.json> [--json]\n  gsp change audit-stack <snapshot.json> [--json]\n  gsp merge-group audit <snapshot.json> [--json]\n  gsp release plan <snapshot.json> [--json]\n  gsp bootstrap plan [--json]\n  gsp delegate plan <issue-id> <title> [--json]\n  gsp recover project <snapshot.json> [--json]\n  gsp recover ci <snapshot.json> [--json]\n  gsp context plan <snapshot.json> [--json]\n  gsp context checkpoint <snapshot.json> [--json]\n  gsp docs plan <snapshot.json> [--json]\n  gsp cost report <snapshot.json> [--json]\n  gsp plan <intent> [--json]\n`;

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

function jsonFlag(argv: string[]): boolean { return argv.includes("--json"); }
function withoutFlags(argv: string[]): string[] { return argv.filter((value) => !value.startsWith("--")); }

function write(io: CliIO, value: unknown, asJson: boolean): void {
  if (asJson) io.stdout(`${JSON.stringify(value, null, 2)}\n`);
  else if (typeof value === "string") io.stdout(`${value.endsWith("\n") ? value : `${value}\n`}`);
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

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasArray(record: Record<string, unknown>, key: string): boolean { return Array.isArray(record[key]); }
function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} snapshot must be a JSON object`);
  return value;
}

function validateRecoverySnapshot(value: unknown): asserts value is ProjectRecoveryInput {
  const record = requireRecord(value, "Recovery");
  for (const key of ["artifacts", "edges", "defaultBranchCiRuns", "pullRequests", "workItems"]) {
    if (!hasArray(record, key)) throw new Error(`Recovery snapshot field ${key} must be an array`);
  }
  if (!isRecord(record.completionPolicy)) throw new Error("Recovery snapshot completionPolicy must be an object");
  if (!isRecord(record.completionEvidence)) throw new Error("Recovery snapshot completionEvidence must be an object");
}

function recoveryCiRuns(value: unknown): CiRunEvidence[] {
  const record = requireRecord(value, "Recovery CI");
  if (!Array.isArray(record.defaultBranchCiRuns)) throw new Error("Recovery CI snapshot must contain defaultBranchCiRuns as an array");
  return record.defaultBranchCiRuns as CiRunEvidence[];
}

async function readJsonSnapshot(cwd: string, inputPath: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(cwd, inputPath), "utf8")) as unknown;
}

async function auditSnapshotPath<T>(cwd: string, inputPath: string | undefined, label: string): Promise<T> {
  if (!inputPath) throw new Error(`${label} requires <snapshot.json>`);
  const value = await readJsonSnapshot(cwd, inputPath);
  requireRecord(value, label);
  return value as T;
}

export async function runCli(argv: string[] = process.argv.slice(2), io: CliIO = defaultIO): Promise<number> {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) { io.stdout(HELP); return 0; }

  const asJson = jsonFlag(argv);
  const args = withoutFlags(argv);
  const [command, subcommand, ...rest] = args;

  try {
    if (command === "doctor") { const snapshot = await inspectCurrentEnvironment(io.cwd); write(io, asJson ? snapshot : humanDoctor(snapshot), asJson); return 0; }
    if (command === "inspect") { const snapshot = await new LocalGitAdapter().inspectRepository(io.cwd); write(io, asJson ? snapshot : humanInspect(snapshot), asJson); return 0; }
    if (command === "detect" && subcommand === "providers") { write(io, await detectRepositoryProviders(io.cwd), asJson); return 0; }

    if (command === "audit" && subcommand === "git") {
      const snapshot = await new LocalGitAdapter().inspectRepository(io.cwd);
      const audit = auditGit(snapshot);
      write(io, { repository: { root: snapshot.root, branch: snapshot.branch, headSha: snapshot.headSha }, ...audit }, asJson);
      return audit.findings.some((finding) => finding.severity === "error") ? 1 : 0;
    }
    if (command === "audit" && subcommand === "beads") { write(io, await discoverBeads(io.cwd), asJson); return 0; }
    if (command === "audit" && subcommand === "ci") { write(io, auditCi(await auditSnapshotPath<CiAuditInput>(io.cwd, rest[0], "gsp audit ci")), asJson); return 0; }
    if (command === "audit" && subcommand === "pr") { write(io, auditPullRequest(await auditSnapshotPath<PullRequestAuditInput>(io.cwd, rest[0], "gsp audit pr")), asJson); return 0; }
    if (command === "audit" && subcommand === "deploy") { write(io, auditDeployment(await auditSnapshotPath<DeploymentAuditInput>(io.cwd, rest[0], "gsp audit deploy")), asJson); return 0; }
    if (command === "audit" && subcommand === "db") { write(io, auditDatabase(await auditSnapshotPath<DatabaseAuditInput>(io.cwd, rest[0], "gsp audit db")), asJson); return 0; }

    if (command === "automation" && subcommand === "discover") { write(io, await discoverRepositoryAutomation(io.cwd), asJson); return 0; }
    if (command === "automation" && subcommand === "audit") { write(io, auditAutomation(await auditSnapshotPath<AutomationAuditInput>(io.cwd, rest[0], "gsp automation audit")), asJson); return 0; }
    if (command === "automation" && subcommand === "plan") {
      const input = await auditSnapshotPath<AutomationPlanSnapshot>(io.cwd, rest[0], "gsp automation plan");
      write(io, { ...evaluateAutomationAuthority(input.actor, input.operation, input.scope ?? {}), executionPerformed: false }, asJson);
      return 0;
    }
    if (command === "automation" && subcommand === "detect-loops") { write(io, analyzeAutomationLoops(await auditSnapshotPath<AutomationLoopInput>(io.cwd, rest[0], "gsp automation detect-loops")), asJson); return 0; }
    if (command === "automation" && subcommand === "verify-idempotency") { write(io, verifyIdempotency(await auditSnapshotPath<IdempotencyInput>(io.cwd, rest[0], "gsp automation verify-idempotency")), asJson); return 0; }

    if (command === "change" && subcommand === "manifest") {
      const manifest = createChangeManifest(await auditSnapshotPath<ChangeManifestInput>(io.cwd, rest[0], "gsp change manifest"));
      write(io, { manifest, validation: validateChangeManifest(manifest) }, asJson);
      return 0;
    }
    if (command === "change" && subcommand === "audit-stack") { write(io, auditChangeStack(await auditSnapshotPath<ChangeStackAuditInput>(io.cwd, rest[0], "gsp change audit-stack")), asJson); return 0; }
    if (command === "merge-group" && subcommand === "audit") { write(io, auditMergeGroup(await auditSnapshotPath<MergeGroupAuditInput>(io.cwd, rest[0], "gsp merge-group audit")), asJson); return 0; }
    if (command === "release" && subcommand === "plan") { write(io, planRelease(await auditSnapshotPath<ReleasePlanInput>(io.cwd, rest[0], "gsp release plan")), asJson); return 0; }

    if (command === "bootstrap" && subcommand === "plan") { write(io, planGreenfieldBootstrap({ repositoryExists: existsSync(resolve(io.cwd, ".git")) }), asJson); return 0; }

    if (command === "delegate" && subcommand === "plan") {
      const [issueId, ...titleParts] = rest;
      const title = titleParts.join(" ").trim();
      if (!issueId || !title) { io.stderr("gsp delegate plan requires <issue-id> and <title>\n"); return 2; }
      const environment = await inspectCurrentEnvironment(io.cwd);
      write(io, planDelegation({ issueId, title, capabilities: environment.capabilities }), asJson);
      return 0;
    }

    if (command === "recover" && (subcommand === "project" || subcommand === "ci")) {
      const [snapshotPath] = rest;
      if (!snapshotPath) { io.stderr(`gsp recover ${subcommand} requires <snapshot.json>\n`); return 2; }
      const snapshot = await readJsonSnapshot(io.cwd, snapshotPath);
      if (subcommand === "project") { validateRecoverySnapshot(snapshot); write(io, planProjectRecovery(snapshot), asJson); }
      else write(io, diagnoseCiBaseline(recoveryCiRuns(snapshot)), asJson);
      return 0;
    }

    if (command === "context" && subcommand === "plan") { write(io, planContext(await auditSnapshotPath<ContextPlanInput>(io.cwd, rest[0], "gsp context plan")), asJson); return 0; }
    if (command === "context" && subcommand === "checkpoint") { write(io, createCheckpoint(await auditSnapshotPath<ContextCheckpointInput>(io.cwd, rest[0], "gsp context checkpoint")), asJson); return 0; }
    if (command === "docs" && subcommand === "plan") { write(io, planContext7Request(await auditSnapshotPath<Context7PlanInput>(io.cwd, rest[0], "gsp docs plan")), asJson); return 0; }
    if (command === "cost" && subcommand === "report") { write(io, reportContextCost(await auditSnapshotPath<ContextCostInput>(io.cwd, rest[0], "gsp cost report")), asJson); return 0; }

    if (command === "plan") {
      const intent = [subcommand, ...rest].filter(Boolean).join(" ").trim();
      if (!intent) { io.stderr("gsp plan requires an intent\n"); return 2; }
      write(io, planIntent(intent), asJson);
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
  runCli().then((code) => { process.exitCode = code; });
}
