import type { RiskTier } from "../core/types.js";
import { compareRisk } from "../core/operation.js";

export type SqlRiskClassification =
  | "read_only"
  | "additive_schema"
  | "index"
  | "constraint"
  | "data_transform"
  | "destructive_ddl"
  | "destructive_dml"
  | "permission_rls"
  | "unknown";

export interface SqlStatementRisk {
  statement: string;
  classification: SqlRiskClassification;
  risk: RiskTier;
  reasons: string[];
}

export interface SqlMigrationRiskResult {
  statements: SqlStatementRisk[];
  maxRisk: RiskTier;
}

function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n\r]*/g, " ");
}

function splitStatements(sql: string): string[] {
  return stripComments(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function classify(statement: string): SqlStatementRisk {
  const normalized = statement.replace(/\s+/g, " ").trim();
  const upper = normalized.toUpperCase();
  const result = (classification: SqlRiskClassification, risk: RiskTier, reason: string): SqlStatementRisk => ({
    statement: normalized,
    classification,
    risk,
    reasons: [reason],
  });

  if (/^(SELECT|EXPLAIN\s+SELECT|SHOW\s+|WITH\s+.+\s+SELECT\s+)/i.test(normalized)) {
    return result("read_only", "R0", "Statement is recognized as read-only query/inspection SQL.");
  }

  if (/^DROP\s+(TABLE|DATABASE|SCHEMA|TYPE|VIEW|MATERIALIZED\s+VIEW)\b/i.test(normalized)) {
    return result("destructive_ddl", "R4", "DROP removes a schema object and may destroy or invalidate data/dependencies.");
  }
  if (/^ALTER\s+TABLE\b[\s\S]*\bDROP\s+COLUMN\b/i.test(normalized)) {
    return result("destructive_ddl", "R4", "DROP COLUMN is destructive schema mutation.");
  }
  if (/^ALTER\s+TABLE\b[\s\S]*\bALTER\s+COLUMN\b[\s\S]*\bTYPE\b/i.test(normalized) || /^ALTER\s+TYPE\b/i.test(normalized)) {
    return result("destructive_ddl", "R4", "Column/type transformation may rewrite data and break old code; classify conservatively.");
  }
  if (/^TRUNCATE\b/i.test(normalized)) {
    return result("destructive_dml", "R4", "TRUNCATE removes table data.");
  }
  if (/^DELETE\s+FROM\b/i.test(normalized) && !/\bWHERE\b/i.test(upper)) {
    return result("destructive_dml", "R4", "DELETE without an observable WHERE clause is destructive bulk data mutation.");
  }
  if (/^UPDATE\b/i.test(normalized) && !/\bWHERE\b/i.test(upper)) {
    return result("destructive_dml", "R4", "UPDATE without an observable WHERE clause may mutate the entire table.");
  }

  if (/^(GRANT|REVOKE)\b/i.test(normalized) || /^CREATE\s+POLICY\b/i.test(normalized) || /^ALTER\s+POLICY\b/i.test(normalized) || /^DROP\s+POLICY\b/i.test(normalized) || /\b(ENABLE|DISABLE|FORCE|NO\s+FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/i.test(normalized)) {
    return result("permission_rls", "R3", "Statement changes database authorization or row-level security behavior.");
  }

  if (/^CREATE\s+(UNIQUE\s+)?INDEX\b/i.test(normalized) || /^DROP\s+INDEX\b/i.test(normalized) || /^REINDEX\b/i.test(normalized)) {
    return result("index", "R2", "Index operation can affect locking, performance and write amplification even when non-destructive to rows.");
  }

  if (/^ALTER\s+TABLE\b[\s\S]*\b(ADD\s+CONSTRAINT|DROP\s+CONSTRAINT|VALIDATE\s+CONSTRAINT)\b/i.test(normalized)) {
    return result("constraint", "R3", "Constraint change can validate/lock existing data or alter accepted writes.");
  }

  if (/^CREATE\s+(TABLE|SCHEMA|TYPE|VIEW|SEQUENCE)\b/i.test(normalized) || /^ALTER\s+TABLE\b[\s\S]*\bADD\s+COLUMN\b/i.test(normalized)) {
    return result("additive_schema", "R2", "Additive schema mutation is generally more reversible/compatible but still requires lock/default/compatibility review.");
  }

  if (/^(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\b/i.test(normalized)) {
    return result("data_transform", "R3", "Statement mutates existing application data and requires bounded backfill/rollback evidence.");
  }

  return result("unknown", "R3", "SQL statement is not recognized by the conservative classifier and requires explicit review.");
}

export function classifySqlMigration(sql: string): SqlMigrationRiskResult {
  const statements = splitStatements(sql).map(classify);
  let maxRisk: RiskTier = "R0";
  for (const statement of statements) {
    if (compareRisk(statement.risk, maxRisk) > 0) maxRisk = statement.risk;
  }
  return { statements, maxRisk };
}
