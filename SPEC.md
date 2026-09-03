# GitSkillPro — Canonical Specification

**Version:** 0.1-design

**Status:** Canonical implementation contract

**Repository:** `skysthelimitpainting1779-collab/gitskillpro`

GitSkillPro is a universal repository-operations system for coding agents. It combines an Agent Skill, a shared policy/decision engine, a CLI, an MCP server, plugin packaging, and capability-aware provider adapters so an agent can operate safely whether it is running locally, in a worktree, on a VPS, in a container, in CI, in an ephemeral sandbox, inside a cloud coding agent, or through host-native plugins/connectors.

GitSkillPro is not a Git glossary. It is an operational grammar: inspect the environment, understand the repository and surrounding systems, select the safest valid primitive, execute only within proven authority, verify the result, emit evidence, and preserve a recovery path.

---

## 1. Normative language

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative.

When provider capabilities differ, the implementation MUST prefer truthful partial knowledge over invented completeness.

---

## 2. Product goals

GitSkillPro MUST:

1. teach agents the practical Git and remote-collaboration primitives required to safely operate a repository;
2. detect where the agent is running and what capabilities actually exist before acting;
3. work across local CLI, cloud/sandbox, plugin/connector, MCP, CI-runner, VPS, container, and remote-only environments;
4. assume other agents or humans may be changing the same repository or infrastructure concurrently;
5. support local multi-agent delegation through Git worktrees when available;
6. support remote/plugin-only delegation through isolated branches and PRs when local worktrees are unavailable;
7. assume PRs may receive no human review and therefore require machine-verifiable evidence and independent agent review;
8. distinguish code failures from CI/workflow/infrastructure failures before editing application code;
9. treat merge, deployment, database migration, and production health as separate gates;
10. detect and audit hosting, infrastructure, CI, and database systems without hard-coding one provider;
11. prefer host-native authorized GitHub, Vercel, Cloudflare, Supabase, or other provider connectors when they expose the needed capability;
12. fall back to official CLI/API/MCP adapters when native connectors are not available;
13. preserve reversibility and provenance;
14. never claim persistence, deployment success, database safety, or production health without evidence from the layer that can prove it.

---

## 3. Non-goals

Version 0.1 MUST NOT:

- become an unrestricted remote shell;
- invent credentials or bypass provider authorization;
- auto-merge or auto-deploy high-risk changes merely because CI is green;
- assume a successful Git rollback also rolls back data;
- assume a database restore also rolls back code;
- replace provider-specific security policy;
- silently alter branch protection, repository ownership, billing, DNS ownership, production secrets, or database access policy;
- treat every provider as if it has identical deployment or rollback semantics;
- require a second provider token when the host already exposes an authorized connector with the required capability.

---

## 4. System architecture

```text
                         +-------------------------+
                         |      Agent / Harness    |
                         +------------+------------+
                                      |
              +-----------------------+-----------------------+
              |                       |                       |
         Agent Skill                CLI                    MCP Server
              |                       |                       |
              +-----------------------+-----------------------+
                                      |
                         +------------v------------+
                         |  GitSkillPro Core       |
                         |  - environment model    |
                         |  - capability broker    |
                         |  - operation planner    |
                         |  - policy/risk engine   |
                         |  - evidence engine      |
                         +------------+------------+
                                      |
               +----------------------+-----------------------+
               |                      |                       |
        Local/Process             Remote/SCM              Provider/Data
        Adapters                  Adapters                 Adapters
        git / gh / shell          GitHub/GitLab/etc.       deploy/db/infra
```

The Skill, CLI, MCP server, and plugin MUST use the same policy vocabulary and evidence contracts. They MUST NOT become separate implementations with divergent safety rules.

---

## 5. Universal operation lifecycle

Every material operation follows this state machine:

```text
DISCOVER
  -> SNAPSHOT
  -> CLASSIFY RISK
  -> PLAN
  -> CHECK AUTHORITY
  -> REVALIDATE CONCURRENCY
  -> EXECUTE
  -> VERIFY
  -> EMIT EVIDENCE
  -> COMPLETE / RECOVER / ESCALATE
```

### 5.1 Discover

