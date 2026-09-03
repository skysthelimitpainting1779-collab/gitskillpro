# GitSkillPro Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working GitSkillPro vertical slice: a TypeScript core, environment/capability discovery, risk/policy engine, evidence model, read-only local Git inspection, CLI, Agent Skill, CI, and regression tests.

**Architecture:** The full product is too broad for one safe implementation plan, so this plan deliberately builds the stable foundation that every later subsystem consumes. Provider/workflow/recovery/context/frontier features remain separate follow-on plans, but their contracts are represented in extensible core types now so later adapters do not need to rewrite safety semantics.

**Tech Stack:** Node.js 22+, TypeScript 5.x, Vitest, npm, GitHub Actions. Runtime code uses Node standard library only in this foundation phase; external provider SDKs and MCP SDK are deferred to later plans.

**Spec:** `SPEC.md`, then cumulative requirements from `SPEC-v0.2.md`, `SPEC-v0.3.md`, `SPEC-v0.4.md`, `SPEC-v0.5.md`, and `SPEC-v0.6.md`.

## Global Constraints

- `SPEC.md` through `SPEC-v0.6.md` are cumulative; newest spec wins where requirements conflict.
- This phase is a **read/audit/plan vertical slice**. It MUST NOT auto-merge, auto-deploy, mutate databases, change repository governance, or perform provider mutations.
- Environment/capability detection MUST prefer truthful partial knowledge over invented completeness.
- Local Git inspection MUST NOT modify repository state.
- Unknown capabilities and unknown Git primitives default safe: observation allowed when proven read-only; mutation denied until classified.
- GitSkillPro MUST assume concurrent actors; snapshots carry repository/head identity and callers must be able to detect stale assumptions.
- Evidence MUST distinguish observation, plan, attempted mutation, and proven persistence.
- The Skill, CLI, and future MCP/plugin surfaces MUST share the same core policy vocabulary rather than duplicating rules.
- Large provider/frontier references stay load-on-demand; the core Skill remains concise.
- Behavior-changing code is test-first.
- CI must verify typecheck, tests, build, and CLI smoke behavior before the branch is considered merge-ready.

---

## Scope decomposition

The approved specs contain multiple independent subsystems. Build them as separate implementation plans:

1. **Foundation — this plan:** core contracts, discovery, policy, evidence, local Git audit, CLI, Skill, CI.
2. **Workflow + work graphs:** Linear, Beads, issue→branch/worktree→PR lifecycle, agent comments/reviews, greenfield bootstrap.
3. **Recovery:** project archaeology, CI baseline diagnosis, PR classification/salvage, tracker reconciliation.
4. **Providers + database:** GitHub remote adapter, Vercel, Cloudflare, Hostinger, Supabase/database abstractions and audits.
5. **Context economy:** Context7, progressive retrieval, cache/checkpoints, token/cost telemetry.
6. **Automation + frontier:** auto-commit actors, Change Graph, stacked PRs, merge groups, provenance/SBOM, policy-as-code, progressive delivery, preview DBs, deterministic codemods, A2A/MCP extensions.
7. **MCP + plugin packaging:** real MCP server and OpenAI-compatible plugin package over the proven core.

Each follow-on plan consumes the interfaces produced here.

---

## Target file structure for this phase

```text
/
  AGENTS.md
  package.json
  tsconfig.json
  vitest.config.ts
  .gitignore
  .github/workflows/ci.yml
  skills/git-skill-pro/
    SKILL.md
    README.md
    references/
      primitive-safety.md
      environment.md
  src/
    core/
      types.ts
      environment.ts
      capability-broker.ts
      risk.ts
      policy.ts
      evidence.ts
      operation.ts
    adapters/
      local-git.ts
    audits/
      git.ts
    cli/
      index.ts
    index.ts
  tests/
    environment.test.ts
    broker.test.ts
    risk-policy.test.ts
    evidence.test.ts
    local-git.test.ts
    git-audit.test.ts
    cli.test.ts
    skill-contract.test.ts
```

