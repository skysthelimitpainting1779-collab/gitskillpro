# GitSkillPro Workflow + Work Graphs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first executable software-workflow layer over the verified GitSkillPro foundation: explicit tracker authority, Linear normalization, Beads detection, issue readiness/completion semantics, lifecycle state, agent comments/reviews, local worktree delegation, remote delegation planning, and greenfield workflow bootstrap.

**Architecture:** Work intent, executable work graph, Git/SCM, CI, deployment, and database truth remain separate domains joined by explicit IDs and evidence. Host-native Linear/GitHub connectors are represented as adapter boundaries rather than duplicated credential clients; local Beads/Git behavior is feature-detected through installed CLIs. Local mutation is limited to isolated worktree creation under explicit R1 authority; provider writes remain out of scope for this layer.

**Tech Stack:** Node.js 22+, TypeScript 5.x, Vitest, Node standard library, existing GitSkillPro core contracts and CLI. No new runtime dependency is required.

**Spec:** `SPEC.md`, `SPEC-v0.2.md`, `SPEC-v0.3.md`, with safety/context requirements inherited from `SPEC-v0.4.md` through `SPEC-v0.6.md`.

## Global Constraints

- `build/gitskillpro` at verified foundation SHA `93b9106d21e22733957bf65d3c6357350869a539` is the base of this stacked change.
- Linear, Beads, and GitHub MAY coexist; an explicit authority map MUST identify the canonical source for each semantic domain.
- Native host connectors SHOULD be used by hosts when available; the npm package MUST NOT require duplicate Linear/GitHub credentials merely to reproduce connected capabilities.
- Beads behavior MUST be version/capability detected; unknown commands or storage/concurrency modes MUST NOT be assumed safe.
- A Git worktree does not prove the work-graph store is safe for concurrent writes.
- Agent comments, code reviews, approvals, merge recommendations, merge authorization, and merge execution are distinct concepts.
- Work items MUST NOT become `done` merely because a commit or PR exists; Definition of Done governs completion.
- Local worktree creation is R1 and requires explicit capability/policy authorization plus expected-state checks.
- Remote branch/PR delegation is planning-only in this phase; actual provider writes remain a later adapter task.
- Behavior-changing work uses red/green TDD and the full CI verification chain before a PR is called ready.

---

## Target file structure

```text
src/
  work/
    types.ts
    authority.ts
    status.ts
    readiness.ts
    lifecycle.ts
    comments.ts
    review.ts
  adapters/
    linear.ts
    beads.ts
  delegation/
    planner.ts
    worktree.ts
  audits/
    workgraph.ts
  bootstrap/
    greenfield.ts
  cli/index.ts
  index.ts
skills/git-skill-pro/references/
  workflow.md
  beads.md
tests/
  authority-workflow.test.ts
  linear.test.ts
  beads.test.ts
  delegation.test.ts
  workgraph-audit.test.ts
  bootstrap.test.ts
```

---

### Task 1: Work-domain contracts and authority map

**Files:**
- Create: `src/work/types.ts`
- Create: `src/work/authority.ts`
- Modify: `src/core/types.ts`
- Test: `tests/authority-workflow.test.ts`

**Interfaces:**
- Produces `WorkDomain`, `WorkProvider`, `SemanticWorkStatus`, `WorkItem`, `ProjectWorkflowPolicy`, `AuthorityMap`, `validateAuthorityMap`, and `resolveAuthority`.

- [ ] **Step 1: Add a failing authority-map test**

```ts
import { describe, expect, it } from "vitest";
import { validateAuthorityMap, resolveAuthority } from "../src/work/authority.js";

it("rejects two canonical providers for the same semantic domain", () => {
  const result = validateAuthorityMap({ bindings: [
    { domain: "project_intent", provider: "linear", canonical: true },
    { domain: "project_intent", provider: "github", canonical: true },
  ]});
  expect(result.valid).toBe(false);
  expect(result.errors.join(" ")).toMatch(/project_intent/i);
});

it("resolves layered Linear + Beads + GitHub authority explicitly", () => {
  const map = { bindings: [
    { domain: "project_intent", provider: "linear", canonical: true },
    { domain: "execution_graph", provider: "beads", canonical: true },
    { domain: "scm", provider: "github", canonical: true },
  ]} as const;
  expect(resolveAuthority(map, "execution_graph")?.provider).toBe("beads");
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/authority-workflow.test.ts`

