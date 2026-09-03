# GitSkillPro Providers + Database Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add provider-aware read/audit/plan capabilities for GitHub remote state, CI/PR evidence, deployment platforms, and database/migration safety while preserving strict truth boundaries and avoiding provider mutations.

**Architecture:** The core package normalizes provider evidence supplied by host-native connectors, official APIs/CLIs, or JSON snapshots into provider-neutral contracts. Provider-specific modules describe what they can observe; audits operate on normalized evidence. No provider credential management or production mutation is embedded in this layer.

**Tech Stack:** Node.js 22+, TypeScript 5.x, Vitest, Node standard library, existing GitSkillPro core/workflow/recovery modules.

**Spec:** `SPEC.md` provider/database requirements, provider extension design notes, and cumulative safety rules through `SPEC-v0.6.md`.

## Global Constraints

- Base is verified recovery SHA `40f4e52a9befc160d1ab514c6b3c8102729f496f`.
- GitHub/Vercel/Cloudflare/Supabase/other host-native connectors SHOULD be preferred by hosts when available; this npm layer consumes normalized payloads and MUST NOT require duplicate credentials.
- Provider absence or unsupported capabilities remain explicit, never simulated.
- Green CI, merge safety, deployment health, database health and production health remain separate evidence domains.
- Secrets may be represented only as names/scope/presence metadata, never raw values.
- Hostinger Horizons and Hostinger VPS are distinct provider surfaces.
- Database migration analysis is conservative. Unknown SQL/custom migrations remain unknown/high-review, not automatically safe.
- Provider/database writes remain out of scope in this layer.

---

## Target files

```text
src/providers/
  types.ts
  detect.ts
src/adapters/
  github.ts
  vercel.ts
  cloudflare.ts
  hostinger.ts
  database.ts
src/audits/
  ci.ts
  pr.ts
  deployment.ts
  database.ts
src/database/
  detect.ts
  sql-risk.ts
  migration.ts
skills/git-skill-pro/references/
  ci.md
  deployment.md
  databases.md
tests/
  provider-detect.test.ts
  github-remote.test.ts
  ci-audit.test.ts
  pr-audit.test.ts
  deployment-audit.test.ts
  database-detect.test.ts
  sql-risk.test.ts
  database-audit.test.ts
  provider-acceptance.test.ts
  fixtures/providers/*.json
```

---

### Task 1: Provider/deployment/database contracts

**Files:** `src/providers/types.ts`, `src/adapters/database.ts`, `tests/provider-detect.test.ts`.

- [ ] Write failing tests proving deployment, CI and database observations have separate evidence status and cannot satisfy one another.
- [ ] Define `ProviderKind`, `ProviderCapability`, `EvidenceStatus`, `DeploymentSnapshot`, `CiSnapshot`, `DatabaseSnapshot`, `SecretMetadata`, `ProviderObservation`.
- [ ] `EvidenceStatus` includes `proven | partial | unknown | unavailable`; no convenience boolean that turns unknown into false.
- [ ] Verify focused tests + typecheck.

### Task 2: Repository provider detection

**Files:** `src/providers/detect.ts`, `tests/provider-detect.test.ts`.

- [ ] Write failing tests for Vercel (`vercel.json`, `.vercel/project.json`), Cloudflare (`wrangler.toml/jsonc`), Netlify, Fly, Railway, Render, Docker/Compose, Kubernetes and unknown.
- [ ] Implement evidence-based detection from file names/config markers only. Detection means "repository contains provider configuration", not "account/project access is proven".
- [ ] Hostinger MUST remain unknown unless explicit project metadata/config says Horizons or VPS; do not infer Hostinger from a generic domain/server.
- [ ] Verify green.

### Task 3: GitHub remote normalization

**Files:** `src/adapters/github.ts`, `tests/github-remote.test.ts`.

- [ ] Write failing tests normalizing repository metadata, PR head/base, changed files, checks, reviews, unresolved threads and workflow runs supplied by a host connector.
- [ ] Implement pure normalization types/functions. Missing fields remain unknown/undefined.
- [ ] Distinguish PR conversation comments from submitted code reviews and unresolved inline review threads.
- [ ] No GitHub token/API client in this package layer.

### Task 4: CI causality audit

**Files:** `src/audits/ci.ts`, `tests/ci-audit.test.ts`.

- [ ] Write failing tests for source/test/type/dependency/workflow/permission/secret/runtime/runner/cache/concurrency/external/quota/deployment/database/required-check failures plus unknown.
- [ ] Implement deterministic classification over structured failed-step metadata + bounded log excerpts. Rules may recognize stable patterns, but ambiguous evidence returns `unknown`.
- [ ] Audit output separates root-cause candidates from hardening findings.
- [ ] Add rule detecting required-check name that no current workflow emits when supplied repository-rule/check evidence.

### Task 5: Autonomous PR audit

**Files:** `src/audits/pr.ts`, `tests/pr-audit.test.ts`.

