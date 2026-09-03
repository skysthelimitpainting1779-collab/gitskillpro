import { execFile } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile, readdir, stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import type { AutomationActor, AutomationActorKind, AutomationObservedOperation } from "./types.js";

const execFileAsync = promisify(execFile);

export interface AutomationEvidence {
  source: string;
  fact: string;
  observedOperations: AutomationObservedOperation[];
}

export interface AutomationDiscoveryResult {
  actors: AutomationActor[];
  evidence: AutomationEvidence[];
  gitHooksPath?: string;
  unknownWriterRisk: boolean;
}

async function exists(path: string): Promise<boolean> {
  try { await stat(path); return true; } catch { return false; }
}

async function git(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, encoding: "utf8" });
    return stdout.trim() || undefined;
  } catch { return undefined; }
}

function operations(text: string): AutomationObservedOperation[] {
  const found = new Set<AutomationObservedOperation>();
  const checks: Array<[AutomationObservedOperation, RegExp]> = [
    ["stage", /\bgit\s+(?:add|stage)\b/i],
    ["amend", /\bgit\s+commit\b[^\n;&|]*--amend\b/i],
    ["commit", /\bgit\s+commit\b/i],
    ["force-push", /\bgit\s+push\b[^\n;&|]*(?:--force(?:-with-lease)?|-f\b)/i],
    ["push", /\bgit\s+push\b/i],
    ["pr", /\b(?:gh\s+pr\s+(?:create|edit)|pull[_ -]?request|createPullRequest)\b/i],
    ["review", /\b(?:gh\s+pr\s+review|approvePullRequest|requestChanges)\b/i],
    ["merge", /\b(?:git\s+merge\b|gh\s+pr\s+merge\b|mergePullRequest)\b/i],
    ["tag", /\bgit\s+tag\b/i],
    ["release", /\b(?:gh\s+release\s+create|npm\s+publish|release-it|semantic-release)\b/i],
    ["deploy", /\b(?:vercel\s+(?:deploy|--prod)|wrangler\s+deploy|kubectl\s+(?:apply|rollout)|fly\s+deploy)\b/i],
  ];
  for (const [name, pattern] of checks) if (pattern.test(text)) found.add(name);
  return [...found];
}

function actor(id: string, kind: AutomationActorKind, source: string, trigger: string, observedOperations: AutomationObservedOperation[] = []): AutomationActor {
  return { id, kind, source, trigger, authorities: [], observedOperations };
}

async function addHookActors(root: string, hooksDir: string, actors: AutomationActor[], evidence: AutomationEvidence[]): Promise<void> {
  if (!(await exists(hooksDir))) return;
  const entries = await readdir(hooksDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || entry.name.endsWith(".sample")) continue;
    const path = join(hooksDir, entry.name);
    let executable = false;
    try { await access(path, constants.X_OK); executable = true; } catch { /* evidence still matters */ }
    const content = await readFile(path, "utf8").catch(() => "");
    const observedOperations = operations(content);
    const source = relative(root, path) || path;
    actors.push(actor(`hook:${source}`, "hook", source, entry.name, observedOperations));
    evidence.push({ source, fact: executable ? "Git hook file is executable." : "Git hook file exists.", observedOperations });
  }
}

async function addPackageScripts(root: string, actors: AutomationActor[], evidence: AutomationEvidence[]): Promise<void> {
  const path = join(root, "package.json");
  if (!(await exists(path))) return;
  try {
    const pkg = JSON.parse(await readFile(path, "utf8")) as { scripts?: Record<string, string> };
    for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
      const observedOperations = operations(command);
      if (!observedOperations.length) continue;
      const source = `package.json#scripts.${name}`;
      actors.push(actor(`package-script:${name}`, "unknown", source, `npm-script:${name}`, observedOperations));
      evidence.push({ source, fact: `Package script contains repository mutation operations: ${observedOperations.join(", ")}.`, observedOperations });
    }
  } catch {
    evidence.push({ source: "package.json", fact: "package.json could not be parsed for automation discovery.", observedOperations: [] });
  }
}

async function addWorkflowActors(root: string, actors: AutomationActor[], evidence: AutomationEvidence[]): Promise<void> {
  const dir = join(root, ".github", "workflows");
  if (!(await exists(dir))) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) continue;
    const path = join(dir, entry.name);
    const content = await readFile(path, "utf8").catch(() => "");
    const observedOperations = operations(content);
    if (!observedOperations.length) continue;
    const source = relative(root, path);
    actors.push(actor(`workflow:${entry.name}`, "ci-bot", source, "github-actions", observedOperations));
    evidence.push({ source, fact: `Workflow contains repository mutation operations: ${observedOperations.join(", ")}.`, observedOperations });
  }
}

