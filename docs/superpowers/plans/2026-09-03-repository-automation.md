# GitSkillPro Repository Automation Implementation Plan

**Base:** verified Context Economy SHA `1c954fc82251fb1eda70bed26e6f29397060233b`

**Goal:** implement the executable core of SPEC-v0.5 without granting broad autonomous push/merge/deploy authority.

## Guardrails

- Automation is a concurrent actor, not a convenience script.
- `auto-stage`, `auto-commit`, `auto-push`, `auto-pr`, `auto-review`, `auto-merge`, and `auto-deploy` are separate capabilities.
- Read/audit/plan first. The only local mutation introduced in this stack is a guarded R1 **local checkpoint commit** in a proven isolated worktree/branch.
- No generic `git add -A` API. Staged paths must be explicit/owned or broad staging must be separately proven safe.
- No automatic remote push, PR creation, review, merge or deployment execution in this stack.
- Revalidate expected HEAD, branch and owned path set immediately before local checkpoint mutation.
- Never bypass hooks automatically. Re-inspect repository/index after hooks.
- Automation snapshots/fixtures are data only.

## Task 1 — Automation actor + authority contracts

Create `src/automation/types.ts`, `src/automation/policy.ts`, `tests/automation-policy.test.ts`.

Prove capabilities are independent; an actor authorized for commit is not implicitly authorized for push/PR/merge/deploy. Model actor kind, source/trigger/runtime/identity, branches/paths, expected-state, concurrency, idempotency, loop prevention and recovery.

## Task 2 — Repository automation discovery

Create `src/automation/discovery.ts`, `tests/automation-discovery.test.ts`.

Detect evidence from `.git/hooks`, `core.hooksPath`, package scripts, Husky/Lefthook/pre-commit, repo scripts with Git mutations, GitHub workflow commit/push commands, dependency/release bot configs, and common process/scheduler descriptors. Findings must distinguish observed evidence from inferred capabilities. Unknown active writers remain concurrency risk.

## Task 3 — Automation audit + staging/ownership safety

Create `src/audits/automation.ts`, `tests/automation-audit.test.ts`.

Audit shared-worktree auto-commit, broad staging, protected/default branch push, force push, capability escalation, missing expected-state policy, unbounded paths, suspicious sensitive paths, unknown writers, and hook bypass. Generated/checkpoint actors require explicit scope and isolation rules.

## Task 4 — Loop and idempotency analysis

Create `src/automation/loops.ts`, `src/automation/idempotency.ts`, tests.

Detect push→workflow→commit/push self-trigger cycles from normalized actor/trigger/output graphs and recommend actor/event/path/provenance/concurrency guards. Idempotency comparison must determine whether repeated generator output produces the same semantic content hash; equivalent reruns with new semantic diff are defects.

## Task 5 — Guarded checkpoint-commit planner/executor

Create `src/automation/checkpoint.ts`, tests with disposable Git worktrees.

Planner requires actor ID, task ID, isolated worktree proof, expected HEAD, current branch, explicit allowlisted paths, no unexplained changed paths, and auto-stage+auto-commit authority. Executor:
1. re-inspects HEAD/branch/status;
2. refuses stale expected state or extra paths;
3. stages only the explicit allowlist;
4. captures staged diff hash;
5. runs normal `git commit` so hooks are honored;
6. re-inspects after hooks/commit;
7. returns local commit evidence only—never pushes.

A failing hook fails the operation; no `--no-verify` fallback.

## Task 6 — CLI + Skill + acceptance

CLI:
- `gsp automation audit <snapshot.json> [--json]`
- `gsp automation plan <snapshot.json> [--json]`
- `gsp automation detect-loops <snapshot.json> [--json]`
- `gsp automation verify-idempotency <snapshot.json> [--json]`

Checkpoint mutation remains library/API-level and R1 policy-gated in this stack; do not expose a broad CLI auto-commit command yet.

Add `skills/git-skill-pro/references/automation.md`, public exports, README and CI smoke. Acceptance must prove commit-only authority never implies push and one isolated-worktree checkpoint commit changes only allowlisted files and emits no remote persistence proof.