- [ ] Write failing tests rejecting stale head SHA, missing required checks, unresolved review threads, missing R3 independent review, and green CI with unresolved deployment/database implications.
- [ ] Implement `auditPullRequest` using current head/base, check freshness/status, review evidence, rules, risk, deploy/db implications, rollback/forward-fix plan.
- [ ] Green CI alone cannot make R3 merge-ready.
- [ ] No merge action in this layer.

### Task 6: Deployment normalization + provider adapters

**Files:** `src/adapters/vercel.ts`, `src/adapters/cloudflare.ts`, `src/adapters/hostinger.ts`, `tests/deployment-audit.test.ts`.

- [ ] Add failing normalization tests for Vercel deployment/build/runtime evidence, Cloudflare Worker/Pages/binding/resource evidence, and Hostinger product-surface separation.
- [ ] Vercel: source revision, environment, build/runtime status/log references, URL, domains when supplied.
- [ ] Cloudflare: Worker/Pages identity, revision/version, routes/domains, bindings/resource kinds (D1/KV/R2/Queues/Durable Objects), rollout status and rollback-compatibility unknowns.
- [ ] Hostinger: explicit `horizons | vps`; VPS evidence may include revision/process/service/health/backups when supplied; Horizons cannot pretend to manage VPS facts.

### Task 7: Deployment audit

**Files:** `src/audits/deployment.ts`, `tests/deployment-audit.test.ts`.

- [ ] Write failing tests: green CI + failed deployment => unhealthy; successful provider control-plane response without health proof => partial; source revision mismatch => finding; rollback requiring DB/resource compatibility => blocked/unknown.
- [ ] Implement `auditDeployment` with distinct build/deploy/runtime/rollback evidence.
- [ ] Provider-specific adapters do not change core audit semantics.

### Task 8: Database and migration detection

**Files:** `src/database/detect.ts`, `tests/database-detect.test.ts`.

- [ ] Red tests detect PostgreSQL/Supabase, Prisma, Drizzle, D1/Wrangler, SQLite/libSQL/Turso, MySQL, MongoDB, Redis/Upstash, Convex from explicit repository evidence.
- [ ] Detect migration frameworks separately from database provider/engine.
- [ ] Multiple systems may coexist; return evidence list, not one guessed DB.

### Task 9: SQL/migration risk classification

**Files:** `src/database/sql-risk.ts`, `src/database/migration.ts`, `tests/sql-risk.test.ts`.

- [ ] Red tests classify read-only, additive schema, index, constraint, backfill/data transform, destructive DDL, destructive DML, permission/RLS, unknown/custom.
- [ ] Detect high-risk patterns including DROP TABLE/COLUMN, TRUNCATE, unqualified DELETE/UPDATE when clearly parseable, ALTER TYPE/column transformations conservatively.
- [ ] Additive patterns such as CREATE TABLE / ADD COLUMN are not automatically "safe"; they are lower-risk candidates with lock/compatibility unknowns retained.
- [ ] Migration plan checks ordering `expand -> deploy-compatible code -> backfill -> contract` where applicable and flags rollback incompatibility.

### Task 10: Database audit

**Files:** `src/audits/database.ts`, `tests/database-audit.test.ts`.

- [ ] Red tests require target environment, current migration version, pending set/order, recovery capability when relevant, destructive/lock/backfill risk, RLS/permission impact and code/schema rollback compatibility.
- [ ] Implement `auditDatabase`; Git revert never appears as DB rollback.
- [ ] Provider-specific restore semantics remain metadata: in-place restore vs new DB/cutover vs unknown.

### Task 11: CLI + Skill provider surface

**Files:** `src/cli/index.ts`, `skills/git-skill-pro/references/ci.md`, `deployment.md`, `databases.md`, `SKILL.md`, CLI/skill tests.

- [ ] Add red CLI tests for `gsp detect providers`, `gsp audit ci <snapshot.json>`, `gsp audit pr <snapshot.json>`, `gsp audit deploy <snapshot.json>`, `gsp audit db <snapshot.json>`.
- [ ] Implement JSON snapshot read/audit only; no provider writes.
- [ ] Add load-on-demand references documenting CI causality, provider truth boundaries and database migration/rollback safety.

### Task 12: Public acceptance + CI

**Files:** `src/index.ts`, `tests/provider-acceptance.test.ts`, `README.md`, `.github/workflows/ci.yml`.

- [ ] Red package-root acceptance combining provider detection → CI audit → PR audit → deployment audit → DB audit.
- [ ] Export modules; update README.
- [ ] Add all provider/db CLI smoke commands to CI and retain tracked-state cleanliness.
- [ ] Full verification: npm ci, typecheck, tests, build, pack, all old/new CLI commands.

---

## Acceptance criteria

This layer is acceptable when GitSkillPro can truthfully detect repository provider signals, consume host-native GitHub/deployment/database evidence, classify CI failure causes conservatively, audit autonomous PR readiness, prove deployment health separately from CI, identify database/migration systems and SQL risk, enforce database rollback compatibility, and expose all of it as read/audit/plan APIs without storing provider credentials or performing provider mutations.
