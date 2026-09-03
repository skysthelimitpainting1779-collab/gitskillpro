# GitSkillPro Design Specification

## Status

Approved direction from the operator: standalone repository, hybrid Skill + executable tooling, universal across local/cloud/plugin/sandbox environments, concurrency-safe by default, autonomous-PR aware, CI-aware, and deployment-aware.

## Product goal

GitSkillPro is a universal repository-operations system for coding agents. It teaches and, when tooling permits, mechanically enforces correct Git, GitHub, CI, multi-agent, and deployment behavior without assuming a specific harness, execution environment, or human reviewer.

It is not a Git glossary. It is an operational grammar and capability-aware decision system.

## Core design principles

1. **Inspect before acting.** Detect runtime, repository, permissions, persistence, available tools, current Git state, remote state, CI state, and deployment state before selecting an operation.
2. **Capability-aware execution.** The same intent may execute through local `git`, `gh`, a host-native GitHub connector/plugin, a Vercel connector/plugin, an MCP tool, or an API adapter depending on the environment.
3. **Native integration first.** When the host already exposes an authorized GitHub or Vercel integration, prefer it rather than reimplementing credential handling or scraping.
4. **Local Git remains authoritative for local Git state.** Worktrees, index/staging, stash, local reflog, untracked files, local conflicts, and filesystem-level operations require a local-repository adapter when available; a remote GitHub adapter must never pretend it can observe them.
5. **Assume concurrent agents.** The environment is non-exclusive unless proven otherwise. Refresh relevant state before material operations and detect stale assumptions.
6. **Evidence before mutation.** Record preconditions, chosen operation, expected effect, result, validation evidence, risks, and recovery path.
7. **Prefer reversible operations.** Escalate destructive history rewrites, force updates, credential/security changes, production changes, and irreversible operations.
8. **Separate gates.** Code correctness, CI health, merge safety, deploy safety, and production health are distinct decisions.
9. **No-human-review assumption.** Pull requests must carry enough machine-verifiable evidence for an autonomous reviewer to challenge the implementation and make a risk-gated merge recommendation.
10. **Provider adapters never redefine core policy.** Providers expose capabilities and evidence; the core policy engine decides what is allowed or required.

## Distribution surfaces

GitSkillPro ships as one repository with multiple surfaces over the same core contract:

- **Agent Skill** — judgment-heavy instructions and decision protocols.
- **CLI** — deterministic local inspection, audit, evidence, and orchestration commands.
- **MCP server** — standard tool surface for external agents/harnesses.
- **Plugin package** — packages the skill and MCP capabilities for compatible OpenAI/Codex/ChatGPT environments.
- **Adapters** — environment/provider implementations for local Git, GitHub, Vercel, generic shell/process execution, and future providers.

The CLI and MCP server must call the same core library; they are not parallel implementations.

## Capability broker

Every operation resolves through a capability broker. The broker identifies available adapters and selects the safest valid execution path for the requested intent.

Default preference order when semantically equivalent:

1. authorized host-native connector/plugin;
2. dedicated GitSkillPro MCP/provider adapter;
3. local CLI (`git`, `gh`, `vercel`) when a persistent shell and credentials are available;
4. configured REST/GraphQL/provider API adapter;
5. read-only diagnosis / explicit inability when no safe capability exists.

This is a preference order, not a blanket rule. Local repository state always requires a local-capable adapter. A remote GitHub connector cannot answer whether an untracked local file exists, and a local Git adapter cannot prove a Vercel production deployment is healthy without deployment-provider evidence.

## Runtime and environment discovery

The discovery layer must classify at least:

- persistent local clone;
- linked Git worktree;
- container;
- VPS/remote machine;
- ephemeral coding sandbox;
- CI runner;
- cloud coding agent;
- plugin/connector-only host;
- MCP host/client;
- read-only environment;
- unknown environment.

It records capabilities independently from labels: filesystem read/write, process spawning, shell, Git CLI, GitHub API/connector, Vercel API/connector, network, credentials, persistence, secret access, PR mutation, workflow inspection, deployment inspection, deployment mutation, and local worktree support.

## Git primitive registry

The skill/reference system must cover the practical Git operational surface, grouped by purpose rather than presented as a flat glossary.

### Repository and object model