Expected: FAIL because work-domain modules do not exist.

- [ ] **Step 3: Define the exact contracts**

`WorkDomain` MUST include:

```ts
export type WorkDomain =
  | "project_intent"
  | "execution_graph"
  | "scm"
  | "ci"
  | "deployment"
  | "database";
```

`SemanticWorkStatus` MUST include `triage`, `backlog`, `ready`, `in_progress`, `in_review`, `blocked`, `merged`, `deploying`, `done`, `canceled`, and `unknown`.

Extend `CapabilityId` with `work.read`, `work.write`, `work.comment`, `work.delegate`, `workgraph.read`, and `workgraph.write`.

- [ ] **Step 4: Implement authority validation**

Validation MUST reject more than one canonical provider per domain. Missing domains are allowed and remain unknown; validation MUST NOT invent defaults.

- [ ] **Step 5: Run green verification**

Run: `npm test -- tests/authority-workflow.test.ts && npm run typecheck`

Expected: PASS.

---

### Task 2: Dynamic status mapping, Definition of Ready, and Definition of Done

**Files:**
- Create: `src/work/status.ts`
- Create: `src/work/readiness.ts`
- Create: `src/work/lifecycle.ts`
- Modify: `tests/authority-workflow.test.ts`

**Interfaces:**
- Produces `mapProviderStatus`, `assessReadiness`, `assessCompletion`, and `nextWorkflowStage`.

- [ ] **Step 1: Add failing semantic tests**

```ts
it("maps provider status through project configuration rather than hard-coded Linear names", () => {
  expect(mapProviderStatus("Started", { Started: "in_progress", Review: "in_review" })).toBe("in_progress");
  expect(mapProviderStatus("Mystery", {})).toBe("unknown");
});

it("blocks readiness when acceptance criteria or repository identity are missing", () => {
  const result = assessReadiness({ id: "ENG-1", provider: "linear", title: "Ship it", status: "ready", blockers: [] }, {
    requireAcceptanceCriteria: true,
    requireRepository: true,
    completionRequires: ["merged"],
  });
  expect(result.ready).toBe(false);
  expect(result.findings.map((f) => f.code)).toContain("MISSING_ACCEPTANCE_CRITERIA");
});

it("does not call a work item done when policy requires production verification", () => {
  const result = assessCompletion({ merged: true, deployed: true, productionVerified: false }, { completionRequires: ["merged", "production_verified"] });
  expect(result.complete).toBe(false);
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/authority-workflow.test.ts`

Expected: FAIL for missing workflow functions.

- [ ] **Step 3: Implement readiness/completion rules**

Readiness findings MUST distinguish missing data from blocked dependencies. Completion checks MUST be driven by project policy and support `merged`, `deployed`, `database_verified`, `production_verified`, `documentation`, and `release` gates.

- [ ] **Step 4: Implement lifecycle stage selection**

The ordered lifecycle vocabulary is:

```text
backlog -> ready -> claimed -> implementing -> local_verified -> pr_open
-> in_review -> ci_verified -> merge_ready -> merged -> deploying
-> production_verified -> done
```

`nextWorkflowStage` MUST return the first unsatisfied required stage; it MUST NOT skip a required policy gate.

- [ ] **Step 5: Run green verification**

Run: `npm test -- tests/authority-workflow.test.ts && npm run typecheck`

---

### Task 3: Linear host-native normalization contract

**Files:**
- Create: `src/adapters/linear.ts`
- Test: `tests/linear.test.ts`

**Interfaces:**
- Produces `LinearIssuePayload`, `LinearStatusMap`, `normalizeLinearIssue`, and `LinearHostCapabilities`.

- [ ] **Step 1: Write failing normalization tests**

```ts
it("normalizes Linear issue identity without treating copied GitHub state as canonical", () => {
  const issue = normalizeLinearIssue({
    id: "uuid-1",
    identifier: "ENG-42",
    title: "Add work graph",
    status: { name: "In Progress" },
    project: { id: "p1", name: "GitSkillPro" },
    gitBranchName: "eng-42-work-graph",
    blockedBy: ["ENG-3"],
  }, { "In Progress": "in_progress" });
  expect(issue.id).toBe("ENG-42");
  expect(issue.provider).toBe("linear");
  expect(issue.status).toBe("in_progress");
  expect(issue.blockers).toEqual(["ENG-3"]);
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/linear.test.ts`.

