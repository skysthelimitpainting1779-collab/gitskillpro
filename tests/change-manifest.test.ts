import { describe, expect, it } from "vitest";
import { createChangeManifest, isManifestCurrent, validateChangeManifest } from "../src/change/manifest.js";

function manifest() {
  return createChangeManifest({
    changeId: "chg-api",
    versionId: "v3",
    headSha: "a".repeat(40),
    baseSha: "b".repeat(40),
    workItemIds: ["ENG-42", "bead-7"],
    dependencies: [{ changeId: "chg-db", headSha: "c".repeat(40) }],
    affectedRefs: ["graph:affected:123"],
    diffRefs: ["github:pr:42:patch"],
    risk: "R3",
    checkRefs: ["ci:run:100"],
    securityRefs: ["codeql:run:9"],
    migrationVersion: "20260903_add_column",
    deploymentRevision: "a".repeat(40),
    provenanceRefs: ["attestation:sha256:abc"],
    sbomRefs: ["sbom:spdx:abc"],
    independentReviewRefs: ["review:agent-2:approved"],
    recoveryRefs: ["db:pitr:window-1", "git:revert-plan"],
    contextPacketHash: "ctx-123",
    unknowns: ["progressive rollout percentage not yet selected"],
  });
}

describe("proof-carrying Change Manifest", () => {
  it("creates a deterministic fingerprint for equivalent evidence identity", () => {
    expect(manifest().fingerprint).toBe(manifest().fingerprint);
    expect(manifest().fingerprint).toMatch(/^sha256:/);
  });

  it("validates required identity while allowing explicit unknowns", () => {
    const result = validateChangeManifest(manifest());
    expect(result.valid).toBe(true);
    expect(result.manifest.unknowns).toContain("progressive rollout percentage not yet selected");
  });

  it("becomes stale when the logical change physical head changes", () => {
    expect(isManifestCurrent(manifest(), { headSha: "d".repeat(40) }).current).toBe(false);
  });

  it("becomes stale when a lower dependency head changes", () => {
    const result = isManifestCurrent(manifest(), { dependencyHeads: { "chg-db": "d".repeat(40) } });
    expect(result.current).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/chg-db/i);
  });

  it("becomes stale on migration, deployment or context packet identity drift", () => {
    expect(isManifestCurrent(manifest(), { migrationVersion: "next" }).current).toBe(false);
    expect(isManifestCurrent(manifest(), { deploymentRevision: "e".repeat(40) }).current).toBe(false);
    expect(isManifestCurrent(manifest(), { contextPacketHash: "ctx-new" }).current).toBe(false);
  });

  it("remains current when supplied identities match", () => {
    const m = manifest();
    expect(isManifestCurrent(m, {
      headSha: m.headSha,
      baseSha: m.baseSha,
      dependencyHeads: { "chg-db": "c".repeat(40) },
      migrationVersion: m.migrationVersion,
      deploymentRevision: m.deploymentRevision,
      contextPacketHash: m.contextPacketHash,
    }).current).toBe(true);
  });
});
