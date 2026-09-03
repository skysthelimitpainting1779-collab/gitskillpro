import { describe, expect, it } from "vitest";
import { classifySqlMigration } from "../src/database/sql-risk.js";
import { planMigrationSequence } from "../src/database/migration.js";

describe("SQL migration risk classification", () => {
  const cases = [
    ["read_only", "SELECT id FROM users;"],
    ["additive_schema", "CREATE TABLE audit_events(id bigint primary key);"],
    ["additive_schema", "ALTER TABLE users ADD COLUMN display_name text;"],
    ["index", "CREATE INDEX CONCURRENTLY idx_users_email ON users(email);"],
    ["constraint", "ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE(email);"],
    ["data_transform", "UPDATE users SET active = true WHERE active IS NULL;"],
    ["destructive_ddl", "DROP TABLE legacy_users;"],
    ["destructive_ddl", "ALTER TABLE users DROP COLUMN legacy_name;"],
    ["destructive_ddl", "ALTER TABLE users ALTER COLUMN id TYPE uuid USING id::uuid;"],
    ["destructive_dml", "TRUNCATE TABLE sessions;"],
    ["destructive_dml", "DELETE FROM sessions;"],
    ["destructive_dml", "UPDATE users SET active = false;"],
    ["permission_rls", "ALTER TABLE users ENABLE ROW LEVEL SECURITY;"],
    ["permission_rls", "CREATE POLICY tenant_select ON users FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::uuid);"],
  ] as const;

  for (const [classification, sql] of cases) {
    it(`classifies ${classification}: ${sql.slice(0, 32)}`, () => {
      const result = classifySqlMigration(sql);
      expect(result.statements[0]?.classification).toBe(classification);
    });
  }

  it("preserves unknown for custom/unrecognized migration code", () => {
    const result = classifySqlMigration("DO $$ BEGIN PERFORM custom_migration(); END $$;");
    expect(result.statements.some((statement) => statement.classification === "unknown")).toBe(true);
  });

  it("does not label additive schema as zero-risk", () => {
    const result = classifySqlMigration("ALTER TABLE users ADD COLUMN nickname text;");
    expect(result.maxRisk).not.toBe("R0");
  });
});

describe("migration sequencing", () => {
  it("plans expand -> compatible deploy -> backfill -> contract when a breaking contract step exists", () => {
    const plan = planMigrationSequence({
      hasExpandStep: true,
      hasBackfill: true,
      hasContractStep: true,
      rollbackCompatibility: "unknown",
    });
    expect(plan.order).toEqual(["expand", "deploy_compatible_code", "backfill", "contract"]);
    expect(plan.findings.map((finding) => finding.code)).toContain("ROLLBACK_COMPATIBILITY_UNKNOWN");
  });

  it("blocks a contract-first sequence", () => {
    const plan = planMigrationSequence({
      hasExpandStep: false,
      hasBackfill: false,
      hasContractStep: true,
      rollbackCompatibility: "incompatible",
    });
    expect(plan.safeToProceed).toBe(false);
    expect(plan.findings.map((finding) => finding.code)).toContain("CONTRACT_WITHOUT_COMPATIBILITY_WINDOW");
  });
});
