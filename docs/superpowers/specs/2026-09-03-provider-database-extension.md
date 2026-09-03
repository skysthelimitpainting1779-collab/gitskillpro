# GitSkillPro Provider, Infrastructure, and Database Extension

> **Normative extension to:** `docs/superpowers/specs/2026-09-03-gitskillpro-design.md`

## Status

Approved scope expansion: GitSkillPro must be provider-agnostic beyond Vercel and must treat database/stateful changes as a first-class safety domain. This extension is part of the implementation requirements for GitSkillPro.

## 1. Expanded product boundary

GitSkillPro must reason across six distinct operational layers:

1. local Git/repository state;
2. GitHub/remote collaboration state;
3. CI/build/test state;
4. hosting/deployment/infrastructure state;
5. database/stateful-system state;
6. production runtime/health state.

Evidence from one layer never automatically proves another layer is healthy. In particular:

- green CI does not prove deployment health;
- a successful deployment does not prove database migration safety;
- a successful migration does not prove the new application revision is compatible with the resulting schema;
- a Git rollback does not roll back data;
- a database restore does not roll back code;
- a provider control-plane success response does not prove application health.

## 2. Provider adapter model

All providers implement capability-scoped adapters behind the same core policy engine. Adapters expose observations and authorized operations; they do not define policy.

The capability broker prefers, when semantically appropriate:

1. an already-authorized host-native plugin/connector;
2. a GitSkillPro MCP provider adapter;
3. an official provider CLI in a persistent shell;
4. an official provider API/SDK;
5. authorized SSH/container/orchestrator inspection for machine-local state;
6. explicit read-only diagnosis or inability when no safe evidence source exists.

A provider adapter must never claim evidence outside its observable boundary.

## 3. Hosting and infrastructure provider families

### 3.1 Vercel

Audit projects, preview/production deployments, source revision, build logs, runtime errors/logs, environment boundaries, domains, health evidence, and rollback/redeploy evidence when available. Prefer an already-connected Vercel tool over duplicate credentials.

### 3.2 Cloudflare

Support Workers and Pages plus related Developer Platform resources. Detect and audit:

- Wrangler configuration and environments;
- deployed Worker versions/deployments;
- Pages/Workers target identity;
- routes and custom domains;
- bindings;
- D1 databases;
- KV namespaces;
- R2 buckets;
- Queues;
- Durable Objects and migrations/lifecycle changes;
- runtime/build evidence;
- staged/gradual deployment state where observable;
- rollback compatibility.

Cloudflare rollback must not be treated as universally safe. Rolling back Worker code can be incompatible with bindings/resources or data structures that changed after the older version was deployed. Provider-resource compatibility is a required rollback preflight.

D1 state belongs to both the Cloudflare adapter and the database safety layer.

### 3.3 Hostinger

GitSkillPro must distinguish Hostinger product surfaces rather than treating "Hostinger" as one adapter.

**Hostinger Horizons/native host connector:** use when a host exposes Horizons-specific site/app operations.

**Hostinger VPS:** prefer the official Hostinger VPS API, CLI, SDK, Terraform/Ansible integration, or Hostinger MCP when configured. Fall back to SSH only for machine-local facts that structured provider interfaces cannot observe.

VPS audit capabilities include, where available:

- VPS/account/server identity;
- power and lifecycle state;
- CPU/RAM/disk/network metrics;
- public/private networking;
- firewall/DNS metadata where exposed;
- snapshots/backups/recovery evidence;
- OS/runtime identity;
- deployed revision mapping;
- Docker/Compose/service state;
- reverse proxy/TLS/domain state;
- logs and health checks;
- disk-pressure/resource-exhaustion risk;
- rollback/recovery procedure.

A Git checkout on a VPS must never be assumed to equal the running application revision.

### 3.4 Netlify

Audit deploy previews, production deploys, build logs, functions/edge functions, environment contexts, domains, source revision, redirects/headers configuration, and rollback evidence.

### 3.5 Railway

Audit project/service/environment identity, deployments, variables, build/runtime logs, service dependencies, volumes, networking, and attached databases.

### 3.6 Render

Audit services/environments, deploys, logs, health checks, workers/cron, environment configuration metadata, persistent disks, and managed database relationships.

