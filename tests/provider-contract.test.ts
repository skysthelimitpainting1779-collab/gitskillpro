import { describe, expect, it } from "vitest";
import { createDeploymentSnapshot, createDatabaseSnapshot, createCiSnapshot } from "../src/providers/types.js";

describe("provider evidence contracts", () => {
  it("keeps CI, deployment and database evidence as separate domains", () => {
    const ci = createCiSnapshot({ provider: "github", status: "success", evidenceStatus: "proven" });
    const deploy = createDeploymentSnapshot({ provider: "vercel", status: "unknown", evidenceStatus: "unknown" });
    const db = createDatabaseSnapshot({ provider: "supabase", health: "unknown", evidenceStatus: "unknown" });

    expect(ci.domain).toBe("ci");
    expect(deploy.domain).toBe("deployment");
    expect(db.domain).toBe("database");
    expect(ci.evidenceStatus).toBe("proven");
    expect(deploy.evidenceStatus).toBe("unknown");
    expect(db.evidenceStatus).toBe("unknown");
  });

  it("does not turn unknown evidence into a negative boolean", () => {
    const deployment = createDeploymentSnapshot({ provider: "cloudflare", status: "unknown", evidenceStatus: "unknown" });
    expect(deployment.healthy).toBeUndefined();
  });

  it("stores secret metadata without secret values", () => {
    const deployment = createDeploymentSnapshot({
      provider: "vercel",
      status: "success",
      evidenceStatus: "partial",
      secrets: [{ name: "DATABASE_URL", present: true, scope: "production" }],
    });
    expect(deployment.secrets?.[0]).toEqual({ name: "DATABASE_URL", present: true, scope: "production" });
    expect(JSON.stringify(deployment)).not.toMatch(/postgres:\/\//i);
  });
});