Determine environment, repository identity, provider identities, available adapters, permissions, persistence, CI, deployment, and database context.

### 5.2 Snapshot

Capture the narrow state needed to prove preconditions and recover from failure.

### 5.3 Classify risk

Assign a risk tier before mutation.

### 5.4 Plan

Select the safest primitive that achieves the intent. Prefer reversible and non-history-rewriting operations where practical.

### 5.5 Check authority

Confirm the active adapter is authorized for the requested mutation.

### 5.6 Revalidate concurrency

Refresh any state that may have moved since planning: HEAD, upstream, remote branch SHA, PR head/base, workflow state, deployment revision, database migration state, or provider resource version.

### 5.7 Execute

Perform only the planned operation. Do not opportunistically rewrite unrelated state.

### 5.8 Verify

Prove the expected postcondition using the appropriate layer.

### 5.9 Emit evidence

Produce a structured record of what was observed and what actually happened.

---

## 6. Environment and capability discovery

GitSkillPro MUST classify, where observable:

- persistent local clone;
- linked Git worktree;
- bare repository;
- container;
- VPS/remote machine;
- ephemeral coding sandbox;
- CI runner;
- cloud coding agent;
- plugin/connector-only host;
- MCP client/server host;
- read-only environment;
- unknown environment.

Labels are descriptive only. Decisions MUST use discovered capabilities.

### 6.1 Capability model

Capabilities include at minimum:

- filesystem read;
- filesystem write;
- persistent filesystem;
- process spawning;
- shell;
- local Git CLI;
- local `gh` CLI;
- local provider CLI;
- local worktree support;
- network access;
- GitHub read/write connector;
- GitHub Actions inspection;
- PR mutation;
- ruleset/branch-protection inspection;
- deployment inspection;
- deployment mutation;
- runtime log inspection;
- database inspection;
- database DDL/migration mutation;
- secret metadata inspection without secret-value exposure;
- SSH/container/orchestrator access;
- ability to delegate/spawn another agent;
- persistence proof.

A remote adapter MUST NOT claim local facts such as untracked files, stash contents, local reflog, local index entries, or worktree cleanliness.

A local Git adapter MUST NOT claim production deployment or database health unless a provider/data adapter supplies that evidence.

---

## 7. Capability broker

For a requested intent, GitSkillPro selects an adapter by semantic capability, not brand preference.

Default preference when equivalent:

1. already-authorized host-native plugin/connector;
2. GitSkillPro MCP/provider adapter;
3. official CLI available in a persistent shell;
4. official API/SDK;
5. authorized SSH/container/orchestrator inspection for machine-local state;
6. read-only diagnosis or explicit inability.

The broker MUST NOT choose a higher-preference adapter if it cannot observe the state required for the operation.

Examples:

- worktree creation -> local Git adapter;
- GitHub PR review -> native GitHub connector if available;
- Vercel deployment logs -> native Vercel connector if available;
- Supabase migration history -> native Supabase connector if available;
- Hostinger VPS process state -> VPS API/CLI/MCP or SSH depending on what can actually prove the fact.

---

## 8. Git primitive registry

GitSkillPro MUST maintain a versioned practical primitive registry. When local Git is available, it SHOULD discover the installed Git version and available command surface rather than assuming a fixed release.

The implementation SHOULD use version-aware inspection such as Git help/command discovery to identify capabilities unknown to the bundled baseline. Newly discovered commands MUST default to unclassified/read-only-deny-for-mutation until policy metadata exists.

### 8.1 Repository/object primitives

- repository / bare repository;
- working tree;
- Git directory;
- object database;
- blob;
- tree;
- commit;
- tag object;
- annotated/lightweight tags;
- refs;
- symbolic refs;
- `HEAD` and detached HEAD;
- index/staging area;
- index conflict stages;
- object IDs;
- ancestry/reachability;
- merge bases;
- revision and range notation;
- reflogs;
- packfiles;
- alternates.

### 8.2 Inspection primitives

