# GitSkillPro

GitSkillPro is a universal software-workflow and repository-operations system for coding agents. It combines an Agent Skill, shared policy/decision engine, CLI, MCP server, plugin packaging, and capability-aware adapters for project/work-graph management, Git/GitHub, CI, hosting/deployment, infrastructure, and database safety.

The system is designed to work across local clones, linked worktrees, VPS/VM hosts, containers, CI runners, cloud coding agents, sandboxes, and plugin/connector-only environments without pretending capabilities exist when they do not.

## Canonical specification

The current canonical design is cumulative:

- [`SPEC.md`](./SPEC.md) — core Git/repository/CI/deployment/database operating contract.
- [`SPEC-v0.2.md`](./SPEC-v0.2.md) — workflow orchestration, Linear/issues/projects, agent comments/reviews, greenfield bootstrap, issue-to-PR flow, and repository governance.
- [`SPEC-v0.3.md`](./SPEC-v0.3.md) — Beads/work-graph integration plus project takeover/recovery for broken CI, failed/stale/superseded PRs, tangled branches, conflicting tracker state, and selective salvage.

The newest specification wins where requirements conflict. Older design notes under `docs/superpowers/specs/` are supporting design history.

## End-to-end operating model

```text
PROJECT / INITIATIVE
  -> ISSUE / EXECUTION GRAPH
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

Each layer keeps its own truth. A project may use Linear as the human/product tracker, Beads as the dependency-aware agent execution graph, and GitHub as the code/review/merge system; GitSkillPro resolves an explicit authority map instead of creating uncontrolled tracker synchronization.

## Operating modes

GitSkillPro supports four distinct modes:

- **Normal mode** — execute healthy issue-to-production workflows.
- **Greenfield bootstrap mode** — establish tracker, repo, CI, PR, review, rules, deployment, and database flow for a new project.
- **Takeover / recovery mode** — reconstruct and repair inherited messy projects before broad mutation.
- **Incident mode** — prioritize service restoration and evidence preservation under incident policy.

Recovery mode inventories and links issues/beads, branches, commits, PRs, reviews, CI, merges, deployments, and migrations; distinguishes default-branch CI breakage from PR-specific failures; identifies duplicates and supersession; salvages only proven useful work; reconciles tracker state; restores governance; and proves recovery with one clean end-to-end issue.

## Work-management surface

Linear is first-class for project/issue management. Beads (`bd`) is first-class as a dependency-aware work-graph/execution adapter. GitHub Issues/Projects are a first-class fallback or companion. Other trackers fit the same capability contracts.

GitSkillPro is designed to preserve project/issue identity, agent delegation, dependencies, claims, material agent comments, duplicate/supersession relationships, independent code reviews, branch/worktree/PR linkage, and Definition-of-Done completion evidence.

## Provider surface

GitSkillPro's provider layer is intentionally broader than Vercel. The design includes Vercel, Cloudflare, Hostinger VPS, generic VPS/SSH, Docker/Compose, Kubernetes, Netlify, Railway, Render, Fly.io, and extensible AWS/GCP/Azure adapters.

Database safety is a separate first-class gate. Planned database/provider knowledge includes PostgreSQL, Supabase, Neon, MySQL/MariaDB, PlanetScale/Vitess, SQLite/libSQL, Turso, Cloudflare D1, MongoDB Atlas, Redis/Upstash, Convex, Firebase/Firestore, and DynamoDB, plus migration-framework detection for Prisma, Drizzle, Supabase CLI, Alembic, Django, Rails, Knex, TypeORM, Sequelize, Flyway, Liquibase, EF Core, Atlas, D1/Wrangler, raw SQL, and custom runners.

## Core operation lifecycle

```text
DISCOVER -> SNAPSHOT -> CLASSIFY RISK -> PLAN -> CHECK AUTHORITY
         -> REVALIDATE CONCURRENCY -> EXECUTE -> VERIFY
         -> EMIT EVIDENCE -> COMPLETE / RECOVER / ESCALATE
```