async function addHookManagers(root: string, actors: AutomationActor[], evidence: AutomationEvidence[]): Promise<void> {
  const dirs = [".husky", ".githooks"];
  for (const name of dirs) {
    const dir = join(root, name);
    if (!(await exists(dir))) continue;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (!entry.isFile() || entry.name.startsWith("_")) continue;
      const path = join(dir, entry.name);
      const content = await readFile(path, "utf8").catch(() => "");
      const observedOperations = operations(content);
      const source = relative(root, path);
      actors.push(actor(`hook-manager:${source}`, "hook", source, entry.name, observedOperations));
      evidence.push({ source, fact: `${name} hook-manager file exists.`, observedOperations });
    }
  }

  for (const filename of ["lefthook.yml", "lefthook.yaml", ".pre-commit-config.yaml", ".pre-commit-config.yml"]) {
    const path = join(root, filename);
    if (!(await exists(path))) continue;
    const content = await readFile(path, "utf8").catch(() => "");
    const observedOperations = operations(content);
    actors.push(actor(`hook-manager:${filename}`, "hook", filename, "hook-manager", observedOperations));
    evidence.push({ source: filename, fact: "Hook-manager configuration exists.", observedOperations });
  }
}

async function addKnownBots(root: string, actors: AutomationActor[], evidence: AutomationEvidence[]): Promise<void> {
  const configs: Array<[string, AutomationActorKind]> = [
    [".github/dependabot.yml", "dependency-bot"],
    [".github/dependabot.yaml", "dependency-bot"],
    ["renovate.json", "dependency-bot"],
    ["renovate.json5", "dependency-bot"],
    [".renovaterc", "dependency-bot"],
    [".releaserc", "release-bot"],
    ["release-please-config.json", "release-bot"],
  ];
  for (const [filename, kind] of configs) {
    if (!(await exists(join(root, filename)))) continue;
    actors.push(actor(`${kind}:${filename}`, kind, filename, "configured", []));
    evidence.push({ source: filename, fact: `${kind} configuration exists; write authority is not inferred from configuration presence.`, observedOperations: [] });
  }
}

async function addScriptDirectory(root: string, actors: AutomationActor[], evidence: AutomationEvidence[]): Promise<void> {
  const dir = join(root, "scripts");
  if (!(await exists(dir))) return;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(?:sh|bash|zsh|ps1|py|mjs|cjs|js|ts)$/i.test(entry.name)) continue;
    const path = join(dir, entry.name);
    const content = await readFile(path, "utf8").catch(() => "");
    const observedOperations = operations(content);
    if (!observedOperations.length) continue;
    const source = relative(root, path);
    actors.push(actor(`script:${entry.name}`, "unknown", source, "script", observedOperations));
    evidence.push({ source, fact: `Script contains repository mutation operations: ${observedOperations.join(", ")}.`, observedOperations });
  }
}

export async function discoverRepositoryAutomation(cwd = process.cwd()): Promise<AutomationDiscoveryResult> {
  const rootOutput = await git(cwd, ["rev-parse", "--show-toplevel"]);
  const root = rootOutput ? resolve(rootOutput) : resolve(cwd);
  const actors: AutomationActor[] = [];
  const evidence: AutomationEvidence[] = [];

  const configuredHooksPath = await git(root, ["config", "--get", "core.hooksPath"]);
  const gitDir = await git(root, ["rev-parse", "--path-format=absolute", "--git-dir"]);
  const hooksDir = configuredHooksPath ? resolve(root, configuredHooksPath) : gitDir ? join(gitDir, "hooks") : join(root, ".git", "hooks");

  await addHookActors(root, hooksDir, actors, evidence);
  await addHookManagers(root, actors, evidence);
  await addPackageScripts(root, actors, evidence);
  await addWorkflowActors(root, actors, evidence);
  await addKnownBots(root, actors, evidence);
  await addScriptDirectory(root, actors, evidence);

  const deduped = new Map<string, AutomationActor>();
  for (const item of actors) if (!deduped.has(item.id)) deduped.set(item.id, item);

  return {
    actors: [...deduped.values()],
    evidence,
    gitHooksPath: configuredHooksPath ? relative(root, hooksDir) || configuredHooksPath : undefined,
    unknownWriterRisk: [...deduped.values()].some((item) => item.kind === "unknown" && (item.observedOperations?.length ?? 0) > 0),
  };
}
