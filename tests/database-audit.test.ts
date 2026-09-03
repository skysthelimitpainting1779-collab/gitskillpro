import { describe, expect, it } from "vitest";
import { auditDatabase } from "../src/audits/database.js";
import { createDatabaseSnapshot } from "../src/providers/types.js";

describe("database preflight audit", () => {
  it("requires target environment and current migration version", () => {
    const result = auditDatabase({
      database: createDatabaseSnapshot({ provider: "supabase", health: "healthy", evidenceStatus: "proven" }),
      pendingMigrations: [],
    });
    expect(result.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["TARGET_ENVIRONMENT_UNKNOWN", "CURRENT_MIGRATION_VERSION_UNKNOWN"]));
  });

  it("flags invalid pending migration order", () => {
    const result = auditDatabase({
      database: createDatabaseSnapshot({ provider: "postgres", health: "healthy", evidenceStatus: "proven", environment: "production", currentMigrationVersion: "001", rollbackCompatibility: "compatible", recoveryCapability: "pitr" }),
      pendingMigrations: [
        { id: "003", order: 3, classifications: ["additive_schema"] },
        { id: "002", order: 2, classifications: ["additive_schema"] },
      ],
    });
    expect(result.findings.map((finding) => finding.code)).toContain("MIGRATION_ORDER_INVALID");
  });

  it("requires recovery evidence for destructive migration", () => {
    const result = auditDatabase({
      database: createDatabaseSnapshot({ provider: "postgres", health: "healthy", evidenceStatus: "proven", environment: "production", currentMigrationVersion: "001", rollbackCompatibility: "unknown", recoveryCapability: "unknown" }),
      pendingMigrations: [{ id: "002", order: 2, classifications: ["destructive_ddl"] }],
    });
    expect(result.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["DESTRUCTIVE_MIGRATION", "RECOVERY_CAPABILITY_UNKNOWN", "ROLLBACK_COMPATIBILITY_UNKNOWN"]));
  });

  it("surfaces lock, backfill and RLS/permission impact separately", () => {
    const result = auditDatabase({
      database: createDatabaseSnapshot({ provider: "supabase", health: "healthy", evidenceStatus: "proven", environment: "production", currentMigrationVersion: "001", rollbackCompatibility: "compatible", recoveryCapability: "pitr" }),
      pendingMigrations: [{ id: "002", order: 2, classifications: ["index", "data_transform", "permission_rls"] }],
      lockRisk: "high",
      backfillRisk: "high",
    });
    expect(result.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["LOCK_RISK_HIGH", "BACKFILL_RISK_HIGH", "PERMISSION_RLS_CHANGE"]));
  });

  it("can be ready for a bounded additive migration with proven recovery and compatibility", () => {
    const result = auditDatabase({
      database: createDatabaseSnapshot({ provider: "postgres", health: "healthy", evidenceStatus: "proven", environment: "production", currentMigrationVersion: "001", rollbackCompatibility: "compatible", recoveryCapability: "pitr" }),
      pendingMigrations: [{ id: "002", order: 2, classifications: ["additive_schema"] }],
      lockRisk: "low",
      backfillRisk: "low",
    });
    expect(result.readyToMigrate).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/git revert/i);
  });
});
