# Project Recovery / Archaeology

Load this reference when a repository is inherited in an unhealthy or uncertain state: broken default-branch CI, many stale/failed/conflicted PRs, duplicate or superseded work, abandoned branches/worktrees, tracker drift, deployment revision drift, or uncertain migration state.

## Recovery begins with archaeology, not cleanup

Do not start by rebasing every PR, deleting branches, closing issues, force-pushing, or changing application code.

First inventory the project:

- project/issue/work-graph systems and their authority map;
- branches, worktrees, commits and tags;
- open/draft/recently closed PRs and review threads;
- CI workflows, required checks, rulesets and recent default-branch history;
- deployment/runtime revision;
- database/migration state;
- active automations that can mutate any of those systems.

Preserve unexplained work and historical evidence.

## Default-branch CI baseline first

Before blaming a PR, establish current default-branch CI health.

If main/default reproduces the same stable failure fingerprint as multiple PRs, treat that shared failure as a baseline problem and repair/prove the baseline once. Do not make every PR mutate its code to satisfy a broken shared workflow.

If main is healthy and a PR has a unique failure, classify that separately as PR-specific.

If default-branch evidence is missing/stale/ambiguous, **unknown is a valid result**. Do not invent causality.

## Evidence graph

Reconstruct links among:

`project -> issue/bead -> branch/worktree -> commits -> PR -> reviews -> CI -> merge -> deployment -> migration/database evidence`

Explicit links and provider-native relationships are strongest. Inferred links require retained evidence. Similar titles or newer timestamps alone are not identity or supersession proof.

## Classification

An artifact may carry multiple labels: current, blocked, stale, duplicate, superseded, abandoned, orphaned, conflicted, baseline-CI-failed, PR-specific-failed, tracker/code drift, production-active, salvageable, unsafe-to-salvage, or unknown.

Do not collapse uncertainty into one convenient state.

## Supersession

Treat supersession as a graph. Preserve explicit duplicate/supersedes relationships from Beads, Linear/GitHub metadata, PR decisions, or other authoritative sources.

A newer timestamp alone does not prove replacement.

When inferred, require stable shared work identity plus explicit replacement evidence and retain that derivation.

## Selective salvage

Do not merge a large stale branch merely to "save the work."

Preferred strategies are:

- repair the shared CI baseline and rerun when code was not proven at fault;
- fresh branch/worktree + inspected cherry-picks for selected commits;
- fresh branch + selected patches/hunks;
- reimplement current acceptance criteria when the old architecture is obsolete;
- hold for evidence when safety/identity is unknown;
- no salvage when the artifact is explicitly unsafe.

Every salvage result is a new integration candidate and receives current tests/review.

## Tracker/code/runtime reconciliation

Compare tracker state with merge/deployment/Definition-of-Done evidence. Examples:

- tracker says Done but PR never merged;
- PR merged while Bead/Linear remains In Progress;
- tracker closed but production verification required by policy is missing;
- blocker remains although authoritative merged evidence proves it resolved.

Produce proposed corrections with evidence and authority domain. Do not silently rewrite tracker state.

## Recovery lanes

A recovery plan should normally separate:

1. work-graph reconciliation;
2. default-branch CI repair;
3. repository governance/rules repair;
4. PR salvage/supersession cleanup;
5. deployment/database reconciliation;
6. one clean proving issue through the restored workflow.

Only run lanes concurrently when their mutation scopes are actually disjoint.

## Proof of recovery

A cleaner backlog is not enough. Prove the restored workflow with one representative issue:

`READY -> CLAIM -> ISOLATED WORK -> IMPLEMENT -> VERIFY -> PR -> INDEPENDENT REVIEW -> CI -> MERGE -> DEPLOY/MIGRATE IF REQUIRED -> PRODUCTION VERIFY -> CLOSE`

The currently implemented recovery CLI is read/classify/plan only. It consumes JSON evidence snapshots and does not close PRs, delete branches, mutate trackers, change CI/rules, deploy, or migrate databases.
