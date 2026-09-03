# GitSkillPro

GitSkillPro is a universal software-workflow and repository-operations system for coding agents. It combines an Agent Skill, shared policy/decision engine, CLI, MCP server, plugin packaging, and capability-aware adapters for project/work-graph management, Git/GitHub, CI, hosting/deployment, infrastructure, database safety, repository automation, and context/token efficiency.

The system is designed to work across local clones, linked worktrees, VPS/VM hosts, containers, CI runners, cloud coding agents, sandboxes, and plugin/connector-only environments without pretending capabilities exist when they do not.

## Canonical specification

The current canonical design is cumulative:

- [`SPEC.md`](./SPEC.md) — core Git/repository/CI/deployment/database operating contract.
- [`SPEC-v0.2.md`](./SPEC-v0.2.md) — workflow orchestration, Linear/issues/projects, agent comments/reviews, greenfield bootstrap, issue-to-PR flow, and repository governance.
- [`SPEC-v0.3.md`](./SPEC-v0.3.md) — Beads/work-graph integration plus project takeover/recovery for broken CI, failed/stale/superseded PRs, tangled branches, conflicting tracker state, and selective salvage.
- [`SPEC-v0.4.md`](./SPEC-v0.4.md) — Context7 integration and the Context Economy Engine: progressive retrieval, context packets, caching, compaction, token/model budgets, prompt-cache awareness, and measurable cost reduction without weakening safety.
- [`SPEC-v0.5.md`](./SPEC-v0.5.md) — auto-commit/repository automation actors, hooks/watchers/bots, separate auto-stage/commit/push/PR/merge/deploy authority, concurrency, idempotency, and loop prevention.
- [`SPEC-v0.6.md`](./SPEC-v0.6.md) — frontier capabilities: change graphs, native stacked PRs, merge groups, semantic conflicts, Jujutsu/alternative VCS adapters, current MCP/A2A agent protocols, reproducible environments, DAG/affected CI, policy-as-code, supply-chain attestations, deterministic codemods, progressive delivery, preview database stacks, release intent, telemetry, and proof-carrying change manifests.

The newest specification wins where requirements conflict. Older design notes under `docs/superpowers/specs/` are supporting design history.

## End-to-end operating model

```text
PROJECT / INITIATIVE
  -> ISSUE / EXECUTION GRAPH
  -> READY CHECK
  -> CLAIM / DELEGATE
  -> CONTEXT PLAN + MINIMUM SUFFICIENT PACKET
  -> CHANGE / STACK PLAN
  -> BRANCH + WORKTREE OR PROVIDER-NATIVE ISOLATION
  -> IMPLEMENT / DETERMINISTIC TRANSFORM + LOCAL VERIFY
  -> PR / CHANGE STACK
  -> INDEPENDENT AGENT REVIEW
  -> CI / AFFECTED GRAPH / POLICY / SECURITY CHECKS
  -> MERGE GROUP / MERGE QUEUE WHEN USED
  -> MERGE
  -> BUILD + PROVENANCE / SBOM WHEN REQUIRED
  -> DATABASE / DEPLOYMENT
  -> DEPLOYMENT VERIFY
  -> RELEASE / FLAG / PROGRESSIVE EXPOSURE WHEN USED
  -> PRODUCTION VERIFY
  -> ISSUE COMPLETE
  -> PROJECT / MILESTONE UPDATE
```

Each layer keeps its own truth. A project may use Linear as the human/product tracker, Beads as the dependency-aware agent execution graph, GitHub as the code/review/merge system, Context7 for version-specific external library documentation, provider-native stacks/merge queues for integration, and deployment/database adapters for runtime evidence. GitSkillPro resolves explicit authority and freshness rather than dumping all sources into every model call.

## Operating modes

GitSkillPro supports four distinct modes:

- **Normal mode** — execute healthy issue-to-production workflows.
- **Greenfield bootstrap mode** — establish tracker, repo, reproducible dev environment, CI, PR/stack, review, rules, deployment, database, supply-chain, and context-economy flow for a new project.
- **Takeover / recovery mode** — reconstruct and repair inherited messy projects before broad mutation.
- **Incident mode** — prioritize service restoration and evidence preservation under incident policy.

Recovery mode inventories and links issues/beads, branches/changes, commits, PRs/stacks, reviews, CI/merge groups, merges, deployments, releases, and migrations; distinguishes default-branch CI breakage from PR-specific failures; identifies duplicates and supersession; salvages only proven useful work; reconciles tracker state; restores governance; and proves recovery with one clean end-to-end issue.

## Work-management and change surface

Linear is first-class for project/issue management. Beads (`bd`) is first-class as a dependency-aware work-graph/execution adapter. GitHub Issues/Projects are a first-class fallback or companion. Other trackers fit the same capability contracts.

GitSkillPro also models a logical **Change Graph** above physical commit SHAs so rebases, stacked PRs, Jujutsu-style stable change IDs, supersession, salvage, and multiple physical versions of the same intended change can be reasoned about without losing Git object identity.

## Context and token economy

Context7 is first-class for current, version-specific external library/framework/API documentation. GitSkillPro uses focused queries, exact library IDs when known, version evidence from the repo, response caching, and privacy-safe query formulation.

The broader Context Economy Engine follows one rule: **minimum sufficient context for a correct, evidence-backed decision**. It uses progressive disclosure, content-addressed caches, diff/delta retrieval, bounded subagent packets, structured checkpoints, lean load-on-demand instructions, risk-aware model routing, provider prompt/context caching, and explicit token/cost metrics.

Context savings never override safety, current-state evidence, acceptance criteria, recovery requirements, or high-risk review.

## Frontier capabilities

GitSkillPro uses maturity tiers rather than forcing new technology into every repository. Frontier capabilities include GitHub native stacked PRs and merge queues, Jujutsu/alternative workspace adapters, stateless MCP with durable tasks, A2A remote-agent tasks/artifacts, Dev Containers/Nix/Dagger/Bazel-style reproducible execution, affected-task graphs and remote cache, OPA-style policy-as-code, GitHub/SLSA/Sigstore provenance, SPDX/CycloneDX SBOM evidence, deterministic semantic refactoring engines, feature-flag/progressive delivery, preview application/database stacks, expand-contract database changes, software catalogs/golden paths, OpenTelemetry delivery traces, and proof-carrying Change Manifests.

## Provider surface

GitSkillPro's provider layer is intentionally broader than Vercel. The design includes Vercel, Cloudflare, Hostinger VPS, generic VPS/SSH, Docker/Compose, Kubernetes, Netlify, Railway, Render, Fly.io, and extensible AWS/GCP/Azure adapters.

Database safety is a separate first-class gate. Planned database/provider knowledge includes PostgreSQL, Supabase, Neon, MySQL/MariaDB, PlanetScale/Vitess, SQLite/libSQL, Turso, Cloudflare D1, MongoDB Atlas, Redis/Upstash, Convex, Firebase/Firestore, and DynamoDB, plus migration-framework detection for Prisma, Drizzle, Supabase CLI, Alembic, Django, Rails, Knex, TypeORM, Sequelize, Flyway, Liquibase, EF Core, Atlas, D1/Wrangler, raw SQL, and custom runners.

## Core operation lifecycle

```text
DISCOVER -> SNAPSHOT -> CLASSIFY RISK -> PLAN -> CHECK AUTHORITY
         -> PLAN CONTEXT -> REVALIDATE CONCURRENCY -> EXECUTE -> VERIFY
         -> EMIT EVIDENCE / CHANGE MANIFEST -> CHECKPOINT/CACHE
         -> COMPLETE / RECOVER / ESCALATE
```
