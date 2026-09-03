# Workflow and Work Authority

Load this reference when a task involves Linear, Beads, GitHub Issues/Projects, agent delegation, lifecycle state, or greenfield workflow setup.

## Authority first

Do not assume one work system owns every kind of truth. Resolve an explicit authority map before reconciling or mutating overlapping systems.

A common layered configuration is:

- **Linear** — project outcome, roadmap/milestone, human-visible issue intent and status.
- **Beads** — executable dependency graph, blockers, claims, discovered work, duplicate/supersession relationships.
- **GitHub** — branches, commits, PRs, reviews, checks, merge state.

Mirrors and integrations are projections unless the project explicitly makes them canonical.

## Definition of Ready

Before implementation, resolve enough evidence to know:

- requested outcome;
- target repository;
- acceptance criteria when required;
- blockers/dependencies;
- authority to perform the planned risk tier;
- verification expectations.

Material ambiguity remains blocked/unknown rather than guessed.

## Definition of Done

Do not close a work item because a commit or PR exists. The project policy may require any combination of:

- merged;
- deployed;
- database verified;
- production verified;
- documentation;
- released/exposed.

## Agent comments are not reviews

Material comments include claimed, plan, progress, blocked, CI diagnosis, review, merge-ready, deployment, database, completion and follow-up updates.

A comment does not imply approval. Code-review approval, merge recommendation, merge authorization and merge execution remain distinct events.

For R3/R4 work, independent review is required. The implementer cannot satisfy that gate by approving their own change.

## Delegation

Prefer `one task -> one branch -> one worktree -> one agent` only when persistent local worktree capability is proven **and** the configured work graph is safe for concurrent writers.

If local isolation is unavailable, plan remote branch/session isolation and record the limitation. Branch ownership is advisory, not a lock.
