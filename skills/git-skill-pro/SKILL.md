---
name: git-skill-pro
description: Use when an agent must inspect, plan, implement, review, recover, or safely coordinate software work involving Git, repositories, pull requests, CI, deployment, databases, work trackers, automation, or concurrent agents.
---

# GitSkillPro

## Operating principle

Use the **minimum sufficient context for a correct, evidence-backed decision**. Discover the environment and actual capabilities before acting; never pretend a local, remote, provider, work-tracker, automation, or persistence capability exists when it has not been proven.

## Universal lifecycle

`DISCOVER → SNAPSHOT → CLASSIFY RISK → PLAN → CHECK AUTHORITY → PLAN CONTEXT → REVALIDATE CONCURRENCY → EXECUTE → VERIFY → EMIT EVIDENCE → CHECKPOINT/CACHE → COMPLETE / RECOVER / ESCALATE`

## Start every task here

1. Resolve project/repository/work-item scope.
2. Read repository-native instructions and relevant GitSkillPro specs/configuration.
3. Discover runtime and capabilities; see `references/environment.md` when the environment is ambiguous.
4. Discover **repository automation/background writers** before staging, committing, rebasing, recovery cleanup, or integration. If hooks, bots, watchers, generators, auto-commit scripts, CI writers, or other automation actors exist, load `references/automation.md`.
5. Resolve the tracker/work-graph **authority map** before mixing Linear, Beads, GitHub Issues/Projects, or another tracker. Load `references/workflow.md` for work-management tasks.
6. If Beads is present, feature-detect its installed version/capabilities and storage/concurrency mode; load `references/beads.md`.
7. Decide whether the project is healthy normal work, greenfield bootstrap, takeover/recovery, or incident mode. For broken CI, stale/failed/superseded PRs, tangled branches, tracker drift or unclear production truth, load `references/recovery.md` and perform archaeology/inventory before cleanup.
8. For CI/workflow failures load `references/ci.md`; for deployment/provider work load `references/deployment.md`; for schemas/migrations/data-state work load `references/databases.md`.
9. For large repositories, logs, PR histories, docs retrieval, recovery archaeology, or multi-agent handoffs load `references/context-economy.md` and use **progressive retrieval** instead of broad context dumps.
10. When the project uses stacked PRs, merge queues/groups, stable change IDs/Jujutsu, attestations/SBOMs, policy-as-code, or progressive delivery, load `references/frontier.md` and keep logical Change identity separate from physical commit identity.
11. Snapshot only the state needed for the current decision.
12. Classify risk before mutation; use `references/primitive-safety.md` for foundation Git primitives.
13. Assume concurrency and revalidate state immediately before material operations.
14. Demand evidence from the layer that can actually prove the claimed postcondition.

## Non-negotiable behavior

- Never discard, reset, clean, overwrite, stash, or commit unexplained work.
- Separate **code correctness**, **CI health**, **merge safety**, **deployment health**, **database state**, **release/exposure state**, and **production health**. A green check in one layer is not proof for another layer.
- Keep observation, inference, recommendation, attempted mutation, verification, and proven persistence distinct.
- Prefer reversible operations and isolated branches/worktrees.
- Treat work trackers, Git/SCM, CI, deployment providers, databases, and repository automation as separate authorities/actors linked by evidence.
- Do not create uncontrolled bidirectional synchronization between Linear, Beads, GitHub, or another tracker. A mirror is not automatically canonical truth.
- A connected GitHub/provider tool may prove remote/provider facts but must never pretend it can see local untracked files, stash, index state, reflog, or worktree dirtiness.
- Local Git may prove repository facts but must never claim production/deployment/database health without provider evidence.
- Unknown or newly discovered mutation primitives default to denied until classified.
- Preserve unknown as a valid result when evidence is insufficient; do not turn uncertainty into invented causality, identity, health or compatibility.
- Never expose raw secret values in logs/evidence/context packets; secret name/presence/scope metadata is separate evidence.
- Never reduce context merely to hit a token target when doing so removes required safety or acceptance evidence.

## Repository automation

Treat every hook, watcher, generator, dependency/release bot, CI writer, IDE plugin, hosted agent, auto-commit script, and other **background writer** as a concurrent automation actor. Configuration presence proves an actor signal; it does not prove credentials or permission.

Automation authorities are strictly separate and ordered: **auto-stage → auto-commit → auto-push → auto-pr → auto-review → auto-merge → auto-deploy**. Authority at one stage never implies authority at a later stage. A bot allowed to create a local checkpoint commit is not therefore allowed to push it, open or approve a PR, merge, or deploy.

Prefer explicit staging paths. Broad `git add -A`/repository-wide staging is unsafe unless ownership of every changed path is proven. Never let automation absorb another agent's work, unrelated untracked files, secrets, local config, logs/caches, or unowned generated artifacts.