### 3.7 Fly.io

Audit apps, Machines, regions, releases, image identity, volumes, secrets metadata, checks, networking, and rollback/release state.

### 3.8 AWS

Detect relevant services rather than assuming one AWS deployment model. Support adapter modules for EC2, ECS/Fargate, EKS, Lambda, Amplify and related deployment paths where detected. Always verify account, role, region, target resource, image/revision, logs, and database relationships before mutation.

### 3.9 Google Cloud

Support Cloud Run, GKE, Compute Engine, Functions and other detected paths through a shared GCP adapter contract. Verify project, identity, region/zone, revision/image, IAM boundary, logs, and managed database dependencies.

### 3.10 Azure

Support App Service, Container Apps, AKS, Functions, VMs and detected Azure deployment paths. Verify tenant/subscription, resource group, target resource, managed identity, revision/image, logs, and database dependencies.

### 3.11 Generic VPS/SSH

When no structured provider adapter exists, inspect an authorized VPS through a constrained SSH/system adapter. Collect machine identity, running services, process manager, Docker/Compose state, deployed SHA/image digest, reverse proxy, TLS, disk/memory, ports, logs, backup evidence and rollback path. Do not grant arbitrary shell execution through the public MCP surface by default.

### 3.12 Docker and Docker Compose

Audit image tags and immutable digests, build context, running container identity, health checks, env files/secrets metadata, volumes, networks, restart policy, migration jobs/containers, and last-known-good image.

### 3.13 Kubernetes

Audit cluster/context/namespace identity, manifests/Helm/Kustomize source, image digests, Deployments/StatefulSets/Jobs, rollout state, probes, migration jobs, Secrets/ConfigMaps metadata, PVC/stateful dependencies, rollback history, and GitOps controller relationships.

## 4. Infrastructure safety rules

Infrastructure operations have the same evidence discipline as Git operations, but with stronger defaults for destructive actions.

Before infrastructure mutation, prove:

- provider/account/project/subscription identity;
- region/zone/cluster/namespace when applicable;
- target environment;
- currently running revision/image;
- current health;
- stateful dependencies;
- recovery/rollback mechanism;
- concurrency/another-agent risk;
- credential scope;
- expected blast radius.

Deletion, replacement, ownership changes, firewall/security changes, credential changes, production DNS changes, destructive volume operations, and irreversible infrastructure mutations are high-impact gates.

## 5. Database/stateful-change layer

Database safety is a separate first-class gate. GitSkillPro detects both:

1. the database engine/provider; and
2. the migration/schema-management framework in the repository.

### 5.1 Universal database preflight

Before a production schema/data mutation, collect when observable:

- exact account/project/cluster/database/branch/environment identity;
- database engine and version;
- current schema and migration baseline;
- drift between source-controlled schema/migrations and target;
- pending migrations and ordering;
- migration framework;
- transactionality of the proposed operation;
- lock/blocking risk;
- destructive DDL/DML;
- affected table/data size and expected backfill cost;
- index creation/drop strategy;
- connection/pooler constraints;
- replication/read replica/branch implications;
- roles/permissions/RLS/security policy changes;
- extensions/functions/triggers/procedures affected;
- backup/snapshot/PITR availability;
- restore-point freshness and retention;
- rollback or forward-fix strategy;
- application backward/forward compatibility during rolling deploys;
- target connection-string/environment verification without exposing secret values;
- post-migration schema/data checks;
- post-deploy query/error/latency checks.

The existence of a backup is not enough. The recovery path must identify what would be restored, how long it can take, whether the restore is in-place or creates a replacement database, what data window can be lost, and what application cutover is required.

## 6. Database/provider modules

### 6.1 PostgreSQL

Understand locks, transactions, transactional DDL limits/caveats, concurrent index creation, roles, extensions, triggers/functions, connection pools, replication, `pg_dump`/restore, and large-table migration patterns.

### 6.2 Supabase

Treat Supabase as Postgres plus provider-specific services. Audit:

- migrations;
- development branches where available;
- schema drift;
- RLS policies;
- roles and permissions;
- direct vs pooled/Supavisor connections;
- Auth/Storage/Realtime coupling;
- backup/PITR readiness;
- Storage-object recovery separately from database backup.