---

### Task 1: Repository runtime scaffold and CI contract

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `.github/workflows/ci.yml`
- Create: `AGENTS.md`
- Test: `tests/skill-contract.test.ts`

**Interfaces:**
- Consumes: approved specifications only.
- Produces: `npm run typecheck`, `npm test`, `npm run build`, and `npm run gsp -- --help` as the repository verification contract.

- [ ] **Step 1: Write the initial failing repository-contract test**

```ts
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "package.json",
  "tsconfig.json",
  ".github/workflows/ci.yml",
  "AGENTS.md",
  "skills/git-skill-pro/SKILL.md",
];

describe("repository contract", () => {
  it("contains the required GitSkillPro surfaces", () => {
    for (const path of required) expect(existsSync(path), path).toBe(true);
  });

  it("keeps the Agent Skill discoverable", () => {
    const skill = readFileSync("skills/git-skill-pro/SKILL.md", "utf8");
    expect(skill).toMatch(/^---[\s\S]*name:\s*git-skill-pro/m);
    expect(skill).toMatch(/description:\s*Use when/i);
  });
});
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm test -- tests/skill-contract.test.ts`

Expected: FAIL because the project/tooling files and Skill do not exist yet.

- [ ] **Step 3: Add the Node/TypeScript/Vitest scaffold**

`package.json` must define:

```json
{
  "name": "gitskillpro",
  "version": "0.1.0",
  "type": "module",
  "bin": { "gsp": "dist/cli/index.js" },
  "scripts": {
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "build": "tsc -p tsconfig.json",
    "gsp": "tsx src/cli/index.ts"
  },
  "engines": { "node": ">=22" },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.8.0",
    "vitest": "^3.0.0"
  }
}
```

`tsconfig.json` must compile `src/**/*.ts` into `dist/`, use strict mode, NodeNext module resolution, and exclude tests from emitted build output.

- [ ] **Step 4: Add CI**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm install
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: node dist/cli/index.js --help
```

Use `npm install` only until a lockfile is materialized. A later task in this plan must add and switch CI to `npm ci`.

- [ ] **Step 5: Add repository-local agent rules**

`AGENTS.md` must require reading all cumulative specs before behavior changes, test-first implementation, no provider/database/production mutation in this phase, and explicit reporting when a capability cannot be proven.

- [ ] **Step 6: Run verification**

Run:

```bash
npm run typecheck
npm test
npm run build
```

Expected: the Skill contract still fails until Task 8; TypeScript/build should pass for the scaffold once minimal source entrypoints exist.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore .github/workflows/ci.yml AGENTS.md tests/skill-contract.test.ts
git commit -m "build: scaffold GitSkillPro TypeScript and CI"
```

---

### Task 2: Core domain contracts

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/operation.ts`
- Create: `tests/risk-policy.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: shared `RiskTier`, `CapabilityId`, `EnvironmentSnapshot`, `RepositorySnapshot`, `OperationIntent`, `OperationPlan`, `OperationResult`, and `PersistenceProof` types.

- [ ] **Step 1: Write failing type/behavior tests**

```ts
import { describe, expect, it } from "vitest";
import { compareRisk, isMutationRisk } from "../src/core/operation.js";

describe("risk vocabulary", () => {
  it("orders R0 through R4", () => {
    expect(compareRisk("R0", "R3")).toBeLessThan(0);
    expect(compareRisk("R4", "R3")).toBeGreaterThan(0);
  });

  it("treats R1+ as mutation risk", () => {
    expect(isMutationRisk("R0")).toBe(false);
    expect(isMutationRisk("R1")).toBe(true);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tests/risk-policy.test.ts`

Expected: FAIL because core modules are absent.

- [ ] **Step 3: Define exact domain types**

