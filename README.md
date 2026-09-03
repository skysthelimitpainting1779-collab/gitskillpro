# GitSkillPro

GitSkillPro is a universal software-workflow and repository-operations system for coding agents. It combines an Agent Skill, shared policy/decision engine, CLI, MCP server, plugin packaging, and capability-aware adapters for project/issue management, Git/GitHub, CI, hosting/deployment, infrastructure, and database safety.

The system is designed to work across local clones, linked worktrees, VPS/VM hosts, containers, CI runners, cloud coding agents, sandboxes, and plugin/connector-only environments without pretending capabilities exist when they do not.

## Canonical specification

The current canonical design is:

- [`SPEC.md`](./SPEC.md) — core Git/repository/CI/deployment/database operating contract.
- [`SPEC-v0.2.md`](./SPEC-v0.2.md) — workflow orchestration, Linear/issues/projects, agent comments/reviews, greenfield bootstrap, issue-to-PR flow, and repository governance. Where the two conflict, v0.2 wins.

Older design notes under `docs/superpowers/specs/` are supporting design history.

## End-to-end operating model

```text
PROJECT / INITIATIVE
  -> ISSUE
  -> READY CHECK
  -> CLAIM / DELEGATE
  -> BRANCH + WORKTREE OR REMOTE ISOLATION
  -> IMPLEMENT + LOCAL VERIFY
  -> PR
  -> INDEPENDENT AGENT REVIEW
  -> CI / POLICY CHECKS
  -> MERGE
  -> DATABASE / DEPLOYMENT WHEN REQUIRED
  -> PRODUCTION VERIFY
  -> ISSUE COMPLETE
  -> PROJECT / MILESTONE UPDATE
```

Each layer keeps its own truth: the issue tracker owns work state, Git/SCM owns code/integration state, CI owns verification evidence, deployment providers own runtime deployment evidence, and database providers own state/migration evidence.

## Work-management surface

Linear is first-class, with GitHub Issues/Projects as a first-class fallback/companion. GitSkillPro is designed to preserve project/issue identity, agent delegation, material agent comments, independent code reviews, branch/worktree/PR linkage, and Definition-of-Done completion evidence.

## Provider surface

GitSkillPro's provider layer is intentionally broader than Vercel. The design includes Vercel, Cloudflare, Hostinger VPS, generic VPS/SSH, Docker/Compose, Kubernetes, Netlify, Railway, Render, Fly.io, and extensible AWS/GCP/Azure adapters.

Database safety is a separate first-class gate. Planned database/provider knowledge includes PostgreSQL, Supabase, Neon, MySQL/MariaDB, PlanetScale/Vitess, SQLite/libSQL, Turso, Cloudflare D1, MongoDB Atlas, Redis/Upstash, Convex, Firebase/Firestore, and DynamoDB, plus migration-framework detection for Prisma, Drizzle, Supabase CLI, Alembic, Django, Rails, Knex, TypeORM, Sequelize, Flyway, Liquibase, EF Core, Atlas, D1/Wrangler, raw SQL, and custom runners.

## Core operation lifecycle

```text
DISCOVER -> SNAPSHOT -> CLASSIFY RISK -> PLAN -> CHECK AUTHORITY
         -> REVALIDATE CONCURRENCY -> EXECUTE -> VERIFY
         -> EMIT EVIDENCE -> COMPLETE / RECOVER / ESCALATE
```