- `status`;
- `diff`;
- cached/staged diff;
- `show`;
- `log`;
- `shortlog`;
- `blame`;
- `rev-parse`;
- `rev-list`;
- `merge-base`;
- `describe`;
- `ls-files`;
- `ls-tree`;
- `cat-file`;
- `for-each-ref`;
- `name-rev`;
- `range-diff`;
- `cherry`;
- `verify-commit`;
- `verify-tag`;
- `fsck`;
- `grep`;
- `show-ref`;
- `symbolic-ref`;
- `worktree list`;
- `remote -v`;
- config inspection.

### 8.3 Working-tree/index mutation primitives

- `add`;
- patch/interactive staging;
- `restore`;
- path checkout/restore;
- `rm`;
- `mv`;
- `reset` modes;
- `clean`;
- `update-index`;
- intent-to-add;
- skip-worktree;
- assume-unchanged.

GitSkillPro MUST teach that skip-worktree and assume-unchanged are not general-purpose ways to hide concurrent agent edits.

### 8.4 Commit/history construction primitives

- `commit`;
- amend;
- fixup/squash conventions;
- `merge`;
- fast-forward merge;
- merge commit;
- squash merge semantics;
- `rebase`;
- interactive rebase;
- `rebase --onto`;
- `cherry-pick`;
- `revert`;
- commit signing/verification;
- Git notes awareness.

### 8.5 Branch/ref/tag primitives

- `branch`;
- `switch`;
- `checkout`;
- branch create/delete/rename/copy;
- upstream/tracking configuration;
- remote-tracking refs;
- `tag`;
- `update-ref` awareness;
- default branch identification.

### 8.6 Isolation/temporary-transfer primitives

- `worktree`;
- `stash`;
- patch/apply;
- `format-patch` / `am`;
- `bundle`;
- `archive`.

Stash MUST be treated as temporary local state management, not the default multi-agent isolation model.

### 8.7 Remote synchronization primitives

- `remote`;
- `fetch`;
- `pull`;
- `push`;
- refspecs;
- fast-forward requirements;
- pruning;
- `force`;
- `force-with-lease`;
- `force-if-includes` awareness;
- remote URL mutation;
- tracking branch semantics.

Plain `--force` MUST default to deny for agent-authored remote mutations.

### 8.8 Conflict/recovery primitives

- merge/rebase/cherry-pick/revert conflict states;
- ours/theirs semantics as operation-dependent concepts;
- abort/continue/skip flows;
- `rerere`;
- mergetool awareness;
- reflog recovery;
- `ORIG_HEAD` awareness;
- lost-commit recovery;
- reset/revert distinction;
- fsck/lost-found awareness.

### 8.9 Repository topology/scale primitives

- submodules;
- subtree awareness;
- sparse checkout;
- shallow clone;
- partial clone;
- Git LFS awareness;
- attributes;
- ignore/exclude;
- hooks;
- config scopes;
- `safe.directory`;
- maintenance/gc;
- signing;
- worktree-specific config.

### 8.10 Diagnostic primitives

- `bisect`;
- diff algorithms;
- trace/debug environment awareness;
- merge-tree awareness;
- history search;
- blame/log correlation.

Low-level plumbing MAY be used for deterministic inspection or recovery when its invariants are understood. Normal agent workflows SHOULD prefer safer porcelain.

---

## 9. Primitive safety metadata

Every executable primitive/action MUST carry metadata:

- read vs write;
- local vs shared/remote;
- reversibility;
- working-tree impact;
- index impact;
- history/ref impact;
- remote impact;
- concurrency sensitivity;
- security/credential sensitivity;
- production impact;
- database/data impact;
- required preconditions;
- required evidence;
- postconditions;
- recovery procedure;
- escalation conditions.

### 9.1 Risk tiers

**R0 — Observation:** read-only inspection.

**R1 — Reversible local mutation:** local branch creation, staging, worktree creation, ordinary commits on an isolated branch.

**R2 — Shared reversible mutation:** pushing task branches, opening/updating PRs, non-production CI reruns, reversible remote metadata changes.

**R3 — High-risk shared/production mutation:** history rewrite, force-with-lease, merge to protected/default branch, deployment, migration application, resource mutation.

**R4 — Irreversible/security/ownership mutation:** destructive data operations without proven restore, credential/security policy changes, repository ownership, billing, destructive production resource deletion, unsafe force overwrite.

R3/R4 actions require stronger evidence and host/user policy authorization. R4 defaults to escalation unless explicit governance authorizes automation.

