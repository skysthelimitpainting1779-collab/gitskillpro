# GitSkillPro

GitSkillPro is a universal repository-operations system for coding agents. It combines an Agent Skill, CLI, MCP server, plugin packaging, and capability-aware adapters for Git/GitHub, CI, hosting/deployment, infrastructure, and database safety.

The system is designed to work across local clones, linked worktrees, VPS/VM hosts, containers, CI runners, cloud coding agents, sandboxes, and plugin/connector-only environments without pretending capabilities exist when they do not.

## Planned provider surface

GitSkillPro's provider layer is intentionally broader than Vercel. The design includes Vercel, Cloudflare, Hostinger VPS, generic VPS/SSH, Docker/Compose, Kubernetes, Netlify, Railway, Render, Fly.io, and extensible AWS/GCP/Azure adapters.

Database safety is a separate first-class gate. Planned database/provider knowledge includes PostgreSQL, Supabase, Neon, MySQL/MariaDB, PlanetScale/Vitess, SQLite/libSQL, Turso, Cloudflare D1, MongoDB Atlas, Redis/Upstash, Convex, Firebase/Firestore, and DynamoDB, plus migration-framework detection for Prisma, Drizzle, Supabase CLI, Alembic, Django, Rails, Knex, TypeORM, Sequelize, Flyway, Liquibase, EF Core, Atlas, D1/Wrangler, raw SQL, and custom runners.

See `docs/superpowers/specs/2026-09-03-gitskillpro-design.md` for the current design specification.
