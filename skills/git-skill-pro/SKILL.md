---
name: git-skill-pro
description: Use when an agent must inspect, plan, implement, review, recover, or safely coordinate software work involving Git, repositories, pull requests, CI, deployment, databases, work trackers, or concurrent agents.
---

# GitSkillPro

## Operating principle

Use the **minimum sufficient context for a correct, evidence-backed decision**. Discover the environment and actual capabilities before acting; never pretend a local, remote, provider, or persistence capability exists when it has not been proven.

## Universal lifecycle

`DISCOVER → SNAPSHOT → CLASSIFY RISK → PLAN → CHECK AUTHORITY → PLAN CONTEXT → REVALIDATE CONCURRENCY → EXECUTE → VERIFY → EMIT EVIDENCE → CHECKPOINT/CACHE → COMPLETE / RECOVER / ESCALATE`

## Start every task here

1. Resolve project/repository/work-item scope.
2. Read repository-native instructions and relevant GitSkillPro specs/configuration.
3. Discover runtime and capabilities; see `references/environment.md` when the environment is ambiguous.
4. Snapshot only the state needed for the current decision.
5. Classify risk before mutation; use `references/primitive-safety.md` for foundation Git primitives.
6. Assume concurrency and revalidate state immediately before material operations.
7. Demand evidence from the layer that can actually prove the claimed postcondition.

## Non-negotiable behavior

- Never discard, reset, clean, overwrite, stash, or commit unexplained work.
- Separate **code correctness**, **CI health**, **merge safety**, **deployment health**, **database state**, and **production health**. A green check in one layer is not proof for another layer.
- Keep observation, inference, recommendation, attempted mutation, verification, and proven persistence distinct.
- Prefer reversible operations and isolated branches/worktrees.
- Treat work trackers, Git/SCM, CI, deployment providers, and databases as separate authorities linked by evidence.
- A connected GitHub/provider tool may prove remote/provider facts but must never pretend it can see local untracked files, stash, index state, reflog, or worktree dirtiness.
- Local Git may prove repository facts but must never claim production/deployment/database health without provider evidence.
- Load large primitive/provider references only when the current task needs them.
- Unknown or newly discovered mutation primitives default to denied until classified.

## Multi-agent default

Assume the environment is non-exclusive. Prefer `one task → one branch → one worktree → one agent → one evidence packet` when a persistent local worktree capability is proven. When it is not, use remote branch/session isolation and explicitly record that local isolation was unavailable.

## Failure diagnosis

Before editing application code for a red check, determine whether the failure belongs to source code, tests, dependency resolution, workflow configuration, permissions/secrets, runner/toolchain, cache/artifacts, external providers, repository rules, deployment, or database dependencies.

## Evidence rule

Never claim persistence merely because an attempted command or provider call returned success. Record an explicit persistence/reference proof when the observing layer provides one; otherwise report the action as attempted and leave persistence unknown.

## Foundation limitation

The currently implemented foundation is read/audit/plan only. It supports environment discovery, core risk/policy/evidence contracts, read-only local Git inspection, a Git audit, and CLI planning. Do not infer that provider mutations, auto-merge, auto-deploy, database mutation, real MCP transport, full recovery execution, Beads/Linear mutation, Context7 retrieval, or frontier features exist merely because later specifications describe them.