- [ ] **Step 3: Implement pure normalization only**

The package MUST accept host-provided Linear payloads and capability descriptions. It MUST NOT embed OAuth/API-key logic or claim a Linear write occurred merely because a host can theoretically perform one.

- [ ] **Step 4: Run green verification**

Run: `npm test -- tests/linear.test.ts && npm run typecheck`.

---

### Task 4: Beads version/capability discovery

**Files:**
- Create: `src/adapters/beads.ts`
- Test: `tests/beads.test.ts`

**Interfaces:**
- Produces `BeadsSnapshot`, `discoverBeads(cwd)`, `parseBeadsCapabilities(help)`, and `assessBeadsConcurrency(snapshot)`.

- [ ] **Step 1: Write failing pure capability tests**

```ts
it("feature-detects Beads commands instead of assuming a fixed version", () => {
  const caps = parseBeadsCapabilities(`Usage: bd <command>\nCommands:\n  ready\n  list\n  doctor\n  update\n`);
  expect(caps.has("ready")).toBe(true);
  expect(caps.has("doctor")).toBe(true);
  expect(caps.has("dolt")).toBe(false);
});

it("does not treat unknown Beads storage mode as multi-agent safe", () => {
  expect(assessBeadsConcurrency({ installed: true, storageMode: "unknown", capabilities: [], projectPresent: true }).safeConcurrentWrites).toBe(false);
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/beads.test.ts`.

- [ ] **Step 3: Implement safe discovery**

`discoverBeads` may execute only observational commands in this phase: `bd --version` and `bd --help`; it may inspect `.beads/` paths/files without modifying them. Infer storage mode only from explicit observable configuration; otherwise return `unknown`.

- [ ] **Step 4: Implement concurrency assessment**

`embedded`/single-writer and `unknown` modes default unsafe for concurrent writers. `server`/`shared_server` may be marked conditionally safe only when the snapshot explicitly says the server/health evidence is healthy.

- [ ] **Step 5: Run green verification**

Run: `npm test -- tests/beads.test.ts && npm run typecheck`.

---

### Task 5: Material agent comments and independent review contract

**Files:**
- Create: `src/work/comments.ts`
- Create: `src/work/review.ts`
- Modify: `tests/authority-workflow.test.ts`

**Interfaces:**
- Produces `AgentCommentType`, `createAgentComment`, `reviewRequirementForRisk`, and `assessReviewEvidence`.

- [ ] **Step 1: Add failing comment/review tests**

```ts
it("distinguishes an agent comment from code-review approval", () => {
  const comment = createAgentComment("progress", "Tests are running", { actor: "agent-a" });
  expect(comment.type).toBe("progress");
  expect(comment.reviewDecision).toBeUndefined();
});

it("requires independent review for R3", () => {
  expect(reviewRequirementForRisk("R3").independentRequired).toBe(true);
  expect(assessReviewEvidence("R3", [{ reviewerId: "agent-a", implementerId: "agent-a", decision: "approve" }]).complete).toBe(false);
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/authority-workflow.test.ts`.

- [ ] **Step 3: Implement material comment taxonomy**

Types: `claimed`, `plan`, `progress`, `blocked`, `ci_diagnosis`, `review`, `merge_ready`, `deployment`, `database`, `completion`, `follow_up`.

Review decisions are separately typed `comment`, `approve`, `request_changes`, and `merge_recommendation`; no ordinary comment implies approval.

- [ ] **Step 4: Implement risk-based independent review**

R0/R1 MAY self-review; R2 SHOULD use independent review; R3/R4 require it. A reviewer whose ID equals the implementer ID is not independent.

- [ ] **Step 5: Run green verification**

Run: `npm test -- tests/authority-workflow.test.ts && npm run typecheck`.

---

### Task 6: Delegation planner and local worktree executor

**Files:**
- Create: `src/delegation/planner.ts`
- Create: `src/delegation/worktree.ts`
- Test: `tests/delegation.test.ts`

**Interfaces:**
- Produces `planDelegation(input)`, `createTaskBranchName(issueId, title)`, and `LocalWorktreeDelegator.create(cwd, request)`.

- [ ] **Step 1: Write failing planner tests**

