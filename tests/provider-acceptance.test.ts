import { describe, expect, it } from "vitest";
import {
  auditCi,
  auditDatabase,
  auditDeployment,
  auditPullRequest,
  classifySqlMigration,
  createDatabaseSnapshot,
  normalizeGitHubPullRequest,
  normalizeVercelDeployment,
} from "../src/index.js";

describe("provider/database public API acceptance", () => {
  it("keeps CI, PR, deployment and database evidence separate through the public package", () => {
    const ci = auditCi({
      status: "failure",
      failedSteps: [{ name: "typecheck", category: "type", logExcerpt: "TS2345" }],
      requiredChecks: ["CI / verify"],
      emittedChecks: ["CI / verify"],
    });
    expect(ci.rootCauses[0]?.classification).toBe("type_static");

    const pr = normalizeGitHubPullRequest({
      number: 42,
      state: "open",
      base: "main",
      baseSha: "base123",
      head: "eng-42",
      headSha: "head123",
      checks: [{ name: "CI / verify", status: "completed", conclusion: "success", sha: "head123" }],
      reviews: [{ id: "r1", reviewerId: "reviewer-b", state: "APPROVED", commitId: "head123" }],
      reviewThreads: [],
      conversationComments: [],
      workflowRuns: [],
    });
    const prAudit = auditPullRequest({
      pr,
      risk: "R3",
      expectedHeadSha: "head123",
      requiredChecks: ["CI / verify"],
      implementerId: "agent-a",
      deploymentImplication: "resolved",
      databaseImplication: "resolved",
      rollbackPlan: "revert only when database compatibility is proven; otherwise forward-fix",
    });
    expect(prAudit.mergeReady).toBe(true);

    const deployment = normalizeVercelDeployment({
      deploymentId: "dpl_1",
      status: "success",
      sourceRevision: "head123",
      runtimeEvidence: "proven",
      healthy: true,
    });
    expect(auditDeployment({ deployment, expectedSourceRevision: "head123", ciStatus: "success" }).readyToPromote).toBe(true);

    const sql = classifySqlMigration("ALTER TABLE users ADD COLUMN nickname text;");
    expect(sql.statements[0]?.classification).toBe("additive_schema");

    const database = createDatabaseSnapshot({
      provider: "postgres",
      health: "healthy",
      evidenceStatus: "proven",
      environment: "production",
      currentMigrationVersion: "001",
      recoveryCapability: "pitr",
      rollbackCompatibility: "compatible",
    });
    expect(auditDatabase({
      database,
      pendingMigrations: [{ id: "002", order: 2, classifications: ["additive_schema"] }],
      lockRisk: "low",
      backfillRisk: "low",
    }).readyToMigrate).toBe(true);

    expect(deployment.domain).toBe("deployment");
    expect(database.domain).toBe("database");
  });
});