repository, working tree, Git directory, object database, blob, tree, commit, annotated/lightweight tag, ref, symbolic ref, HEAD, detached HEAD, index, stage entries, merge base, reachability, ancestry, revision/range notation, reflog, packfiles, alternates.

### Inspection and comparison

status, diff, diff --cached, show, log, shortlog, blame, rev-parse, rev-list, merge-base, describe, ls-files, ls-tree, cat-file, for-each-ref, name-rev, range-diff, cherry, verify-commit, verify-tag, fsck.

### Working tree and index mutation

add, restore, checkout paths, rm, mv, reset modes, clean, update-index, intent-to-add, skip-worktree/assume-unchanged distinctions, patch/interactive staging.

### Commit/history construction

commit, amend, fixup/squash conventions, cherry-pick, revert, merge, rebase, rebase --onto, interactive rebase, commit-tree awareness, notes where relevant.

### Branches, refs, tags

branch, switch, checkout, tag, update-ref awareness, delete/rename/copy branch, upstream/tracking configuration, remote-tracking refs.

### Temporary/isolation primitives

stash, worktree, patch/apply, format-patch/am, bundle, archive.

### Remote synchronization

remote, fetch, pull, push, refspecs, push.default, pruning, fast-forward rules, force, force-with-lease, force-if-includes, remote rename/set-url.

### Conflict and recovery

merge conflict stages, ours/theirs semantics by operation, mergetool, rerere, abort/continue/skip flows, reflog recovery, ORIG_HEAD awareness, reset/revert recovery distinctions, lost-commit recovery, fsck/lost-found awareness.

### Repository topology and scale

submodule, subtree awareness, sparse-checkout, partial clone, shallow clone, worktree config, maintenance/gc, LFS awareness, attributes, ignore/exclude, hooks, config scopes, safe.directory, signing.

### Diagnostic primitives

bisect, grep, log search, blame, show, diff algorithms, merge-tree awareness, trace/debug environment awareness.

Low-level plumbing is included for understanding and scripted inspection where justified, but normal agent behavior should prefer safer porcelain unless the plumbing operation is required and its invariants are understood.

## Safety classification

Every primitive/action is tagged with operational metadata:

- reads vs writes;
- local-only vs shared/remote mutation;
- reversible vs conditionally reversible vs destructive;
- working-tree impact;
- index impact;
- ref/history impact;
- remote impact;
- concurrency sensitivity;
- secret/security sensitivity;
- required preflight evidence;
- required postflight validation;
- recovery procedure;
- escalation conditions.

Examples:

- `git status`: read-only, low risk.
- `git stash`: local mutation, usually recoverable, but not a delegation strategy.
- `git reset --hard`: destructive to tracked working-tree/index state; blocked unless explicit preconditions and recovery evidence exist.
- `git push --force`: remote destructive history rewrite; default deny.
- `git push --force-with-lease`: still high-risk; permitted only on an authorized private/task branch with verified lease expectations and policy permission.
- `git revert`: shared-history-safe reversal by new commit, usually preferred for published history.

## Multi-agent concurrency protocol

Non-exclusivity is the default assumption.

Before a material operation, the agent refreshes the state relevant to that operation. For local integration this includes HEAD, branch, status/index state, worktree registry, and remote-tracking state. For remote operations this includes current target/head SHAs and PR/check state. For deployment operations it includes the currently deployed revision and active deployment state.

Agents must never overwrite or discard unexplained changes merely because they did not create them.

### Local delegation default

When a persistent local checkout supports worktrees:

`one task -> one branch -> one worktree -> one agent -> one evidence packet`

The supervisor creates the task branch/worktree, issues a delegation packet, records the starting SHA, defines allowed scope and validation commands, and integrates only after evidence review.

Stash is not used to simulate multi-agent isolation when worktrees are available.

### Remote/plugin-only delegation

When local worktrees are unavailable, the system substitutes remote isolation:

`one task -> one branch -> one agent/session -> one PR -> one evidence packet`

The evidence packet explicitly records that local worktree isolation was unavailable.

## Pull request protocol

A PR is an evidence-bearing integration candidate, not proof of correctness.

Required PR evidence includes:

- intent and scope;
- base/head SHAs;
- changed-file summary;
- risk classification;
- tests/static analysis performed;
- CI/check status and freshness;
- independent review findings;
- unresolved review threads;
- dependency/configuration/CI/deployment implications;
- rollback/revert strategy;
- known unknowns;
- merge recommendation.