```ts
it("prefers a local worktree when the environment proves persistent worktree capability", () => {
  const plan = planDelegation({ issueId: "ENG-42", title: "Add work graph", capabilities: ["git.local.write", "git.worktree", "fs.persistent"] });
  expect(plan.mode).toBe("local_worktree");
  expect(plan.branch).toMatch(/^eng-42-/);
});

it("falls back to remote isolation without pretending a local worktree exists", () => {
  const plan = planDelegation({ issueId: "ENG-42", title: "Add work graph", capabilities: ["github.write"] });
  expect(plan.mode).toBe("remote_branch");
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/delegation.test.ts`.

- [ ] **Step 3: Implement deterministic branch naming and planner**

Branch names use lowercase issue ID + slug, normalize unsafe characters, and cap generated slug length. The planner returns required capabilities, isolation mode, risk, and an evidence checklist.

- [ ] **Step 4: Add a failing real-worktree mutation test**

The test creates a disposable Git repository, commits a baseline, calls `LocalWorktreeDelegator.create` with explicit `baseRef`, `branch`, and destination outside the main working directory, then asserts:

```ts
expect(result.branch).toBe("eng-42-work-graph");
expect(execFileSync("git", ["worktree", "list", "--porcelain"], { cwd: repo, encoding: "utf8" })).toContain(result.path);
```

- [ ] **Step 5: Implement the R1 executor**

Before mutation, verify the base ref resolves, target branch does not already exist, destination does not exist, and no existing worktree claims the requested branch/path. Execute exactly one `git worktree add <path> -b <branch> <baseRef>` operation, then verify the created branch/path. Do not stash/reset/clean the supervisor worktree.

- [ ] **Step 6: Run green verification**

Run: `npm test -- tests/delegation.test.ts && npm run typecheck`.

---

### Task 7: Work-graph audit and tracker reconciliation findings

**Files:**
- Create: `src/audits/workgraph.ts`
- Test: `tests/workgraph-audit.test.ts`

**Interfaces:**
- Produces `auditWorkGraph(input): WorkGraphAuditResult`.

- [ ] **Step 1: Write failing audit tests**

```ts
it("flags two active work items that explicitly duplicate one another", () => {
  const result = auditWorkGraph({ items: [
    { id: "B-1", provider: "beads", title: "A", status: "in_progress", blockers: [], duplicateOf: "B-2" },
    { id: "B-2", provider: "beads", title: "A2", status: "in_progress", blockers: [] },
  ]});
  expect(result.findings.some((f) => f.code === "ACTIVE_DUPLICATE_WORK")).toBe(true);
});

it("preserves unknown reconciliation instead of guessing from similar names", () => {
  const result = auditWorkGraph({ items: [
    { id: "L-1", provider: "linear", title: "Auth", status: "in_progress", blockers: [] },
    { id: "B-1", provider: "beads", title: "Auth", status: "ready", blockers: [] },
  ]});
  expect(result.links).toEqual([]);
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/workgraph-audit.test.ts`.

- [ ] **Step 3: Implement evidence-based findings**

Initial findings: missing authority map, active duplicate, active superseded item, blocked-but-ready mismatch, stale claim input when explicitly supplied, and ambiguous cross-tracker identity. Name similarity alone MUST NOT create a link.

- [ ] **Step 4: Run green verification**

Run: `npm test -- tests/workgraph-audit.test.ts && npm run typecheck`.

---

### Task 8: Greenfield bootstrap planner

**Files:**
- Create: `src/bootstrap/greenfield.ts`
- Test: `tests/bootstrap.test.ts`

**Interfaces:**
- Produces `planGreenfieldBootstrap(input): BootstrapPlan`.

- [ ] **Step 1: Write failing bootstrap tests**

