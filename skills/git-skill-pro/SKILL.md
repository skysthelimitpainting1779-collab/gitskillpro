---
name: git-skill-pro
description: Use when an agent must inspect, plan, implement, review, recover, or safely coordinate software work involving Git, repositories, pull requests, CI, deployment, databases, work trackers, or concurrent agents.
---

# GitSkillPro

## Operating principle

Use the **minimum sufficient context for a correct, evidence-backed decision**. Discover the environment and actual capabilities before acting; never pretend a local, remote, provider, work-tracker, or persistence capability exists when it has not been proven.

## Universal lifecycle

`DISCOVER → SNAPSHOT → CLASSIFY RISK → PLAN → CHECK AUTHORITY → PLAN CONTEXT → REVALIDATE CONCURRENCY → EXECUTE → VERIFY → EMIT EVIDENCE → CHECKPOINT/CACHE → COMPLETE / RECOVER / ESCALATE`

## Start every task here

1. Resolve project/repository/work-item scope.
2. Read repository-native instructions and relevant GitSkillPro specs/configuration.
3. Discover runtime and capabilities; see `references/environment.md` when the environment is ambiguous.
4. Resolve the tracker/work-graph **authority map** before mixing Linear, Beads, GitHub Issues/Projects, or another tracker. Load `references/workflow.md` for work-management tasks.
5. If Beads is present, feature-detect its installed version/capabilities and storage/concurrency mode; load `references/beads.md`.
6. Decide whether the project is healthy normal work, greenfield bootstrap, takeover/recovery, or incident mode. For broken CI, stale/failed/superseded PRs, tangled branches, tracker drift or unclear production truth, load `references/recovery.md` and perform archaeology/inventory before cleanup.
7. Snapshot only the state needed for the current decision.
8. Classify risk before mutation; use `references/primitive-safety.md` for foundation Git primitives.
9. Assume concurrency and revalidate state immediately before material operations.
10. Demand evidence from the layer that can actually prove the claimed postcondition.

## Non-negotiable behavior

- Never discard, reset, clean, overwrite, stash, or commit unexplained work.
- Separate **code correctness**, **CI health**, **merge safety**, **deployment health**, **database state**, and **production health**. A green check in one layer is not proof for another layer.
- Keep observation, inference, recommendation, attempted mutation, verification, and proven persistence distinct.
- Prefer reversible operations and isolated branches/worktrees.
- Treat work trackers, Git/SCM, CI, deployment providers, and databases as separate authorities linked by evidence.
- Do not create uncontrolled bidirectional synchronization between Linear, Beads, GitHub, or another tracker. A mirror is not automatically canonical truth.
- A connected GitHub/provider tool may prove remote/provider facts but must never pretend it can see local untracked files, stash, index state, reflog, or worktree dirtiness.
- Local Git may prove repository facts but must never claim production/deployment/database health without provider evidence.
- Load large primitive/provider references only when the current task needs them.
- Unknown or newly discovered mutation primitives default to denied until classified.
- Preserve unknown as a valid recovery result when evidence is insufficient; do not turn uncertainty into invented causality or identity.

## Work-item lifecycle

Before implementation, enforce the project Definition of Ready: resolve repository identity, required acceptance criteria, blockers/dependencies, required authority and verification expectations.

Do **not** mark an issue done merely because a commit or PR exists. Definition of Done may require merge, deployment, database verification, production verification, documentation or release/exposure.

Agent comments and code reviews are different artifacts. A progress/plan/CI comment is not an approval. Review approval, merge recommendation, merge authorization and merge execution stay separate. For R3/R4 work, the implementer cannot satisfy the independent-review gate by approving their own change.

## Multi-agent default

Assume the environment is non-exclusive. Prefer `one task → one branch → one worktree → one agent → one evidence packet` when persistent local worktree capability is proven **and** the active work-graph store is safe for concurrent writers. When local isolation is unavailable, use remote branch/session isolation and explicitly record that local isolation was unavailable.

Multiple Git worktrees do not make embedded/single-writer or unknown Beads storage safe for simultaneous agent writes.

## Failure diagnosis

Before editing application code for a red check, determine whether the failure belongs to source code, tests, dependency resolution, workflow configuration, permissions/secrets, runner/toolchain, cache/artifacts, external providers, repository rules, deployment, database dependencies, or the work-management/work-graph layer itself.

For takeover/recovery work, establish the **default-branch CI baseline before blaming failed PRs**. If main/default reproduces the same stable failure fingerprint, repair and prove that shared baseline once. A red PR is not automatically a code defect.

## Recovery mode

When a project is already tangled, perform archaeology before cleanup:

1. inventory trackers/work graphs, branches/worktrees, PRs/reviews, CI/rules, deployments and migrations;
2. build an evidence graph across issue/bead → branch → commits → PR → review → CI → merge → deployment/database state;
3. classify current, stale, duplicate, superseded, abandoned, orphaned, conflicted, baseline-failed, PR-specific-failed and unknown artifacts without using title/timestamp shortcuts;
4. preserve explicit duplicate/supersession relationships;
5. use **selective salvage**—fresh branches with selected cherry-picks/patches or current-spec reimplementation—rather than merging stale branches wholesale;
6. propose tracker/code/runtime reconciliation with evidence rather than silently rewriting state;
7. repair in lanes and prove the restored workflow with one clean end-to-end issue.

## Greenfield mode

For a new project, establish repository instructions, explicit tracker authority, issue contract, isolation conventions, CI baseline, PR/review policy, repository-rule audit, deployment/database discovery, Definition of Ready/Done and context policy before feature work. Prove the workflow with one representative end-to-end issue.

Do not invent a license, maintainers, security contacts, deployment account, database ownership or credentials.

## Evidence rule

Never claim persistence merely because an attempted command or provider call returned success. Record an explicit persistence/reference proof when the observing layer provides one; otherwise report the action as attempted and leave persistence unknown.

## Implemented surface

The current implementation includes environment/capability discovery, risk/policy/evidence contracts, read-only local Git inspection/audit, explicit work-authority mapping, dynamic workflow readiness/completion semantics, host-provided Linear normalization, observational Beads discovery/concurrency assessment, material comment vs independent-review rules, guarded local worktree creation, remote delegation planning, work-graph audit, greenfield bootstrap planning, recovery evidence graphs, default-branch CI baseline diagnosis, PR/work classification, supersession reasoning, selective salvage planning, tracker/runtime reconciliation, lane-based project recovery plans, and CLI read/audit/plan commands.

Provider writes, Linear mutation, Beads claim/update mutation, GitHub PR creation/review/merge through provider adapters, recovery cleanup mutations, deployment/database mutation, Context7 retrieval, real MCP transport, and frontier execution features remain separately gated until their implementation layers are proven.