A guarded automated **checkpoint commit** requires a proven isolated **worktree**, named task branch, exact expected HEAD, explicit task-owned path allowlist, `auto-stage` + `auto-commit` authority, immediate state revalidation, staged-diff verification, normal hook execution, and post-commit reinspection. It produces local commit evidence only and never implies `auto-push` or remote persistence.

Hooks are part of the repository environment. A rejecting hook is a failure to diagnose; do not automatically use hook bypass or `--no-verify`. If a hook changes files, re-inspect the final committed path set and reject unexpected paths.

Perform **loop prevention** analysis before enabling recursive writers. Detect self-trigger or multi-actor cycles such as `push → CI → generate → commit → push`. Use provenance/event/path guards, dedicated branches, concurrency control, no-op checks, and **idempotency**. For generators, repeated execution with the same input identity should converge to the same semantic/content output hash; repeated new diffs are defects unless intentionally designed and separately authorized.

Background direct pushes to the default/protected branch and background force-push are denied by default. Push, PR, review, merge and deploy each require a fresh expected-state/policy gate.

## Frontier change system

A **logical Change** is an intended unit of work; a commit SHA is one physical version of that logical Change. Keep logical Change identity separate from physical commit SHA identity so a rebase, amend, restack, salvage, or Jujutsu-style stable change ID does not erase the relationship to the same intended work. Git remains canonical physical repository history.

For stacked changes/PRs, upper layers are valid only against the exact validated heads of lower dependencies. A lower-layer rebase or replacement makes dependent upper evidence stale even when the upper PR head itself has not moved.

**Merge-group evidence is not PR-head evidence.** When a merge queue/group is required, obtain the exact merge-group SHA and require the configured checks on that SHA. Successful checks on a PR head cannot be reused as proof that the merge-group composition is safe.

For material autonomous changes, emit a **Proof-Carrying Change Manifest** rather than forcing each reviewer to reconstruct the entire project history. The Change Manifest references work identity, logical Change/version, head/base, dependency heads, affected/diff evidence, risk, CI/security evidence, migration/deployment/release identities, provenance/SBOM, independent reviews, recovery evidence, context packet identity, and explicit unknowns. Evidence stays at its source; the manifest carries references and identities.

Manifest proof is conditional. Head/base drift, a changed lower dependency, migration/deployment identity change, or context-packet change makes affected proof stale and requires revalidation.

Keep **source verification, artifact provenance/attestation, SBOM/signature, policy evaluation, deployment health, and release state separate**. One does not prove the others. Policy-as-code evidence should identify the policy/version, evaluated input hash, result, reasons, and source reference.

**Deployment is not release.** A revision can be healthy in production while a feature flag or progressive rollout exposes it to only 0%, 10%, or 50% of users. Model `deploy → verify → expose/promote → observe → promote/complete/pause/rollback`; do not mark release complete until its target exposure and release-specific health evidence are satisfied.

For **Jujutsu or another alternative VCS**, normalize stable change identity separately from the physical Git-compatible commit. A VCS that permits conflicts to persist as state does not mean the conflict is resolved; conflicted or unknown conflict state is not safe-to-integrate proof.

## Context Economy

Use progressive retrieval from the narrowest authoritative artifact outward. For CI, start at failed run/job/step. For PRs, start at metadata, changed files, then patches. For recovery, inventory before expanding problematic clusters.

Checkpoint accepted facts, evidence references, decisions, unresolved unknowns and next action. **Never compact an unresolved unknown into a fact.** Build **bounded subagent packets** from that checkpoint plus the task and acceptance criteria; do not pass the supervisor's whole conversation by default.

Use content-addressed cache identities tied to the actual evidence revision: Git SHA/blob, PR head SHA, CI run/attempt, deployment ID, migration version, tracker revision, or documentation version/query. A changed or expired identity is a cache miss.

For version-specific external library/framework/API documentation, prefer the host-native **Context7** integration when available. Resolve an exact library ID only when needed, query one focused concept at a time, and never send secrets, credentials, proprietary source, or raw internal transcripts. If Context7 does not expose the repository's requested version, preserve that mismatch instead of inventing a version match.

Token savings are successful only when task success, evidence completeness, and quality are preserved. **Lower token cost with lower quality is a failed optimization.**

## Work-item lifecycle

Before implementation, enforce the project Definition of Ready: resolve repository identity, required acceptance criteria, blockers/dependencies, required authority and verification expectations.

Do **not** mark an issue done merely because a commit or PR exists. Definition of Done may require merge, deployment, database verification, production verification, documentation or release/exposure.

Agent comments and code reviews are different artifacts. A progress/plan/CI comment is not an approval. Review approval, merge recommendation, merge authorization and merge execution stay separate. For R3/R4 work, the implementer cannot satisfy the independent-review gate by approving their own change.

## Multi-agent default

