# Database and Migration Safety

Load this reference when a change touches schemas, migrations, data transforms, RLS/permissions, indexes/constraints, database branches/restores, or code whose rollback depends on database state.

## Database truth is separate

A successful commit, CI run, merge or application deployment does not prove database migration state or health. Inspect the database/provider layer that can actually prove current migration/schema/data state.

**A Git revert is not a database rollback.** Never present source-control history reversal as data recovery.

## Detect engine, provider and migration framework separately

Examples:

- engine: Postgres, MySQL, SQLite/libSQL, D1, MongoDB, Redis, Convex;
- provider: Supabase, Neon, Turso, Cloudflare, Upstash, Convex;
- framework: Supabase migrations, Prisma, Drizzle, Wrangler/D1, Alembic, Flyway, Liquibase, Atlas, raw/custom migration runner.

Prisma or Drizzle presence alone does not prove which database engine is used. Multiple databases may coexist.

## Migration risk classes

Distinguish:

- read-only inspection;
- additive schema;
- index;
- constraint;
- data transform/backfill;
- destructive DDL;
- destructive DML;
- permission/RLS;
- unknown/custom.

Additive schema is generally lower risk than destructive change but is not zero-risk: defaults, table rewrites, locks, long-running index operations and code compatibility still matter.

Treat DROP TABLE/COLUMN, TRUNCATE, clearly unqualified bulk DELETE/UPDATE and incompatible type transformations as destructive/high risk.

## Preflight

For material migrations establish:

- target environment;
- current migration/schema version;
- pending set and execution order;
- backup/PITR/branch/restore evidence where required;
- lock/table rewrite implications;
- large backfill impact;
- RLS/permission behavior changes;
- replication/connection-pool implications when relevant;
- forward and rollback application/schema compatibility.

## Expand/contract

For changes requiring compatibility windows, prefer:

`expand -> deploy code compatible with old+new schema -> backfill -> verify -> contract`

Do not contract/remove the old representation first when old code or rolling instances may still depend on it.

## Recovery semantics differ by provider

Record whether recovery is backup restore, point-in-time recovery, in-place destructive restore, branch/clone recovery, or new-database cutover. Do not assume all providers restore the same way.

After recovery, independently verify the data state and application compatibility.
