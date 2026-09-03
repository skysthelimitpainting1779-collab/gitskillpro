import { describe, expect, it } from "vitest";
import { normalizeVercelDeployment } from "../src/adapters/vercel.js";
import { normalizeCloudflareDeployment } from "../src/adapters/cloudflare.js";
import { normalizeHostingerDeployment } from "../src/adapters/hostinger.js";
import { auditDeployment } from "../src/audits/deployment.js";

describe("deployment provider normalization", () => {
  it("normalizes Vercel build/deployment/runtime evidence independently", () => {
    const snapshot = normalizeVercelDeployment({
      deploymentId: "dpl_1",
      projectId: "prj_1",
      environment: "production",
      sourceRevision: "abc123",
      status: "success",
      buildEvidence: "proven",
      runtimeEvidence: "unknown",
      url: "https://app.example.com",
      domains: ["app.example.com"],
    });
    expect(snapshot.provider).toBe("vercel");
    expect(snapshot.buildEvidence).toBe("proven");
    expect(snapshot.runtimeEvidence).toBe("unknown");
    expect(snapshot.healthy).toBeUndefined();
  });

  it("records Cloudflare bound-resource kinds and rollback compatibility separately", () => {
    const snapshot = normalizeCloudflareDeployment({
      surface: "worker",
      deploymentId: "cf-1",
      versionId: "v12",
      sourceRevision: "abc123",
      status: "success",
      bindings: [{ name: "DB", kind: "d1" }, { name: "CACHE", kind: "kv" }],
      rollbackCompatibility: "unknown",
    });
    expect(snapshot.provider).toBe("cloudflare");
    expect(snapshot.metadata?.resourceKinds).toEqual(["d1", "kv"]);
    expect(snapshot.metadata?.rollbackCompatibility).toBe("unknown");
  });

  it("keeps Hostinger Horizons and VPS as different product surfaces", () => {
    expect(normalizeHostingerDeployment({ surface: "horizons", siteId: "site-1", status: "success" }).provider).toBe("hostinger_horizons");
    const vps = normalizeHostingerDeployment({ surface: "vps", serverId: "srv-1", status: "success", sourceRevision: "abc", processState: "running", healthy: true });
    expect(vps.provider).toBe("hostinger_vps");
    expect(vps.metadata?.processState).toBe("running");
  });
});

describe("deployment audit", () => {
  it("rejects a failed deployment even when CI was green", () => {
    const result = auditDeployment({
      ciStatus: "success",
      deployment: normalizeVercelDeployment({ deploymentId: "dpl-bad", status: "failure", runtimeEvidence: "unknown" }),
    });
    expect(result.readyToPromote).toBe(false);
    expect(result.findings.map((finding) => finding.code)).toContain("DEPLOYMENT_FAILED");
  });

  it("treats provider success without runtime health proof as partial, not healthy", () => {
    const result = auditDeployment({
      ciStatus: "success",
      deployment: normalizeVercelDeployment({ deploymentId: "dpl-1", status: "success", runtimeEvidence: "unknown" }),
    });
    expect(result.readyToPromote).toBe(false);
    expect(result.findings.map((finding) => finding.code)).toContain("RUNTIME_HEALTH_UNKNOWN");
  });

  it("flags source revision drift", () => {
    const result = auditDeployment({
      expectedSourceRevision: "new-sha",
      deployment: normalizeVercelDeployment({ deploymentId: "dpl-2", status: "success", sourceRevision: "old-sha", runtimeEvidence: "proven", healthy: true }),
    });
    expect(result.findings.map((finding) => finding.code)).toContain("SOURCE_REVISION_MISMATCH");
  });

  it("blocks rollback planning when data/resource compatibility is unknown", () => {
    const result = auditDeployment({
      rollbackRequested: true,
      databaseCompatibility: "unknown",
      resourceCompatibility: "unknown",
      deployment: normalizeCloudflareDeployment({ surface: "worker", deploymentId: "cf-2", status: "success", runtimeEvidence: "proven", healthy: true, rollbackCompatibility: "unknown" }),
    });
    expect(result.readyToPromote).toBe(false);
    expect(result.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["DATABASE_ROLLBACK_COMPATIBILITY_UNKNOWN", "RESOURCE_ROLLBACK_COMPATIBILITY_UNKNOWN"]));
  });

  it("can be healthy only when deployment and runtime evidence are proven", () => {
    const result = auditDeployment({
      expectedSourceRevision: "abc",
      deployment: normalizeVercelDeployment({ deploymentId: "dpl-good", status: "success", sourceRevision: "abc", runtimeEvidence: "proven", healthy: true }),
    });
    expect(result.readyToPromote).toBe(true);
    expect(result.state).toBe("healthy");
  });
});