`RiskTier` is the union `"R0" | "R1" | "R2" | "R3" | "R4"`.

`CapabilityId` must include at least:

```ts
export type CapabilityId =
  | "fs.read"
  | "fs.write"
  | "fs.persistent"
  | "process.spawn"
  | "shell"
  | "git.local.read"
  | "git.local.write"
  | "git.worktree"
  | "github.read"
  | "github.write"
  | "ci.inspect"
  | "deployment.inspect"
  | "deployment.write"
  | "database.inspect"
  | "database.write"
  | "agent.delegate"
  | "persistence.prove";
```

`OperationPlan` must carry `intent`, `risk`, `requiredCapabilities`, `preconditions`, `expectedState`, `steps`, and `recovery`.

- [ ] **Step 4: Implement risk helpers**

```ts
const order = ["R0", "R1", "R2", "R3", "R4"] as const;
export const compareRisk = (a: RiskTier, b: RiskTier) => order.indexOf(a) - order.indexOf(b);
export const isMutationRisk = (risk: RiskTier) => compareRisk(risk, "R1") >= 0;
```

- [ ] **Step 5: Run tests and typecheck**

Run:

```bash
npm test -- tests/risk-policy.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/core/operation.ts tests/risk-policy.test.ts
git commit -m "feat: define GitSkillPro core operation contracts"
```

---

### Task 3: Environment and capability discovery

**Files:**
- Create: `src/core/environment.ts`
- Create: `tests/environment.test.ts`

**Interfaces:**
- Consumes: `EnvironmentSnapshot`, `CapabilityId` from `src/core/types.ts`.
- Produces: `classifyEnvironment(input: EnvironmentProbe): EnvironmentSnapshot` and `inspectCurrentEnvironment(): Promise<EnvironmentSnapshot>`.

- [ ] **Step 1: Write failing pure-function tests**

```ts
import { describe, expect, it } from "vitest";
import { classifyEnvironment } from "../src/core/environment.js";

describe("environment discovery", () => {
  it("does not claim persistence for an ephemeral sandbox", () => {
    const result = classifyEnvironment({
      cwd: "/workspace",
      hasGit: true,
      hasWritableFs: true,
      persistence: "ephemeral",
      ci: false,
      container: true,
    });
    expect(result.kind).toBe("ephemeral_sandbox");
    expect(result.capabilities).not.toContain("fs.persistent");
  });

  it("represents unknown persistence honestly", () => {
    const result = classifyEnvironment({ cwd: "/x", persistence: "unknown" });
    expect(result.persistence).toBe("unknown");
  });
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/environment.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement pure classification**

Supported `kind` values must include `local`, `worktree`, `container`, `vps`, `ephemeral_sandbox`, `ci_runner`, `plugin_only`, `read_only`, and `unknown`.

Do not infer a label from one weak signal when capability facts are unknown.

- [ ] **Step 4: Implement live inspection**

Use Node stdlib only. Probe `process.env`, `process.cwd()`, filesystem writability, `.git` presence/form, and whether `git --version` can execute. Failure to probe one capability must not crash the whole inspection.

- [ ] **Step 5: Verify**

Run:

```bash
npm test -- tests/environment.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/environment.ts tests/environment.test.ts
git commit -m "feat: add truthful environment capability discovery"
```

---

### Task 4: Capability broker and adapter boundaries

**Files:**
- Create: `src/core/capability-broker.ts`
- Create: `tests/broker.test.ts`

**Interfaces:**
- Consumes: `CapabilityId`, `OperationIntent`.
- Produces: `CapabilityAdapter` interface and `CapabilityBroker.select(intent, requiredCapabilities)`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { CapabilityBroker } from "../src/core/capability-broker.js";

describe("capability broker", () => {
  it("refuses an adapter that cannot prove a required fact", () => {
    const broker = new CapabilityBroker([
      { id: "github", priority: 100, capabilities: new Set(["github.read"]) },
    ]);
    expect(() => broker.select("inspect-local-status", ["git.local.read"])).toThrow(/no adapter/i);
  });

  it("selects the highest-priority semantically capable adapter", () => {
    const broker = new CapabilityBroker([
      { id: "fallback", priority: 10, capabilities: new Set(["github.read"]) },
      { id: "native", priority: 100, capabilities: new Set(["github.read"]) },
    ]);
    expect(broker.select("inspect-pr", ["github.read"]).id).toBe("native");
  });
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/broker.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement broker**

The broker must select only adapters containing **all** required capability IDs; priority breaks ties. It must return a structured inability error when no adapter qualifies.

- [ ] **Step 4: Verify and commit**

Run `npm test -- tests/broker.test.ts && npm run typecheck`.

Commit:

```bash
git add src/core/capability-broker.ts tests/broker.test.ts
git commit -m "feat: add capability-aware adapter broker"
```

---

### Task 5: Risk and policy engine

**Files:**
- Create: `src/core/risk.ts`
- Create: `src/core/policy.ts`
- Modify: `tests/risk-policy.test.ts`

**Interfaces:**
- Consumes: core operation types.
- Produces: `classifyOperation(intent, impact): RiskTier` and `evaluatePolicy(plan, authority): PolicyDecision`.

- [ ] **Step 1: Extend tests**

```ts
it("denies an R3 operation without explicit mutation authority", () => {
  const decision = evaluatePolicy(
    { intent: "merge-default", risk: "R3", requiredCapabilities: ["github.write"], preconditions: [], expectedState: {}, steps: [], recovery: [] },
    { maxRisk: "R2", allowedCapabilities: ["github.write"] },
  );
  expect(decision.allowed).toBe(false);
});