When a connected Supabase tool is available, GitSkillPro may use it to inspect/list/apply migrations or manage branches, but production mutation still passes through GitSkillPro policy and target verification.

### 6.3 Neon

Audit project/branch/compute/database identity, direct/pooled connection mode, schema state, branch ancestry, point-in-time branching/restore capability, and preview-branch workflows. Use branch isolation for migration validation when policy and provider capability allow.

### 6.4 MySQL / MariaDB

Audit DDL locking/online-change implications, replication, backup/restore, charset/collation, indexes, foreign keys, connection behavior, and large-table migration strategy.

### 6.5 PlanetScale / Vitess

Understand database branches/deploy requests where applicable, keyspaces, schema diffs, online schema-change behavior, connection constraints, and provider-specific relational semantics. Never apply generic MySQL migration assumptions without checking provider behavior.

### 6.6 SQLite / libSQL

Audit exact database-file/remote-database identity, journal/WAL mode, locking/concurrency, file backup/restore, embedded/local state, schema migrations, and deployment packaging implications.

### 6.7 Turso

Audit Turso/libSQL database identity, primary/replica or sync architecture, token/connection target, and PITR semantics. A Turso PITR restore creates a new database from the historical point, so recovery includes new credentials/connection cutover and cleanup of the old database rather than assuming in-place rewind.

### 6.8 Cloudflare D1

Audit D1 binding/database identity, Wrangler migration directory/pattern, migration ordering, SQLite semantics, and Time Travel/PITR. A D1 Time Travel restore is destructive and overwrites the database in place; it requires a high-impact recovery gate and explicit bookmark/timestamp evidence.

### 6.9 MongoDB / MongoDB Atlas

Audit project/cluster/database identity, replica/shard topology where relevant, indexes, schema validators, migration/backfill strategy, backup policy, continuous/cloud backup and PITR readiness when configured, and restore target/cutover behavior.

### 6.10 Redis

First determine whether Redis is a disposable cache, coordination system, queue/session store, or durable system of record. Audit persistence mode, replication/failover, eviction policy, TTL semantics, memory pressure, keyspace operations, bulk backfills, and dangerous flush/delete operations.

### 6.11 Upstash Redis

Account for Upstash-specific durability and REST/serverless access patterns. Audit database/region identity, eviction configuration, limits/quotas, replication/durability evidence, and whether the application treats the system as a cache or durable database.

### 6.12 Convex

Audit exact deployment identity (`local`, dev, preview, prod), deploy-key target, saved vs inferred schema, indexes, data migrations/backfills, function/schema compatibility, and preview-deployment relationships. A successful code deploy is not enough if the schema/data transition is incompatible.

### 6.13 Firebase / Firestore

Audit project identity, emulator vs production target, indexes, security rules, batch/write/backfill strategy, functions coupling, and backup/export/recovery evidence where applicable.

### 6.14 DynamoDB

Audit AWS account/region/table identity, capacity mode, GSIs/LSIs, streams, TTL, PITR/backups, table replacement/delete risk, and migration/backfill strategy.

## 7. Migration-framework detection

Repository discovery must detect schema/migration tooling from dependencies, scripts, config files and directory structure. Load framework-specific rules for at least:

- Prisma Migrate;
- Drizzle / drizzle-kit;
- Supabase CLI migrations;
- Alembic / SQLAlchemy;
- Django migrations;
- Rails Active Record migrations;
- Knex;
- TypeORM;
- Sequelize;
- Flyway;
- Liquibase;
- Entity Framework Core;
- Atlas/schema-as-code tools;
- Cloudflare D1/Wrangler migrations;
- raw ordered SQL migration directories;
- custom migration runners referenced from package scripts or CI.

The detector must distinguish:

- schema generation vs schema application;
- local/dev migration state vs production migration state;
- migration files vs seed scripts;
- destructive reset commands vs forward migrations;
- schema-only migrations vs data backfills.

## 8. Database adapter contract

Database adapters expose structured capabilities such as:

