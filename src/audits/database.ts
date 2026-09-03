import type { DatabaseSnapshot } from "../providers/types.js";
import type { SqlRiskClassification } from "../database/sql-risk.js";

export interface PendingMigrationEvidence {
  id: string;
  order: number;
  classifications: SqlRiskClassification[];
}

export interface DatabaseAuditInput {
  database: DatabaseSnapshot;
  pendingMigrations: PendingMigrationEvidence[];
  lockRisk?: "low" | "high" | "unknown";
  backfillRisk?: "low" | "high" | "unknown";
}

export interface DatabaseFinding {
  code:
    | "DATABASE_EVIDENCE_UNKNOWN"
    | "DATABASE_UNHEALTHY"
    | "TARGET_ENVIRONMENT_UNKNOWN"
    | "CURRENT_MIGRATION_VERSION_UNKNOWN"
    | "MIGRATION_ORDER_INVALID"
    | "UNKNOWN_MIGRATION_RISK"
    | "DESTRUCTIVE_MIGRATION"
    | "RECOVERY_CAPABILITY_UNKNOWN"
    | "ROLLBACK_COMPATIBILITY_UNKNOWN"
    | "ROLLBACK_INCOMPATIBLE"
    | "LOCK_RISK_UNKNOWN"
    | "LOCK_RISK_HIGH"
    | "BACKFILL_RISK_UNKNOWN"
    | "BACKFILL_RISK_HIGH"
    | "PERMISSION_RLS_CHANGE";
  severity: "warning" | "error";
  observation: string;
  migrationId?: string;
}

export interface DatabaseAuditResult {
  readyToMigrate: boolean;
  findings: DatabaseFinding[];
  recoveryStrategy: string;
}

const highRiskClasses = new Set<SqlRiskClassification>(["destructive_ddl", "destructive_dml", "data_transform", "constraint", "permission_rls", "unknown"]);

function recoveryDescription(database: DatabaseSnapshot): string {
  switch (database.recoveryCapability) {
    case "backup": return "Restore from the provider/database backup procedure; verify restored data and application compatibility.";
    case "pitr": return "Use provider point-in-time recovery; verify the restored point and application compatibility before cutover.";
    case "branch_clone": return "Recover by provider branch/clone workflow and perform an explicit application connection cutover.";
    case "in_place_restore": return "Use the provider in-place restore procedure; treat current data replacement as destructive and verify afterward.";
    case "new_database_cutover": return "Restore/create a new database, verify it, then explicitly switch application connectivity.";
    default: return "Database recovery procedure is unknown; do not present source-control rollback as data recovery.";
  }
}

export function auditDatabase(input: DatabaseAuditInput): DatabaseAuditResult {
  const findings: DatabaseFinding[] = [];
  const add = (code: DatabaseFinding["code"], observation: string, severity: DatabaseFinding["severity"] = "error", migrationId?: string) => {
    findings.push({ code, observation, severity, migrationId });
  };

  if (input.database.evidenceStatus !== "proven") {
    add("DATABASE_EVIDENCE_UNKNOWN", `Database evidence status is ${input.database.evidenceStatus}; live state is not fully proven.`);
  }
  if (input.database.health === "unhealthy" || input.database.health === "degraded") {
    add("DATABASE_UNHEALTHY", `Database health is ${input.database.health}; migration should not proceed as a normal healthy rollout.`);
  } else if (input.database.health === "unknown") {
    add("DATABASE_EVIDENCE_UNKNOWN", "Database health is unknown.");
  }
  if (!input.database.environment) add("TARGET_ENVIRONMENT_UNKNOWN", "Target database environment is not proven.");
  if (!input.database.currentMigrationVersion) add("CURRENT_MIGRATION_VERSION_UNKNOWN", "Current migration/schema version is not proven.");

  const sortedOrders = input.pendingMigrations.map((migration) => migration.order);
  for (let i = 1; i < sortedOrders.length; i += 1) {
    const previous = sortedOrders[i - 1];
    const current = sortedOrders[i];
    if (previous === undefined || current === undefined || current <= previous) {
      add("MIGRATION_ORDER_INVALID", "Pending migration order is not strictly increasing in the supplied execution sequence.");
      break;
    }
  }

  let requiresRecoveryProof = false;
  let hasBackfill = false;
  let hasLockSensitive = false;

  for (const migration of input.pendingMigrations) {
    for (const classification of migration.classifications) {
      if (classification === "unknown") add("UNKNOWN_MIGRATION_RISK", `Migration ${migration.id} contains unclassified/custom migration behavior.`, "error", migration.id);
      if (classification === "destructive_ddl" || classification === "destructive_dml") {
        add("DESTRUCTIVE_MIGRATION", `Migration ${migration.id} contains ${classification} and requires explicit destructive-change authority plus recovery evidence.`, "error", migration.id);
      }
      if (classification === "permission_rls") {
        add("PERMISSION_RLS_CHANGE", `Migration ${migration.id} changes permissions/RLS and requires authorization/isolation review.`, "error", migration.id);
      }
      if (classification === "data_transform") hasBackfill = true;
      if (classification === "index" || classification === "constraint" || classification === "additive_schema") hasLockSensitive = true;
      if (highRiskClasses.has(classification)) requiresRecoveryProof = true;
    }
  }

  if (requiresRecoveryProof && (!input.database.recoveryCapability || input.database.recoveryCapability === "unknown")) {
    add("RECOVERY_CAPABILITY_UNKNOWN", "High-risk migration is present but database recovery capability is unknown.");
  }

  if (input.pendingMigrations.length > 0) {
    if (!input.database.rollbackCompatibility || input.database.rollbackCompatibility === "unknown") {
      add("ROLLBACK_COMPATIBILITY_UNKNOWN", "Application/schema rollback compatibility is not proven for the pending migration set.");
    } else if (input.database.rollbackCompatibility === "incompatible") {
      add("ROLLBACK_INCOMPATIBLE", "Database evidence says the post-migration schema/data state is incompatible with the rollback application revision.");
    }
  }

  if (hasLockSensitive) {
    if (!input.lockRisk || input.lockRisk === "unknown") add("LOCK_RISK_UNKNOWN", "Lock/table-rewrite impact is not characterized for pending schema/index/constraint work.");
    else if (input.lockRisk === "high") add("LOCK_RISK_HIGH", "Pending migration has high lock/table-rewrite risk.");
  }

  if (hasBackfill) {
    if (!input.backfillRisk || input.backfillRisk === "unknown") add("BACKFILL_RISK_UNKNOWN", "Backfill/data-transform impact is not characterized.");
    else if (input.backfillRisk === "high") add("BACKFILL_RISK_HIGH", "Pending data transform/backfill is classified high risk.");
  }

  return {
    readyToMigrate: findings.every((finding) => finding.severity !== "error"),
    findings,
    recoveryStrategy: recoveryDescription(input.database),
  };
}
