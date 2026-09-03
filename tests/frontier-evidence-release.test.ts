import { describe, expect, it } from "vitest";
import { auditArtifactProvenance } from "../src/change/provenance.js";
import { createPolicyEvidence } from "../src/change/policy.js";
import { planRelease } from "../src/release/plan.js";

describe("artifact provenance", () => {
  it("keeps source verification separate from artifact provenance", () => {
    const result = auditArtifactProvenance({
      sourceCommitVerified: true,
      artifactAttestationRef: undefined,
      sbomRef: undefined,
      signatureRef: undefined,
      requireAttestation: true,
      requireSbom: true,
    });
    expect(result.sourceCommitVerified).toBe(true);
    expect(result.artifactProvenanceVerified).toBe(false);
    expect(result.findings.map((f) => f.code)).toContain("MISSING_ARTIFACT_ATTESTATION");
  });

  it("can prove artifact provenance without claiming runtime health", () => {
    const result = auditArtifactProvenance({
      sourceCommitVerified: true,
      artifactAttestationRef: "attestation:1",
      sbomRef: "sbom:1",
      signatureRef: "sig:1",
      requireAttestation: true,
      requireSbom: true,
      requireSignature: true,
    });
    expect(result.artifactProvenanceVerified).toBe(true);
    expect(result).not.toHaveProperty("deploymentHealthy");
  });
});

describe("policy evidence", () => {
  it("requires policy/version/input identity and preserves deny as evidence", () => {
    const evidence = createPolicyEvidence({
      policyId: "repo.merge.r3",
      policyVersion: "3",
      inputHash: "sha256:abc",
      result: "deny",
      reasons: ["independent review missing"],
    });
    expect(evidence.result).toBe("deny");
    expect(evidence.fingerprint).toMatch(/^sha256:/);
  });
});

describe("deploy versus release", () => {
  it("does not call a healthy deployment fully released at zero exposure", () => {
    const result = planRelease({
      deploymentHealthy: true,
      deploymentRevision: "a".repeat(40),
      currentExposurePercent: 0,
      targetExposurePercent: 100,
      featureFlagId: "new-checkout",
      metricsHealthy: true,
    });
    expect(result.releaseComplete).toBe(false);
    expect(result.steps.some((step) => step.kind === "increase_exposure")).toBe(true);
  });

  it("blocks exposure increase when deployment health is not proven", () => {
    const result = planRelease({
      deploymentHealthy: false,
      deploymentRevision: "a".repeat(40),
      currentExposurePercent: 0,
      targetExposurePercent: 25,
      metricsHealthy: true,
    });
    expect(result.blocked).toBe(true);
    expect(result.steps.some((step) => step.kind === "increase_exposure")).toBe(false);
  });

  it("plans observation before further promotion when metrics are unknown", () => {
    const result = planRelease({
      deploymentHealthy: true,
      deploymentRevision: "a".repeat(40),
      currentExposurePercent: 10,
      targetExposurePercent: 50,
      featureFlagId: "feature-a",
      metricsHealthy: undefined,
    });
    expect(result.steps[0]?.kind).toBe("observe_metrics");
  });
});
