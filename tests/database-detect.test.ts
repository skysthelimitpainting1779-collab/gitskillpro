import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectDatabaseSystems } from "../src/database/detect.js";

async function repoWith(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), "gsp-db-detect-"));
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split("/");
    if (parts.length > 1) await mkdir(join(root, ...parts.slice(0, -1)), { recursive: true });
    await writeFile(join(root, path), content);
  }
  return root;
}

describe("database and migration detection", () => {
  it("detects Supabase/Postgres and migration framework evidence separately", async () => {
    const root = await repoWith({
      "supabase/config.toml": "project_id = 'x'",
      "supabase/migrations/20260903_init.sql": "create table x(id bigint primary key);",
      "package.json": JSON.stringify({ dependencies: { "@supabase/supabase-js": "^2", pg: "^8" } }),
    });
    const result = await detectDatabaseSystems(root);
    expect(result.engines.map((entry) => entry.kind)).toEqual(expect.arrayContaining(["postgres"]));
    expect(result.providers.map((entry) => entry.kind)).toContain("supabase");
    expect(result.migrationFrameworks.map((entry) => entry.kind)).toContain("supabase");
  });

  it("detects Prisma and Drizzle as frameworks without guessing an engine", async () => {
    const root = await repoWith({
      "prisma/schema.prisma": "generator client { provider = \"prisma-client-js\" }",
      "drizzle.config.ts": "export default {};",
    });
    const result = await detectDatabaseSystems(root);
    expect(result.migrationFrameworks.map((entry) => entry.kind)).toEqual(expect.arrayContaining(["prisma", "drizzle"]));
    expect(result.engines).toEqual([]);
  });

  it("detects Cloudflare D1 from explicit Wrangler D1 binding evidence", async () => {
    const root = await repoWith({
      "wrangler.toml": "name='worker'\n[[d1_databases]]\nbinding='DB'\ndatabase_name='app'\n",
      "migrations/0001.sql": "CREATE TABLE t(id INTEGER);",
    });
    const result = await detectDatabaseSystems(root);
    expect(result.engines.map((entry) => entry.kind)).toContain("d1");
    expect(result.providers.map((entry) => entry.kind)).toContain("cloudflare");
    expect(result.migrationFrameworks.map((entry) => entry.kind)).toContain("wrangler_d1");
  });

  it("detects multiple coexisting database systems from explicit dependencies", async () => {
    const root = await repoWith({
      "package.json": JSON.stringify({ dependencies: {
        "@libsql/client": "^0.15",
        "mongodb": "^6",
        "@upstash/redis": "^1",
        "convex": "^1"
      } }),
      "convex/schema.ts": "export default {};"
    });
    const result = await detectDatabaseSystems(root);
    expect(result.engines.map((entry) => entry.kind)).toEqual(expect.arrayContaining(["libsql", "mongodb", "redis", "convex"]));
    expect(result.providers.map((entry) => entry.kind)).toEqual(expect.arrayContaining(["upstash", "convex"]));
  });
});
