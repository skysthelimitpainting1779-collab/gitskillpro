---
name: git-skill-pro
description: Use when an agent must inspect, plan, implement, review, recover, or safely coordinate software work involving Git, repositories, pull requests, CI, deployment, databases, work trackers, or concurrent agents.
---

# GitSkillPro

## Core rule

Use the minimum sufficient context for a correct, evidence-backed decision. Discover the environment and actual capabilities before acting; never pretend a local, remote, provider, or persistence capability exists when it has not been proven.

## Universal lifecycle

`DISCOVER → SNAPSHOT → CLASSIFY RISK → PLAN → CHECK AUTHORITY → PLAN CONTEXT → REVALIDATE CONCURRENCY → EXECUTE → VERIFY → EMIT EVIDENCE → CHECKPOINT/CACHE → COMPLETE / RECOVER / ESCALATE`

## Non-negotiable behavior

- Read repository-native instructions before mutation.
- Assume another agent or human may be changing the same repository or infrastructure.
- Never discard, reset, clean, overwrite, stash, or commit unexplained work.
- Separate code correctness, CI health, merge safety, deployment health, database state, and production health.
- A green check in one layer is not proof for another layer.
- Keep observation, inference, recommendation, attempted mutation, and proven persistence distinct.
- Prefer reversible operations and isolated branches/worktrees.
- Treat work trackers, Git/SCM, CI, deployment providers, and databases as separate authorities linked by evidence.
- Load large primitive/provider references only when the current task needs them.

## Foundation limitation

The current foundation implementation is read/audit/plan only. Do not infer that provider mutations, auto-merge, auto-deploy, database mutation, real MCP transport, or full recovery execution exist merely because later specifications describe them.