---

## 10. Multi-agent concurrency model

GitSkillPro MUST assume non-exclusivity by default.

No agent may assume a clean checkout remains clean, a remote ref remains unchanged, a PR head remains constant, or a production deployment remains current between inspection and mutation.

### 10.1 Optimistic concurrency

Operations SHOULD carry expected-state preconditions such as:

- expected HEAD SHA;
- expected upstream SHA;
- expected PR head SHA;
- expected target/base SHA;
- expected deployment revision;
- expected migration version;
- expected provider resource version when available.

If the expected state moved, the operation MUST stop, refresh, and re-plan rather than blindly overwrite.

### 10.2 Unexplained changes

Agents MUST NOT discard, reset, clean, overwrite, stash, or commit unexplained work merely because the active agent did not create it.

---

## 11. Local worktree delegation protocol

When a persistent local repository supports worktrees, the default delegation pattern is:

```text
one task -> one branch -> one worktree -> one agent -> one evidence packet
```

The supervisor MUST:

1. refresh the base branch;
2. record the base SHA;
3. create a task branch;
4. create a dedicated linked worktree;
5. issue a delegation packet containing scope, path, branch, base SHA, allowed files/areas, constraints, required tests, and completion contract;
6. prevent two agents from being intentionally assigned the same writable worktree;
7. independently inspect the returned diff/evidence;
8. revalidate base/head before integration;
9. remove/prune the worktree only after accepted integration or explicit abandonment.

The worker MUST NOT modify the supervisor's worktree.

---

## 12. Remote/plugin-only delegation

When worktrees are unavailable:

```text
one task -> one branch -> one agent/session -> one PR -> one evidence packet
```

The packet MUST state that local filesystem/worktree isolation was unavailable.

Branch ownership is advisory, not a lock. GitSkillPro MUST still detect ref movement.

---

## 13. Remote source-control adapters

### 13.1 GitHub — first-class

Required observable/operational areas where permissions allow:

- repository metadata;
- branches/refs/commits;
- diffs and changed files;
- issues where relevant;
- pull requests;
- PR reviews and review threads;
- commit checks/statuses;
- GitHub Actions workflows/runs/jobs/steps/logs/artifacts;
- branch protection/rulesets when observable;
- merge settings;
- merge/auto-merge when policy permits;
- releases/deployments when used;
- compare operations.

A connected host-native GitHub connector SHOULD be preferred to duplicating credentials.

### 13.2 GitLab, Bitbucket, Azure Repos and other remotes

They MUST fit the same abstract SCM contract: repository, refs, change request, review, checks/pipelines, policy, merge, releases/deployments where supported. Missing features MUST be represented as capability absence, not simulated.

---

## 14. Autonomous pull-request protocol

A PR is an integration candidate, not proof of correctness.

Every PR intended for autonomous evaluation MUST carry or link evidence for:

- intent and requested outcome;
- scope;
- base SHA;
- head SHA;
- changed files;
- behavioral change summary;
- risk tier;
- test/static-analysis evidence;
- CI status and freshness;
- independent reviewer findings;
- unresolved review threads;
- security/dependency/configuration implications;
- deployment implications;
- database/migration implications;
- rollback or forward-fix strategy;
- known unknowns;
- merge recommendation.

### 14.1 Independent reviewer

For R2+ changes, an independent reviewer context SHOULD evaluate the implementation. For R3 changes, it MUST.

The reviewer MUST inspect the actual diff/evidence rather than merely restating the implementer's summary.

### 14.2 Merge gate

Immediately before merge, revalidate:

- current head SHA;
- current base/target state;
- mergeability/conflicts;
- required checks;
- check freshness;
- unresolved review threads;
- ruleset/branch protection state when observable;
- migration/deployment gates relevant to the change.

Green CI alone MUST NOT be sufficient for an R3 merge.

---

## 15. CI audit system

The CI auditor MUST answer **what failed and in which layer** before recommending source changes.

### 15.1 Failure classes