Assume the environment is non-exclusive. Prefer `one task → one branch → one worktree → one agent → one evidence packet` when persistent local worktree capability is proven **and** the active work-graph store is safe for concurrent writers. When local isolation is unavailable, use remote branch/session isolation and explicitly record that local isolation was unavailable.

Multiple Git worktrees do not make embedded/single-writer or unknown Beads storage safe for simultaneous agent writes. Also account for repository automation/background writers before assuming a worktree is exclusive.

## CI diagnosis

Before editing application code for a red check, determine whether the failure belongs to source, tests, type/static analysis, dependency resolution, workflow configuration, permissions, secrets, runtime/toolchain, runner, cache/artifacts, concurrency, external provider/quota, deployment, database dependencies, repository-rule/check wiring, repository automation, or unknown.

Separate **root cause from unrelated hardening findings**. For example, immutable action pinning may be a valid security improvement while the actual failing cause is a missing secret or type error.

For takeover/recovery work, establish the **default-branch CI baseline before blaming failed PRs**. If main/default reproduces the same stable failure fingerprint, repair and prove that shared baseline once. A red PR is not automatically a code defect.

## Autonomous PR gate

Anchor checks/reviews to the current PR head SHA. Revalidate head/base, required checks, unresolved review threads, risk-gated independent review, deployment/database implications and rollback/forward-fix plan immediately before merge recommendation.

Green CI alone is not sufficient for R3 merge readiness. For stacked/queued workflows, also revalidate stack dependencies and merge-group SHA evidence.

## Deployment/provider gate

Repository config can identify a provider signal but does not prove account access or deployment health. Prefer an authorized host-native provider connector when available.

A **provider success response is not runtime health**. Prove intended source revision, target environment and runtime/smoke/log health separately before claiming a deployment healthy.

For Cloudflare, include bound-resource/data compatibility in rollback reasoning. For Hostinger, **Horizons and VPS are distinct product surfaces**; Horizons evidence must not be used to claim VPS process/server state.

## Database gate

Detect database engine, provider and migration framework separately. Multiple systems may coexist; Prisma/Drizzle alone do not prove an engine.

Classify schema/data operations conservatively: additive schema, index, constraint, data transform/backfill, destructive DDL/DML, permission/RLS and unknown/custom each have different risks.

For material migrations prove target environment, current migration version, pending order, lock/backfill impact, recovery capability and code/schema rollback compatibility. Prefer an expand → compatible deploy → backfill → contract window for breaking schema evolution when applicable.

**A Git revert is not a database rollback.** Database recovery is provider/data-layer work: backup/PITR, in-place restore, branch/clone recovery, new-database cutover or another explicitly proven mechanism.

## Recovery mode

When a project is already tangled, perform archaeology before cleanup:

1. inventory trackers/work graphs, branches/worktrees, PRs/reviews, CI/rules, deployments, migrations, and repository automation/background writers;
2. build an evidence graph across issue/bead → logical Change/version → branch → commits → PR/stack → review → CI/merge-group → merge → deployment/release/database state;
3. classify current, stale, duplicate, superseded, abandoned, orphaned, conflicted, baseline-failed, PR-specific-failed and unknown artifacts without using title/timestamp shortcuts;
4. preserve explicit duplicate/supersession relationships;
5. use **selective salvage**—fresh branches with selected cherry-picks/patches or current-spec reimplementation—rather than merging stale branches wholesale;
6. propose tracker/code/runtime reconciliation with evidence rather than silently rewriting state;
7. repair in lanes and prove the restored workflow with one clean end-to-end issue.

## Greenfield mode

For a new project, establish repository instructions, explicit tracker authority, issue contract, isolation conventions, repository-automation policy, CI baseline, PR/review policy, repository-rule audit, deployment/database discovery, Definition of Ready/Done and context policy before feature work. Prove the workflow with one representative end-to-end issue.

Do not invent a license, maintainers, security contacts, deployment account, database ownership or credentials.

## Evidence rule

Never claim persistence merely because an attempted command or provider call returned success. Record an explicit persistence/reference proof when the observing layer provides one; otherwise report the action as attempted and leave persistence unknown.

## Implemented surface

The current implementation includes environment/capability discovery, risk/policy/evidence contracts, Git/worktree/workflow/recovery/provider/database/Context Economy/repository-automation layers, guarded local checkpoint commits, **logical Change Graphs, stack/merge-group auditing, Proof-Carrying Change Manifests with freshness invalidation, provenance/SBOM/policy evidence models, deploy-vs-release planning, and Git/Jujutsu-style change identity normalization**.

Remote automation writes (`auto-push`, `auto-pr`, `auto-review`, `auto-merge`, `auto-deploy`), provider/production mutations, direct Context7 network transport, real MCP transport, and actual alternative-VCS mutation execution remain separately gated until their implementation layers are proven.