Immediately before merge, re-check head SHA, base movement, required checks, review state, conflicts, and relevant deployment/pre-merge gates.

When a human reviewer is absent, an independent reviewer agent/context must challenge the implementation. The implementing agent's self-review alone is insufficient for medium/high-risk changes.

## CI audit protocol

The agent must diagnose the failing system before modifying application code.

Failure classes include at minimum:

- source-code regression;
- test failure;
- type/lint/static analysis failure;
- dependency/lockfile/install failure;
- workflow syntax/configuration failure;
- trigger/event-context mismatch;
- permissions/token-scope failure;
- missing/incorrect secret or variable;
- environment/runtime/version drift;
- runner/image/toolchain failure;
- cache/artifact corruption or stale state;
- concurrency cancellation/race;
- flaky/non-deterministic test;
- external service/API/quota failure;
- GitHub platform/infrastructure failure;
- deployment-provider failure;
- branch/ruleset/required-check wiring error.

The audit separates **root cause** from unrelated hardening findings. It must not rewrite production code to make a broken CI harness appear green.

GitHub Actions audits include events/triggers, permissions, action pinning, reusable workflows, matrices, runner selection, caches, artifacts, environments, secrets/variables, OIDC, concurrency, timeout/retry behavior, required checks, and deployment relationships.

## GitHub adapter

The GitHub adapter covers repository metadata, refs/branches, commits, PRs, diffs, reviews, review threads, issues where relevant, workflow runs/jobs/logs/artifacts, commit checks/statuses, rulesets/branch protections when available, merge settings, merge/auto-merge where policy allows, releases/deployments where available, and repository-level evidence.

In hosts that expose an authorized GitHub plugin/connector, the capability broker should use it directly. GitSkillPro must not require a second GitHub token merely to reproduce capabilities the host already safely provides.

## Vercel adapter

The Vercel adapter is a first-class deployment adapter, not a Git adapter.

It covers project/deployment discovery, preview vs production classification, deployment revision/SHA where available, build status/logs, runtime errors/logs, deployment URLs, environment/config evidence available to the adapter, and deployment execution only when policy authorizes it.

In hosts that expose an authorized Vercel plugin/connector, use it directly. Current connected capabilities include deployment listing/inspection, build-log inspection, runtime-log inspection, protected deployment fetch, and deployment execution, so GitSkillPro should consume those rather than scraping Vercel pages.

Additional deployment providers use the same adapter contract later.

## Deployment audit and gates

Deployment state is separate from CI and merge state.

Lifecycle:

`change -> local verification -> PR -> independent review -> CI -> merge eligibility -> merge -> deployment eligibility -> deploy -> deployment verification -> production observation -> complete/rollback`

The deployment audit checks, when relevant and observable:

- provider/project identity;
- target environment;
- source revision;
- build/runtime compatibility;
- environment-variable/secret scope without exposing secret values;
- migrations/stateful changes;
- domains/routing/certificates where relevant;
- preview/staging/production distinction;
- deployment concurrency;
- health checks/smoke tests;
- logs/runtime errors;
- rollback mechanism and last-known-good revision.

Green CI never implies a healthy production deployment.

## CLI surface

Initial CLI namespace:

- `gsp doctor` — runtime/capability discovery.
- `gsp inspect` — repository and Git-state snapshot.
- `gsp audit git` — Git safety/state audit.
- `gsp audit ci` — CI/workflow causality audit.
- `gsp audit pr` — PR evidence/readiness audit.
- `gsp audit deploy` — deployment readiness/health audit.
- `gsp delegate` — create/describe an isolated delegation unit when supported.
- `gsp evidence` — emit/validate evidence packets.
- `gsp recover` — guided recovery analysis; destructive execution remains separately gated.

Mutation commands should require explicit intent and policy checks; read/audit commands should be the default surface.

## MCP surface

The MCP server exposes structured tools backed by the same core library. Initial tools mirror the audit/inspection capabilities rather than exposing arbitrary shell execution.

Candidate tools:

- `runtime.inspect`
- `repo.inspect`
- `git.audit`
- `git.plan_operation`
- `ci.audit`
- `pr.audit`
- `deployment.audit`
- `delegation.plan`
- `evidence.validate`

Mutation tools are added only with explicit safety metadata, authorization boundaries, and confirmation/escalation semantics.