- source regression;
- test failure;
- lint/type/static-analysis failure;
- dependency/lockfile/install failure;
- workflow syntax/configuration failure;
- trigger/event-context mismatch;
- token/permission failure;
- missing/mis-scoped secret or variable;
- runtime/toolchain/version drift;
- runner/image failure;
- cache/artifact corruption or staleness;
- concurrency cancellation/race;
- flaky/non-deterministic test;
- external API/service failure;
- quota/rate-limit failure;
- CI-provider outage/infrastructure failure;
- deployment-provider failure surfaced through CI;
- database/service dependency failure;
- required-check/ruleset wiring error.

Root cause MUST be separated from unrelated hardening findings.

### 15.2 CI providers

GitHub Actions is first-class. The adapter architecture MUST support GitLab CI, CircleCI, Buildkite, Jenkins, Azure Pipelines, Bitbucket Pipelines, and other providers without changing the core failure vocabulary.

### 15.3 GitHub Actions audit

Inspect where observable:

- triggers/events;
- event context assumptions;
- permissions;
- action references/pinning;
- reusable workflows;
- matrices;
- runner selection;
- Node/Python/runtime versions;
- caches;
- artifacts;
- environments;
- secrets/variables;
- OIDC;
- concurrency;
- timeouts/retries;
- required-check naming/wiring;
- deployment relationships;
- job/step logs.

---

## 16. Deployment and infrastructure model

Deployment is a separate state machine from Git and CI.

```text
change
 -> local verification
 -> PR
 -> independent review
 -> CI
 -> database/migration readiness
 -> merge eligibility
 -> merge
 -> deployment readiness
 -> deploy
 -> deployment verification
 -> database verification
 -> production observation
 -> complete / rollback / forward-fix
```

The deployment auditor MUST check, when relevant and observable:

- provider/account/team/project identity;
- target environment;
- source revision;
- build/runtime compatibility;
- environment-variable/secret scope without exposing values;
- migrations/stateful changes;
- DNS/domains/routing/certificates;
- preview/staging/production distinction;
- deployment concurrency;
- build logs;
- runtime logs/errors;
- health checks/smoke tests;
- rollback mechanism;
- last-known-good revision;
- database compatibility of rollback.

---

## 17. Hosting/infrastructure adapters

### 17.1 Vercel

Support project/deployment discovery, preview vs production, source revision where available, build logs, runtime logs/errors, deployment URLs, environment boundaries, domains, redeploy/rollback evidence, and authorized deploy actions.

Prefer a connected Vercel tool when available.

### 17.2 Cloudflare

Support Cloudflare Workers/Pages and relevant Developer Platform resources, including detection/audit of:

- Wrangler configuration/environments;
- deployed versions/deployments;
- routes/custom domains;
- bindings;
- D1;
- KV;
- R2;
- Queues;
- Durable Objects;
- Durable Object migrations/lifecycle changes;
- runtime/build evidence;
- staged/gradual deployment where observable;
- rollback/resource compatibility.

Rollback MUST include bound-resource/data compatibility checks when relevant.

### 17.3 Hostinger

Treat product surfaces separately.

**Horizons:** use only for capabilities exposed by the Horizons integration.

**VPS:** use provider API/CLI/MCP/SDK/Terraform/Ansible when configured; use SSH for machine-local facts when appropriate.

VPS audits may include:

- server identity;
- OS/runtime versions;
- process/service state;
- systemd/PM2/Docker/Compose state;
- open/listening service expectations;
- disk/memory/CPU pressure where available;
- deployed revision;
- environment/config presence without secret disclosure;
- reverse proxy/TLS configuration;
- health endpoint;
- logs;
- backup/snapshot/rollback path.

### 17.4 Additional first-class provider families

The adapter contract MUST accommodate:

- Netlify;
- Railway;
- Render;
- Fly.io;
- AWS;
- Google Cloud;
- Azure;
- Docker/Compose;
- Kubernetes;
- generic VPS/bare-metal/SSH deployments.

Provider-specific semantics belong in adapters/reference packs, not the core policy vocabulary.

---

## 18. Database and stateful-system safety layer

Database/stateful changes are a first-class gate, separate from deployment.

GitSkillPro MUST determine:

1. which stateful systems exist;
2. which environments they target;
3. how schema/data changes are defined;
4. whether pending migrations exist;
5. whether migration order is compatible with application rollout;
6. whether destructive operations are present;
7. whether locks/table rewrites/backfills may affect availability;
8. whether a proven recovery path exists;
9. whether code rollback remains compatible after migration;
10. whether post-migration health is proven.

### 18.1 Database risk classes

- read-only query/metadata inspection;
- additive backward-compatible schema change;
- index change;
- constraint change;
- data backfill;
- data transformation;
- destructive DDL;
- destructive DML;
- permission/RLS change;
- replication/topology change;
- restore/failover;
- branch/clone/reset operation.

### 18.2 Database providers/families

Initial provider references/adapters MUST account for:

- PostgreSQL;
- Supabase;
- Neon;
- MySQL/MariaDB;
- PlanetScale/Vitess-style systems;
- SQLite;
- libSQL/Turso;
- Cloudflare D1;
- MongoDB Atlas;
- Redis;
- Upstash;
- Convex;
- Firebase/Firestore;
- DynamoDB.

The architecture MUST allow additional databases without rewriting core policy.

### 18.3 Migration framework detection

Detect where present:

- Prisma;
- Drizzle;
- Supabase migrations;
- Alembic;
- Django migrations;
- Rails Active Record migrations;
- Knex;
- TypeORM;
- Sequelize;
- Flyway;
- Liquibase;
- EF Core;
- Atlas;
- Wrangler/D1 migrations;
- raw SQL migrations;
- custom migration runners.

GitSkillPro MUST distinguish migration generation, migration application, seeding, reset, backfill, and production promotion.

### 18.4 Database preflight

For R3 database changes, require relevant evidence for:

- target environment identity;
- current migration/schema version;
- pending migration set/order;
- backup/PITR/restore capability where supported;
- recovery time implications;
- destructive statements;
- lock/table-rewrite risk;
- large-table/backfill risk;
- connection/pool constraints;
- replication/read-replica implications;
- RLS/permission effects;
- code/schema backward compatibility;
- deploy-before-migrate vs migrate-before-deploy ordering.

A Git revert MUST NOT be presented as a database rollback.

---

## 19. Rollback and recovery model

Recovery is layer-specific.

### Git recovery

Use reflog, revert, backup refs/branches, patches, or other suitable primitives depending on what was changed.

### CI recovery

Fix/rerun only after identifying whether the cause is deterministic, flaky, configuration-related, external, or platform-related.

### Deployment recovery

Use provider-specific rollback/redeploy semantics and verify the resulting running revision.

### Database recovery

Use migration reversal only when intentionally supported and safe; otherwise use forward-fix, restore/PITR, branch/clone cutover, or provider-specific recovery.

A rollback plan MUST describe cross-layer compatibility. Restoring old application code while leaving a new incompatible schema is not a successful rollback.

---

## 20. Configuration

GitSkillPro SHOULD support repository-local configuration, for example `.gitskillpro.yml`, while working safely with no config.

Configurable areas may include:

- default risk policy;
- protected branches;
- task branch naming;
- worktree root;
- required local verification commands;
- CI providers;
- deploy providers/environments;
- database providers/environments;
- production mutation policy;
- required independent review tiers;
- allowed merge methods;
- adapter preferences;
- evidence output location.

Configuration MUST NOT contain raw secrets.

Repository-native instructions such as `AGENTS.md`, `CLAUDE.md`, or equivalent MUST be discovered and treated as repository policy subject to host/user authority.

---

## 21. CLI surface

Initial commands:

```text
gsp doctor
gsp inspect
gsp capabilities
gsp audit git
gsp audit ci
gsp audit pr
gsp audit deploy
gsp audit db
gsp plan <intent>
gsp delegate
gsp evidence
gsp recover
```

### 21.1 Mutation posture

Read/audit/plan commands are default.

Mutation commands MUST pass policy and expected-state checks. High-risk mutations MUST require explicit authority supplied by the invoking host/user policy.

---

## 22. MCP surface

Initial MCP tools SHOULD include:

- `runtime.inspect`;
- `capabilities.inspect`;
- `repo.inspect`;
- `git.audit`;
- `git.plan_operation`;
- `ci.audit`;
- `pr.audit`;
- `deployment.audit`;
- `database.audit`;
- `delegation.plan`;
- `evidence.validate`;
- `recovery.plan`.