- `identify_target`;
- `inspect_engine`;
- `inspect_schema`;
- `inspect_migrations`;
- `compare_schema` / drift detection when supported;
- `inspect_backup_recovery`;
- `inspect_health`;
- `inspect_replication`;
- `create_isolated_branch` when supported;
- `validate_migration_plan`;
- `apply_migration` only under explicit authorization;
- `validate_post_migration`;
- `produce_recovery_evidence`.

Provider tools are execution/evidence capabilities, not policy authorities.

## 9. Lifecycle and gates

Expanded lifecycle:

```text
change
  -> local verification
  -> PR
  -> independent review
  -> CI
  -> database/migration readiness
  -> merge eligibility
  -> merge
  -> infrastructure/deployment readiness
  -> deploy/migrate in the provider-specific safe order
  -> deployment verification
  -> database verification
  -> production observation
  -> complete / rollback / forward-fix
```

The safe ordering of code deployment and database migration is determined per change. GitSkillPro must support expand/contract and other backward-compatible rollout patterns rather than assuming "migration first" or "code first" globally.

## 10. CLI expansion

Add:

- `gsp audit infra`
- `gsp audit db`
- `gsp plan migration`
- `gsp recover db`
- `gsp providers`

Read/audit/plan commands are the default. Destructive mutation commands require explicit policy gates and must never be hidden inside an audit command.

## 11. MCP expansion

Add structured tools:

- `infrastructure.audit`
- `database.audit`
- `database.plan_migration`
- `provider.inspect`
- `recovery.plan`

Provider-specific mutation tools should be added only after their evidence and authorization semantics are tested.

## 12. Plugin/native-connector behavior

GitSkillPro must discover and use host-native integrations when available rather than asking for duplicate credentials. Examples include GitHub, Vercel, Supabase, MongoDB Atlas, Cloudflare, or other connected providers.

The adapter must also recognize when a plugin is narrower than the provider itself. For example, a Hostinger Horizons connector is not proof of Hostinger VPS control. The capability broker chooses by actual advertised capability, not provider brand name.

## 13. Evidence contract expansion

Evidence packets add optional but strongly typed fields for:

- provider identity;
- infrastructure target identity;
- deployment target and revision/image;
- database target identity;
- database engine/version;
- migration framework and migration IDs;
- schema/drift hashes when available;
- backup/PITR evidence;
- data-impact classification;
- expected lock/backfill impact;
- rollback vs forward-fix plan;
- post-migration validation;
- post-deploy runtime validation.

Secret values are never written into evidence.

## 14. Required tests

Add regression tests proving that GitSkillPro:

- does not confuse provider brand with actual connector capability;
- does not let a remote provider adapter claim local Git state;
- does not let local Git state claim production deployment health;
- does not let green CI satisfy database safety;
- refuses production DB mutation without proven target identity;
- distinguishes code rollback from data recovery;
- distinguishes in-place recovery from replacement-database recovery;
- detects migration frameworks without confusing seeds/resets with migrations;
- treats destructive DDL/DML and restores as higher risk;
- invalidates stale database/deployment assumptions when another actor changes target state;
- supports provider-specific rollback constraints;
- keeps root-cause diagnosis separate from unrelated hardening findings.

## 15. Implementation scope guidance

The core implementation must ship the provider/database **contracts, discovery, policy, evidence model, reference knowledge, and deterministic auditors** first.

Provider implementation can then deepen in layers:

**Tier 1:** GitHub, local Git, Vercel, Cloudflare, Hostinger VPS/generic VPS, Docker, PostgreSQL/Supabase, D1, Convex.

**Tier 2:** Neon, Turso, MongoDB Atlas, Redis/Upstash, Kubernetes, Railway, Render, Fly.io, Netlify.

**Tier 3:** AWS, GCP, Azure, PlanetScale, Firebase/Firestore, DynamoDB and other providers.

A Tier 2/3 provider may still be audited generically before a dedicated adapter exists. GitSkillPro must report the reduced evidence/capability level instead of pretending full provider knowledge.

## Definition of success

An unfamiliar coding agent can enter an unfamiliar repository running on an unfamiliar host with an unfamiliar database, discover what systems and migration tools are actually present, identify which native connectors/CLIs/APIs it can safely use, separate Git/CI/deployment/infrastructure/database failures, execute or recommend the least-destructive operation, and produce evidence sufficient for autonomous review and recovery.