it("allows read-only inspection with proven read capability", () => {
  const decision = evaluatePolicy(
    { intent: "inspect", risk: "R0", requiredCapabilities: ["git.local.read"], preconditions: [], expectedState: {}, steps: [], recovery: [] },
    { maxRisk: "R0", allowedCapabilities: ["git.local.read"] },
  );
  expect(decision.allowed).toBe(true);
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/risk-policy.test.ts`.

- [ ] **Step 3: Implement policy**

`PolicyDecision` must include `allowed`, `reasons`, and `missingCapabilities`. No implicit upgrade of authority is permitted.

- [ ] **Step 4: Verify and commit**

Run `npm test -- tests/risk-policy.test.ts && npm run typecheck`.

Commit:

```bash
git add src/core/risk.ts src/core/policy.ts tests/risk-policy.test.ts
git commit -m "feat: enforce GitSkillPro risk and authority policy"
```

---

### Task 6: Evidence packet and stale-state semantics

**Files:**
- Create: `src/core/evidence.ts`
- Create: `tests/evidence.test.ts`

**Interfaces:**
- Consumes: environment, repository, operation, result types.
- Produces: `EvidencePacket`, `createEvidencePacket`, `recordObservation`, `recordAttempt`, `recordPersistenceProof`, `isExpectedStateCurrent`.

- [ ] **Step 1: Write failing tests**

```ts
import { describe, expect, it } from "vitest";
import { createEvidencePacket, recordPersistenceProof } from "../src/core/evidence.js";

describe("evidence", () => {
  it("does not imply persistence from an attempted operation", () => {
    const packet = createEvidencePacket({ operationId: "op-1", intent: "inspect" });
    expect(packet.persistence).toBeUndefined();
  });

  it("requires an explicit proof reference for persistence", () => {
    expect(() => recordPersistenceProof(createEvidencePacket({ operationId: "op-2", intent: "push" }), { provider: "github", reference: "" })).toThrow();
  });
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/evidence.test.ts`.

- [ ] **Step 3: Implement packet**

Evidence must support observations, expected state (such as `headSha`), actions attempted, verification results, unknowns, recovery references, and optional persistence proof. Omitted fields are not interpreted as negative facts.

- [ ] **Step 4: Verify and commit**

Run `npm test -- tests/evidence.test.ts && npm run typecheck`.

Commit:

```bash
git add src/core/evidence.ts tests/evidence.test.ts
git commit -m "feat: add provenance-safe evidence packets"
```

---

### Task 7: Read-only local Git adapter

**Files:**
- Create: `src/adapters/local-git.ts`
- Create: `tests/local-git.test.ts`

**Interfaces:**
- Consumes: core adapter/environment types.
- Produces: `LocalGitAdapter.inspectRepository(cwd): Promise<RepositorySnapshot>` and `LocalGitAdapter.listWorktrees(cwd)`.

- [ ] **Step 1: Write tests using temporary repositories**

```ts
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { LocalGitAdapter } from "../src/adapters/local-git.js";

it("reports dirty state without changing it", async () => {
  const dir = await mkdtemp(join(tmpdir(), "gsp-git-"));
  execFileSync("git", ["init", "-b", "main"], { cwd: dir });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: dir });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: dir });
  await writeFile(join(dir, "a.txt"), "one\n");
  execFileSync("git", ["add", "a.txt"], { cwd: dir });
  execFileSync("git", ["commit", "-m", "init"], { cwd: dir });
  await writeFile(join(dir, "a.txt"), "two\n");

  const snapshot = await new LocalGitAdapter().inspectRepository(dir);
  expect(snapshot.dirty).toBe(true);
  expect(execFileSync("git", ["status", "--porcelain"], { cwd: dir, encoding: "utf8" })).not.toBe("");
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/local-git.test.ts`.

- [ ] **Step 3: Implement safe inspection only**

Allowed subprocesses in this phase are read-only Git commands such as `git --version`, `rev-parse`, `status --porcelain=v2 --branch`, `remote -v`, `worktree list --porcelain`, `show-ref`, and `config --get` for relevant read-only settings.

The adapter MUST NOT call `add`, `commit`, `reset`, `clean`, `stash`, `checkout`, `switch`, `merge`, `rebase`, `push`, or any other mutation command.

- [ ] **Step 4: Verify and commit**

Run `npm test -- tests/local-git.test.ts && npm run typecheck`.

Commit:

```bash
git add src/adapters/local-git.ts tests/local-git.test.ts
git commit -m "feat: add read-only local Git inspection adapter"
```

---

### Task 8: Git audit engine

**Files:**
- Create: `src/audits/git.ts`
- Create: `tests/git-audit.test.ts`

**Interfaces:**
- Consumes: `RepositorySnapshot`, environment capabilities.
- Produces: `auditGit(snapshot): GitAuditResult` with findings, severity, evidence, and recommendations.

- [ ] **Step 1: Write failing tests**

```ts
it("flags unexplained dirty work as a collision risk instead of suggesting reset", () => {
  const result = auditGit({ branch: "main", headSha: "abc", dirty: true, detached: false, worktrees: [] });
  expect(result.findings.some((f) => f.code === "UNEXPLAINED_DIRTY_WORK")).toBe(true);
  expect(JSON.stringify(result)).not.toMatch(/reset --hard/i);
});

it("flags detached HEAD as an integration risk", () => {
  const result = auditGit({ branch: null, headSha: "abc", dirty: false, detached: true, worktrees: [] });
  expect(result.findings.some((f) => f.code === "DETACHED_HEAD")).toBe(true);
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/git-audit.test.ts`.

- [ ] **Step 3: Implement foundation findings**

Include at least: detached HEAD, dirty/unexplained work, no upstream, shallow repository when observable, duplicate writable worktree path/branch anomalies, and unknown Git version/capability.

Each finding must separate **observation** from **recommended next action**.

- [ ] **Step 4: Verify and commit**

Run `npm test -- tests/git-audit.test.ts && npm run typecheck`.

Commit:

```bash
git add src/audits/git.ts tests/git-audit.test.ts
git commit -m "feat: add non-destructive Git safety audit"
```

---

### Task 9: CLI vertical slice

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/index.ts`
- Create: `tests/cli.test.ts`

**Interfaces:**
- Consumes: environment discovery, local Git adapter, Git audit.
- Produces CLI commands `gsp doctor`, `gsp inspect`, `gsp audit git`, and `gsp plan <intent>`.

- [ ] **Step 1: Write failing CLI tests**

```ts
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

it("prints help", () => {
  const out = execFileSync("node", ["--import", "tsx", "src/cli/index.ts", "--help"], { encoding: "utf8" });
  expect(out).toContain("gsp doctor");
  expect(out).toContain("gsp audit git");
});
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/cli.test.ts`.

- [ ] **Step 3: Implement CLI without a CLI framework**

Use `process.argv` and Node stdlib to keep the foundation dependency-light. `--json` must produce machine-readable output. Human output must be concise and must not hide unknowns.

`gsp plan <intent>` in this phase produces a non-executing `OperationPlan` and policy assessment only.

- [ ] **Step 4: Verify**

Run:

```bash
npm test -- tests/cli.test.ts
npm run build
node dist/cli/index.js --help
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cli/index.ts src/index.ts tests/cli.test.ts
git commit -m "feat: expose GitSkillPro read and plan CLI"
```

---

### Task 10: Agent Skill and load-on-demand references

**Files:**
- Create: `skills/git-skill-pro/SKILL.md`
- Create: `skills/git-skill-pro/README.md`
- Create: `skills/git-skill-pro/references/primitive-safety.md`
- Create: `skills/git-skill-pro/references/environment.md`
- Modify: `tests/skill-contract.test.ts`

**Interfaces:**
- Consumes: core vocabulary and cumulative specs.
- Produces: a portable Agent Skill that directs agents to use the core lifecycle and load references only when needed.

- [ ] **Step 1: Extend failing skill tests**

Add assertions that the Skill includes:

```ts
expect(skill).toMatch(/discover.*capabilit/i);
expect(skill).toMatch(/assume.*concurr/i);
expect(skill).toMatch(/CI.*code.*deployment.*database/is);
expect(skill).toMatch(/minimum sufficient context/i);
expect(skill).toMatch(/never.*claim.*persistence/is);
```

- [ ] **Step 2: Confirm failure**

Run: `npm test -- tests/skill-contract.test.ts`.

- [ ] **Step 3: Write concise `SKILL.md`**

Frontmatter:

```yaml
---
name: git-skill-pro
description: Use when an agent must inspect, plan, implement, review, recover, or safely coordinate software work involving Git, repositories, pull requests, CI, deployment, databases, work trackers, or concurrent agents.
---
```

The Skill must teach the universal lifecycle, safety tiers, capability truthfulness, concurrency assumption, evidence-before-mutation, separation of CI/merge/deploy/database health, and load-on-demand references. It must not embed the entire primitive/provider registry.

- [ ] **Step 4: Write references**

`primitive-safety.md` contains the foundation Git primitive safety table; `environment.md` contains runtime/capability interpretation rules.

- [ ] **Step 5: Verify and commit**

Run `npm test -- tests/skill-contract.test.ts`.

Commit:

```bash
git add skills/git-skill-pro tests/skill-contract.test.ts
git commit -m "feat: add portable GitSkillPro Agent Skill"
```

---

### Task 11: Lockfile, CI hardening, and package verification

**Files:**
- Create: `package-lock.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: complete foundation package.
- Produces: deterministic npm install contract and publishable package metadata.

- [ ] **Step 1: Generate the lockfile**

Run:

```bash
npm install --package-lock-only
```

Expected: `package-lock.json` is created without modifying runtime source.

- [ ] **Step 2: Switch CI to deterministic install**

Replace `npm install` with `npm ci` in `.github/workflows/ci.yml`.

- [ ] **Step 3: Add package metadata**

`package.json` must include `files` for `dist/` and `skills/`, repository metadata, MIT license metadata, and `prepack: "npm run build"`.

- [ ] **Step 4: Verify packaging**

Run:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm pack --dry-run
node dist/cli/index.js doctor --json
```

Expected: all pass; package dry-run includes `dist` and `skills/git-skill-pro` but excludes tests/spec history from published runtime payload unless intentionally documented.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .github/workflows/ci.yml
git commit -m "build: lock and harden GitSkillPro package"
```

---

### Task 12: Foundation acceptance fixture and final verification

**Files:**
- Create: `tests/fixtures/healthy-repo/README.md`
- Create: `tests/foundation-acceptance.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: all foundation modules.
- Produces: end-to-end proof that the package can inspect a repository, classify environment/capabilities, audit Git state, emit evidence, and plan without mutation.

- [ ] **Step 1: Write end-to-end acceptance test**

The test must create a temporary Git repository, commit one file, dirty another file, invoke the same functions used by the CLI, and prove:

```ts
expect(snapshot.headSha).toMatch(/^[0-9a-f]{40,64}$/);
expect(snapshot.dirty).toBe(true);
expect(audit.findings.some((f) => f.code === "UNEXPLAINED_DIRTY_WORK")).toBe(true);
expect(evidence.persistence).toBeUndefined();
expect(plan.risk).toBe("R0");
```

- [ ] **Step 2: Confirm failure before integration glue**

Run: `npm test -- tests/foundation-acceptance.test.ts`.

- [ ] **Step 3: Add any minimal integration glue needed**

Do not add provider mutations or unrelated features. Export public foundation APIs from `src/index.ts`.

- [ ] **Step 4: Update README**

Document install/dev commands, the four working CLI commands, current read-only scope, and the roadmap for workflow/recovery/provider/context/frontier plans. Clearly state that the foundation does **not** yet provide provider mutations, actual MCP transport, or production deployment/database actions.

- [ ] **Step 5: Run full verification**

```bash
npm ci
npm run typecheck
npm test
npm run build
npm pack --dry-run
node dist/cli/index.js --help
node dist/cli/index.js doctor --json
node dist/cli/index.js inspect --json
node dist/cli/index.js audit git --json
```

Expected: all commands exit 0 in a Git repository; audit may report findings but must not mutate state.

- [ ] **Step 6: Confirm Git cleanliness after read-only smoke tests**

Run:

```bash
git status --short
git diff --exit-code
git diff --cached --exit-code
```

Expected: no changes caused by GitSkillPro inspection/audit commands.

- [ ] **Step 7: Commit**

```bash
git add tests/foundation-acceptance.test.ts tests/fixtures/healthy-repo/README.md src/index.ts README.md
git commit -m "test: prove GitSkillPro foundation vertical slice"
```

---

## Self-review result

### Spec coverage for this subproject

Covered now: capability truthfulness, environment detection, risk tiers, policy gate, evidence provenance, concurrency-aware expected state, read-only local Git, Git audit, CLI read/audit/plan surface, concise Agent Skill, test-first CI, deterministic packaging.

Intentionally deferred to dedicated plans: Linear/Beads, GitHub remote write adapter, worktree execution/delegation, recovery archaeology, provider deployment/database adapters, Context7/context cache, auto-commit actors, Change Graph/stacked PRs, MCP transport/plugin packaging, A2A, provenance/SBOM, policy-as-code, progressive delivery, preview DBs.

### Placeholder scan

No `TBD`, `TODO`, "implement later", or unspecified validation steps are permitted in this plan. Deferred scope is explicitly assigned to named follow-on plans rather than left ambiguous.

### Type consistency

Foundation public vocabulary is centralized in `src/core/types.ts`; later tasks consume those names rather than introducing duplicate environment/risk/evidence shapes.