```ts
it("plans workflow infrastructure before feature implementation", () => {
  const plan = planGreenfieldBootstrap({ repositoryExists: true, workTracker: "linear", executionGraph: "beads" });
  expect(plan.steps.map((s) => s.id)).toEqual(expect.arrayContaining(["repo_instructions", "work_authority", "ci_baseline", "pr_policy", "definition_of_done", "proving_issue"]));
  expect(plan.steps.at(-1)?.id).toBe("proving_issue");
});

it("does not invent license or maintainers", () => {
  const plan = planGreenfieldBootstrap({ repositoryExists: true });
  expect(plan.unknowns).toEqual(expect.arrayContaining(["license_policy", "maintainers"]));
});
```

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/bootstrap.test.ts`.

- [ ] **Step 3: Implement ordered bootstrap plan**

The plan covers repo instructions, tracker/authority mapping, issue conventions, branch/worktree convention, CI baseline, PR/review policy, rules/governance audit, deployment/database discovery, Definition of Ready/Done, context policy, and one end-to-end proving issue. Unknown ownership/security/billing facts remain unknown.

- [ ] **Step 4: Run green verification**

Run: `npm test -- tests/bootstrap.test.ts && npm run typecheck`.

---

### Task 9: CLI and Skill workflow surface

**Files:**
- Modify: `src/cli/index.ts`
- Modify: `src/index.ts`
- Create: `skills/git-skill-pro/references/workflow.md`
- Create: `skills/git-skill-pro/references/beads.md`
- Modify: `skills/git-skill-pro/SKILL.md`
- Modify: `tests/cli.test.ts`
- Modify: `tests/skill-contract.test.ts`

**Interfaces:**
- Adds `gsp audit beads`, `gsp bootstrap plan`, and `gsp delegate plan <issue-id> <title>`.

- [ ] **Step 1: Add failing CLI/skill tests**

Assert `--help` lists the new commands and the Skill directs agents to resolve tracker authority before mixing Linear/Beads/GitHub state.

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/cli.test.ts tests/skill-contract.test.ts`.

- [ ] **Step 3: Implement read/plan CLI commands**

`audit beads` performs safe local Beads discovery; `bootstrap plan` returns a plan only; `delegate plan` returns the selected isolation mode but performs no mutation.

- [ ] **Step 4: Add load-on-demand references**

`workflow.md` documents authority/readiness/lifecycle/comment/review rules. `beads.md` documents version discovery, storage/concurrency caution, ready/claim/supersession concepts, and the rule not to delete `.beads` state as a reflexive recovery step.

- [ ] **Step 5: Run green verification**

Run: `npm test -- tests/cli.test.ts tests/skill-contract.test.ts && npm run typecheck`.

---

### Task 10: Stacked acceptance and CI proof

**Files:**
- Create: `tests/workflow-acceptance.test.ts`
- Modify: `README.md`

**Interfaces:**
- Proves the workflow layer can normalize issue intent, select an authority map, reject incomplete readiness, choose worktree/remote isolation honestly, audit Beads/work graph state, and plan a greenfield flow without provider writes.

- [ ] **Step 1: Write end-to-end acceptance test**

The test constructs Linear + Beads + GitHub authority, normalizes a Linear issue, verifies readiness, creates a delegation plan, and asserts no persistence proof/provider mutation is produced merely by planning.

- [ ] **Step 2: Run red verification**

Run: `npm test -- tests/workflow-acceptance.test.ts`.

- [ ] **Step 3: Add minimal integration glue and public exports**

Export all workflow/adapters/planners/audits from `src/index.ts`.

- [ ] **Step 4: Update README**

Document the layered authority model and the new read/plan workflow commands; clearly state that host-native Linear/GitHub writes and Beads claims remain provider/permission gated.

- [ ] **Step 5: Run the full verification chain**

```bash
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm pack --dry-run
node dist/cli/index.js --help
node dist/cli/index.js doctor --json
node dist/cli/index.js audit beads --json
node dist/cli/index.js bootstrap plan --json
node dist/cli/index.js delegate plan ENG-42 "Add work graph" --json
```

Expected: all commands exit successfully; read/audit/plan commands do not mutate tracked repository state.

---

## Self-review result

### Spec coverage

This plan covers the v0.2/v0.3 workflow core: explicit tracker authority, dynamic statuses, Definition of Ready/Done, Linear host normalization, version-aware Beads discovery/concurrency caution, agent comment/review separation, worktree/remote delegation, work-graph audit, greenfield bootstrap, CLI/Skill guidance, and stacked acceptance.

Deferred deliberately: actual Linear/GitHub provider writes, Beads claim/update mutations, PR creation/review through provider APIs, repository-rules mutations, and production deployment/database actions. Those require provider-specific adapters and stronger policy/evidence gates in the later provider/recovery plans.

### Placeholder scan

No TODO/TBD placeholders are permitted. Capability absence and deferred provider mutations are represented explicitly as scope boundaries, not incomplete code requirements.

### Type consistency

All workflow modules use the shared `RiskTier`, `CapabilityId`, `OperationPlan`, and evidence vocabulary from the foundation. Tracker state does not become Git/CI/deployment truth.