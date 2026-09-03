# Repository Automation

Use this reference whenever the repository may contain hooks, watchers, bots, generators, auto-commit scripts, background agents, CI jobs that write to Git, dependency/release automation, or any other actor that can mutate repository state.

## Core model

Treat automation as a concurrent repository actor with explicit identity, trigger, runtime, authority, scope, expected-state policy, concurrency model, idempotency expectation, verification and recovery.

Keep these authorities separate:

`auto-stage → auto-commit → auto-push → auto-pr → auto-review → auto-merge → auto-deploy`

Permission for one does not imply permission for the next. A local checkpoint bot with `auto-stage` + `auto-commit` is not authorized to push, open a PR, review, merge or deploy.

## Discovery before mutation

Before staging/committing or recovery cleanup, inspect for background writers:

- `.git/hooks` and `core.hooksPath`;
- Husky, Lefthook, pre-commit and custom hook directories;
- package scripts and `scripts/` files containing Git mutation commands;
- GitHub Actions or other CI that commits/pushes/tags/releases/deploys;
- Dependabot/Renovate/release bots;
- watchers, IDE plugins, sync agents or scheduled jobs when observable.

Configuration presence is evidence of an actor, not proof of its credentials or authority. An unidentified active writer is a concurrency risk.

## Staging safety

Prefer explicit path staging. Repository-wide `git add -A`, `git add .` or equivalent is unsafe when ownership of every changed path is not proven.

Never automatically absorb:

- another agent's edits;
- unrelated untracked files;
- `.env`, credentials, private keys or local configuration;
- editor/IDE state;
- debug dumps, logs or caches;
- generated outputs not owned by the automation actor.

The staged diff is a separate state transition and must be inspected/hashed before commit.

## Checkpoint commits

A safe automated checkpoint commit requires:

1. a proven persistent **isolated worktree** and named task branch;
2. actor authority for `auto-stage` and `auto-commit` only;
3. exact expected HEAD and current branch;
4. an explicit allowlist of task-owned paths;
5. no unexplained changed path outside that set;
6. revalidation immediately before staging;
7. staging only the explicit paths;
8. normal `git commit` so repository hooks execute;
9. post-hook/post-commit reinspection;
10. local commit evidence only.

A checkpoint commit never implies `auto-push`. Do not claim remote persistence from a local commit.

## Hooks

Hooks are part of the repository's execution environment. Detect and honor them. If a hook rejects a commit, diagnose the hook/failure; do not automatically retry with `--no-verify` or another hook bypass.

If a hook modifies files, re-inspect the staged/committed path set. Hook changes outside the actor's allowlist are a failed automation transaction requiring recovery/review.

## Loop prevention

Analyze trigger/output graphs before enabling an actor that can commit or push. Common dangerous cycle:

`push → workflow → generate → commit → push → workflow → ...`

Loop controls can include:

- actor/provenance markers that suppress self-trigger;
- event filters;
- path filters;
- dedicated automation branches;
- concurrency groups/locks;
- no-op/diff checks;
- semantic idempotency.

A generic `[skip ci]` convention is not a universal safety mechanism unless the project's CI actually proves that behavior.

## Idempotency

For generators/formatters, repeated execution against the same input identity should converge to the same semantic output. Compare semantic/content hashes between first and second runs. New diff on identical input is an automation defect unless explicitly designed and separately authorized.

## Push / PR / review / merge / deploy

Treat each as a new gate with new expected-state evidence:

- **auto-push:** remote ref/head must be current; force push is separately high risk.
- **auto-pr:** branch identity, base branch and issue/change identity must be current.
- **auto-review:** reviewer independence/risk policy applies; comments are not approvals.
- **auto-merge:** current head checks, review threads, merge group/queue and deployment/database implications must be current.
- **auto-deploy:** merge success is not deployment health; provider/runtime/database gates apply.

Background direct pushes to a protected/default branch and background force-push are denied by default.
