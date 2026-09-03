import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

export type DatabaseEngineKind = "postgres" | "mysql" | "sqlite" | "libsql" | "d1" | "mongodb" | "redis" | "convex" | "dynamodb" | "firestore";
export type DatabaseProviderKind = "supabase" | "neon" | "turso" | "cloudflare" | "upstash" | "convex" | "mongodb_atlas" | "aws" | "firebase";
export type MigrationFrameworkKind =
  | "supabase"
  | "prisma"
  | "drizzle"
  | "wrangler_d1"
  | "alembic"
  | "django"
  | "rails"
  | "knex"
  | "typeorm"
  | "sequelize"
  | "flyway"
  | "liquibase"
  | "ef_core"
  | "atlas"
  | "raw_sql"
  | "custom";

export interface DatabaseDetectionEntry<T extends string> {
  kind: T;
  signals: string[];
}

export interface DatabaseDetectionResult {
  engines: Array<DatabaseDetectionEntry<DatabaseEngineKind>>;
  providers: Array<DatabaseDetectionEntry<DatabaseProviderKind>>;
  migrationFrameworks: Array<DatabaseDetectionEntry<MigrationFrameworkKind>>;
}

async function exists(root: string, path: string): Promise<boolean> {
  try {
    await access(join(root, path), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function text(root: string, path: string): Promise<string | undefined> {
  try {
    return await readFile(join(root, path), "utf8");
  } catch {
    return undefined;
  }
}

function add<T extends string>(list: Array<DatabaseDetectionEntry<T>>, kind: T, signal: string): void {
  const existing = list.find((entry) => entry.kind === kind);
  if (existing) {
    if (!existing.signals.includes(signal)) existing.signals.push(signal);
  } else {
    list.push({ kind, signals: [signal] });
  }
}

function packageDependencies(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const names = new Set<string>();
    for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
      const value = parsed[field];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const name of Object.keys(value as Record<string, unknown>)) names.add(name);
      }
    }
    return names;
  } catch {
    return new Set();
  }
}

export async function detectDatabaseSystems(root = process.cwd()): Promise<DatabaseDetectionResult> {
  const engines: DatabaseDetectionResult["engines"] = [];
  const providers: DatabaseDetectionResult["providers"] = [];
  const migrationFrameworks: DatabaseDetectionResult["migrationFrameworks"] = [];
  const packageJson = await text(root, "package.json");
  const deps = packageDependencies(packageJson);

  if (await exists(root, "supabase/config.toml") || await exists(root, "supabase/migrations")) {
    add(providers, "supabase", "supabase/");
    add(engines, "postgres", "Supabase project configuration");
    if (await exists(root, "supabase/migrations")) add(migrationFrameworks, "supabase", "supabase/migrations");
  }
  if (deps.has("@supabase/supabase-js")) add(providers, "supabase", "package:@supabase/supabase-js");

  if (await exists(root, "prisma/schema.prisma") || deps.has("prisma") || deps.has("@prisma/client")) {
    add(migrationFrameworks, "prisma", await exists(root, "prisma/schema.prisma") ? "prisma/schema.prisma" : "package:prisma");
  }
  if (await exists(root, "drizzle.config.ts") || await exists(root, "drizzle.config.js") || deps.has("drizzle-orm")) {
    add(migrationFrameworks, "drizzle", await exists(root, "drizzle.config.ts") ? "drizzle.config.ts" : "package:drizzle-orm");
  }

  const wranglerPath = (await exists(root, "wrangler.toml")) ? "wrangler.toml" : ((await exists(root, "wrangler.json")) ? "wrangler.json" : ((await exists(root, "wrangler.jsonc")) ? "wrangler.jsonc" : undefined));
  if (wranglerPath) {
    const wrangler = await text(root, wranglerPath) ?? "";
    if (/d1_databases|\"d1_databases\"/i.test(wrangler)) {
      add(engines, "d1", wranglerPath);
      add(providers, "cloudflare", wranglerPath);
      add(migrationFrameworks, "wrangler_d1", wranglerPath);
    }
  }

  if (deps.has("pg") || deps.has("postgres")) add(engines, "postgres", deps.has("pg") ? "package:pg" : "package:postgres");
  if (deps.has("@neondatabase/serverless")) {
    add(engines, "postgres", "package:@neondatabase/serverless");
    add(providers, "neon", "package:@neondatabase/serverless");
  }
  if (deps.has("mysql2") || deps.has("mysql")) add(engines, "mysql", deps.has("mysql2") ? "package:mysql2" : "package:mysql");
  if (deps.has("better-sqlite3") || deps.has("sqlite3")) add(engines, "sqlite", deps.has("better-sqlite3") ? "package:better-sqlite3" : "package:sqlite3");
  if (deps.has("@libsql/client")) add(engines, "libsql", "package:@libsql/client");
  if (deps.has("@tursodatabase/api") || deps.has("@tursodatabase/database")) {
    add(engines, "libsql", "package:turso");
    add(providers, "turso", "package:turso");
  }
  if (deps.has("mongodb") || deps.has("mongoose")) add(engines, "mongodb", deps.has("mongodb") ? "package:mongodb" : "package:mongoose");
  if (deps.has("redis") || deps.has("ioredis") || deps.has("@upstash/redis")) add(engines, "redis", deps.has("@upstash/redis") ? "package:@upstash/redis" : "package:redis");
  if (deps.has("@upstash/redis")) add(providers, "upstash", "package:@upstash/redis");
  if (deps.has("convex") || await exists(root, "convex/schema.ts") || await exists(root, "convex/schema.js")) {
    add(engines, "convex", deps.has("convex") ? "package:convex" : "convex/schema");
    add(providers, "convex", deps.has("convex") ? "package:convex" : "convex/schema");
  }

  if (await exists(root, "alembic.ini") || await exists(root, "alembic")) add(migrationFrameworks, "alembic", "alembic");
  if (await exists(root, "manage.py") && (await text(root, "manage.py"))?.includes("django")) add(migrationFrameworks, "django", "manage.py");
  if (await exists(root, "db/migrate")) add(migrationFrameworks, "rails", "db/migrate");
  if (deps.has("knex")) add(migrationFrameworks, "knex", "package:knex");
  if (deps.has("typeorm")) add(migrationFrameworks, "typeorm", "package:typeorm");
  if (deps.has("sequelize")) add(migrationFrameworks, "sequelize", "package:sequelize");
  if (await exists(root, "flyway.conf")) add(migrationFrameworks, "flyway", "flyway.conf");
  if (await exists(root, "liquibase.properties")) add(migrationFrameworks, "liquibase", "liquibase.properties");
  if (await exists(root, "atlas.hcl")) add(migrationFrameworks, "atlas", "atlas.hcl");

  return {
    engines: engines.map((entry) => ({ ...entry, signals: [...entry.signals].sort() })).sort((a, b) => a.kind.localeCompare(b.kind)),
    providers: providers.map((entry) => ({ ...entry, signals: [...entry.signals].sort() })).sort((a, b) => a.kind.localeCompare(b.kind)),
    migrationFrameworks: migrationFrameworks.map((entry) => ({ ...entry, signals: [...entry.signals].sort() })).sort((a, b) => a.kind.localeCompare(b.kind)),
  };
}