The MCP server MUST NOT expose unrestricted arbitrary shell execution as its default model.

Mutation tools may be added only with explicit safety metadata and authorization semantics.

---

## 23. Agent Skill surface

`skills/git-skill-pro/SKILL.md` is the judgment layer.

The Skill MUST instruct the agent to:

1. discover environment/capabilities;
2. read repository-native instructions;
3. inspect state before mutation;
4. classify risk;
5. select a primitive by intent and current state;
6. assume concurrency;
7. isolate delegated work;
8. distinguish CI vs code vs deployment vs database failures;
9. use native provider connectors when appropriate;
10. demand evidence before merge/deploy/database claims;
11. preserve recovery paths;
12. never overclaim persistence or observability.

Large primitive/provider references SHOULD live in load-on-demand reference files rather than bloating the core Skill.

---

## 24. Plugin packaging

The plugin distribution MUST package:

- the GitSkillPro Agent Skill;
- the GitSkillPro MCP server/tool surface;
- plugin discovery/installation metadata required by the target host;
- no duplicate GitHub/Vercel/Cloudflare/database credentials when the host already exposes an authorized connector with the needed capability.

The plugin MUST remain functional in reduced mode when only the Skill is available.

---

## 25. Evidence contract

Every material operation produces or updates an evidence packet containing at least:

- operation ID;
- timestamp;
- environment classification;
- capabilities/adapters used;
- repository identity;
- branch/worktree identity where applicable;
- starting refs/SHAs;
- target refs/SHAs;
- concurrency assumptions and revalidation result;
- intent;
- risk tier;
- preconditions;
- planned primitive/operation;
- actual action performed;
- result;
- local verification evidence;
- CI evidence;
- review evidence;
- deployment evidence;
- database evidence;
- recovery instructions;
- unresolved unknowns;
- persistence proof/reference where applicable;
- final status/recommendation.

Evidence fields may be absent when not applicable, but MUST NOT be fabricated.

---

## 26. Security requirements

GitSkillPro MUST:

- use least privilege;
- avoid logging secret values;
- treat secret presence/metadata separately from secret contents;
- never print credentials into evidence packets;
- avoid arbitrary untrusted workflow/script execution during read-only audits unless explicitly authorized;
- distinguish repository instructions from untrusted content inside source data/logs/issues;
- prevent provider adapters from silently broadening scope;
- require stronger authorization for production, security, ownership, DNS, billing, and destructive database actions;
- support read-only mode.

---

## 27. Proposed repository structure

```text
/
  README.md
  SPEC.md
  AGENTS.md
  LICENSE
  package.json
  tsconfig.json
  .gitskillpro.example.yml
  docs/
    architecture.md
    safety-model.md
    evidence.md
    adapters.md
    primitives.md
    providers/
      github.md
      gitlab.md
      vercel.md
      cloudflare.md
      hostinger.md
      generic-vps.md
      kubernetes.md
    databases/
      postgres.md
      supabase.md
      mysql.md
      sqlite-libsql-turso.md
      d1.md
      mongodb.md
      redis.md
      convex.md
  skills/
    git-skill-pro/
      SKILL.md
      README.md
      references/
        git-primitives.md
        concurrency.md
        delegation.md
        pr-review.md
        ci.md
        deployment.md
        databases.md
        recovery.md
  src/
    core/
      capability.ts
      environment.ts
      risk.ts
      policy.ts
      operation.ts
      evidence.ts
      config.ts
    registry/
      git-primitives.ts
      provider-capabilities.ts
    adapters/
      local-git.ts
      github.ts
      gitlab.ts
      vercel.ts
      cloudflare.ts
      hostinger.ts
      generic-vps.ts
      database.ts
    audits/
      git.ts
      ci.ts
      pr.ts
      deployment.ts
      database.ts
    delegation/
      worktree.ts
      remote-branch.ts
    recovery/
      planner.ts
    cli/
      index.ts
    mcp/
      server.ts
  schemas/
    capability.schema.json
    evidence.schema.json
    delegation.schema.json
    audit.schema.json
  tests/
    environment.test.ts
    capability.test.ts
    policy.test.ts
    primitive-registry.test.ts
    git-audit.test.ts
    concurrency.test.ts
    delegation.test.ts
    ci-audit.test.ts
    pr-audit.test.ts
    deployment-audit.test.ts
    database-audit.test.ts
    evidence.test.ts
    skill-contract.test.ts
```