Remote HTTP MCP authorization must follow the current MCP authorization specification; local stdio mode must not invent a network OAuth flow and should obtain local credentials through the host/environment according to MCP guidance.

## Plugin surface

The OpenAI-compatible plugin packages:

- the GitSkillPro skill;
- the GitSkillPro MCP server/tool definitions;
- installation/discovery metadata required by the current plugin format;
- no duplicated GitHub or Vercel credentials when those integrations are already connected to the host.

The skill instructs the agent to discover host capabilities first and call native GitHub/Vercel plugins/connectors when available. The MCP server provides portable GitSkillPro-specific audit and orchestration capabilities.

## Evidence contract

Material operations produce a structured evidence record containing:

- operation ID;
- timestamp;
- environment classification;
- adapters/capabilities used;
- repository identity;
- starting refs/SHAs;
- detected concurrent-change risk;
- intent;
- preconditions;
- planned operation;
- actual operation;
- result;
- validation evidence;
- CI/PR/deployment evidence references;
- risk classification;
- recovery instructions;
- unresolved unknowns;
- final recommendation/status.

Evidence is not a claim that persistence occurred unless the adapter returns proof of persistence.

## Proposed repository structure

```text
/
  README.md
  AGENTS.md
  package.json
  tsconfig.json
  LICENSE
  docs/
    architecture.md
    primitives.md
    adapters.md
    safety-model.md
    superpowers/specs/2026-09-03-gitskillpro-design.md
  skills/
    git-skill-pro/
      SKILL.md
      README.md
      references/
        git-primitives.md
        github.md
        ci.md
        deployment.md
        concurrency.md
        recovery.md
  src/
    core/
      capability.ts
      environment.ts
      policy.ts
      evidence.ts
      operation.ts
    adapters/
      local-git.ts
      github.ts
      vercel.ts
    audits/
      git.ts
      ci.ts
      pr.ts
      deployment.ts
    delegation/
      worktree.ts
      remote-branch.ts
    cli/
      index.ts
    mcp/
      server.ts
  schemas/
    evidence.schema.json
    capability.schema.json
    delegation.schema.json
  tests/
    environment.test.ts
    policy.test.ts
    git-audit.test.ts
    ci-audit.test.ts
    pr-audit.test.ts
    deployment-audit.test.ts
    concurrency.test.ts
    skill-contract.test.ts
```

Provider-specific code stays behind interfaces so GitLab, Bitbucket, Cloudflare, Netlify, Railway, Render, Fly.io, Kubernetes, or other adapters can be added without changing the core policy vocabulary.

## Testing strategy

Use test-first development.

Tests must cover at minimum:

- environment/capability detection does not overclaim;
- remote adapters cannot claim local-state knowledge;
- dirty shared work cannot be discarded silently;
- worktree delegation is preferred when supported;
- concurrent ref movement invalidates stale merge assumptions;
- destructive operations require stronger policy gates;
- CI audit distinguishes harness failures from source failures;
- unrelated CI hardening findings do not become false root causes;
- PR audit rejects stale/missing evidence;
- green CI alone cannot satisfy deployment health;
- plugin/native connector selection takes precedence when semantically appropriate;
- evidence packets report actual persistence only when proven.

Integration tests that require real GitHub/Vercel credentials must be opt-in and must not run destructive production operations by default.

## Security boundaries

- least privilege for GitHub/Vercel/MCP credentials;
- never log secret values;
- no token passthrough between unrelated services;
- remote MCP authorization follows current MCP audience/resource binding requirements;
- do not execute arbitrary repository-provided commands solely because a repository requests them;
- treat workflow files, hooks, package scripts, and external actions as executable/supply-chain surfaces;
- production deploy and destructive history mutation remain high-impact operations with explicit policy gates.

## Initial implementation boundary

Version 0.1 builds the core contracts, Skill, CLI read/audit surface, MCP read/audit surface, local Git adapter, GitHub adapter interface/native-connector path, Vercel adapter interface/native-connector path, evidence schemas, CI/PR/deployment auditors, concurrency/worktree delegation protocol, and tests.

Version 0.1 does **not** attempt to reproduce every provider API, become a general CI platform, auto-fix every workflow, or perform arbitrary production deployment mutation. Those capabilities can be layered on after the audit/evidence core is proven.