---

## 28. Testing requirements

Development MUST be test-first for behavior-changing implementation.

Tests MUST prove at minimum:

- environment detection does not overclaim;
- plugin-only environments do not claim local Git state;
- provider adapters cannot claim facts outside their boundary;
- unknown Git commands default safely;
- dirty/unexplained work is never silently discarded;
- worktree delegation is preferred when supported;
- remote delegation is used when worktrees are unavailable;
- stale expected SHAs block unsafe integration;
- plain force push is denied by default;
- destructive local operations require stronger preconditions;
- CI audits distinguish code failure from workflow/provider failure;
- hardening findings do not become false root causes;
- autonomous PR audit rejects missing/stale evidence;
- independent review is enforced by risk tier;
- green CI cannot satisfy deployment health;
- green deployment cannot satisfy database health;
- Git rollback is not represented as database rollback;
- deployment rollback checks data/resource compatibility;
- migration framework detection identifies supported patterns;
- evidence packets never claim persistence without adapter proof;
- host-native connector preference works without blocking local-only facts.

Credentialed integration tests MUST be opt-in and MUST default to non-production/read-only targets.

---

## 29. Version 0.1 implementation scope

Version 0.1 MUST deliver a working vertical slice rather than shallow implementations of every provider.

### Required in 0.1

- shared TypeScript core;
- environment/capability discovery;
- risk/policy model;
- evidence model and schemas;
- version-aware Git primitive baseline/registry;
- local Git adapter;
- GitHub adapter/native connector contract;
- CI audit with GitHub Actions first-class support;
- local worktree delegation planner/executor where authorized;
- remote branch/PR delegation planner;
- autonomous PR audit;
- deployment abstraction;
- Vercel adapter/native connector contract;
- Cloudflare adapter contract/reference pack;
- Hostinger VPS/Horizons distinction and adapter contract;
- database abstraction and migration-risk auditor;
- PostgreSQL/Supabase, SQLite/libSQL/Turso, D1, MongoDB, Redis/Upstash, and Convex reference packs/contracts;
- Agent Skill;
- CLI read/audit/plan surface;
- MCP read/audit/plan surface;
- plugin packaging metadata;
- regression/behavioral tests.

### Allowed to remain adapter-interface/reference-pack only in 0.1

- GitLab/Bitbucket/Azure Repos mutations;
- Netlify/Railway/Render/Fly mutations;
- AWS/GCP/Azure cloud resource mutations;
- Kubernetes mutations;
- MySQL/PlanetScale production mutation tooling;
- Firestore/DynamoDB production mutation tooling.

The architecture MUST make these additions possible without changing core risk/evidence semantics.

---

## 30. Acceptance criteria

GitSkillPro 0.1 is acceptable only when all of the following are true:

1. an agent can determine what environment/capabilities it actually has;
2. it can inspect a local Git repo without modifying it;
3. it can explain and safely plan common Git operations based on actual repo state;
4. it can create an isolated worktree delegation when authorized and supported;
5. it can fall back to remote branch/PR delegation when local worktrees are unavailable;
6. it detects concurrent ref movement and refuses stale integration;
7. it can audit a failing GitHub Actions run without assuming the code is at fault;
8. it can audit an autonomous PR for evidence completeness and merge risk;
9. it treats CI, merge, deployment, database, and production health as separate gates;
10. it can detect deployment/database systems from repo/environment evidence without exposing secrets;
11. provider adapters honestly report unsupported capabilities;
12. evidence packets distinguish observation, plan, attempted mutation, and proven persistence;
13. the same core behavior is reachable through Skill, CLI, and MCP surfaces;
14. tests enforce the safety boundaries above.

---

## 31. Canonical design rule

When this specification conflicts with older design notes under `docs/superpowers/specs/`, **this root `SPEC.md` is canonical** unless a later explicitly versioned specification supersedes it.

The implementation plan MUST derive from this file.
