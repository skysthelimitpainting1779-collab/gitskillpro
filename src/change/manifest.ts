import { createHash } from "node:crypto";
import type { RiskTier } from "../core/types.js";

export interface ChangeManifestDependency {
  changeId: string;
  headSha: string;
}

export interface ChangeManifestInput {
  changeId: string;
  versionId: string;
  headSha: string;
  baseSha?: string;
  workItemIds?: string[];
  dependencies?: ChangeManifestDependency[];
  affectedRefs?: string[];
  diffRefs?: string[];
  risk: RiskTier;
  checkRefs?: string[];
  securityRefs?: string[];
  migrationVersion?: string;
  deploymentRevision?: string;
  featureFlagRefs?: string[];
  provenanceRefs?: string[];
  sbomRefs?: string[];
  independentReviewRefs?: string[];
  recoveryRefs?: string[];
  contextPacketHash?: string;
  unknowns?: string[];
}

export interface ChangeManifest extends ChangeManifestInput {
  schemaVersion: "gsp-change-manifest/v1";
  fingerprint: string;
}

export interface ChangeManifestValidation {
  valid: boolean;
  manifest: ChangeManifest;
  errors: string[];
}

export interface ManifestCurrentIdentity {
  headSha?: string;
  baseSha?: string;
  dependencyHeads?: Record<string, string>;
  migrationVersion?: string;
  deploymentRevision?: string;
  contextPacketHash?: string;
}

export interface ManifestFreshness {
  current: boolean;
  reasons: string[];
}

function clean(values: string[] | undefined): string[] | undefined {
  if (!values) return undefined;
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function canonical(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      const item = input[key];
      if (item === undefined || key === "fingerprint") continue;
      output[key] = canonical(item);
    }
    return output;
  }
  return undefined;
}

function fingerprint(input: Omit<ChangeManifest, "fingerprint">): string {
  return `sha256:${createHash("sha256").update(JSON.stringify(canonical(input))).digest("hex")}`;
}

function validSha(value: string | undefined): boolean {
  return value === undefined || /^[0-9a-f]{40,64}$/i.test(value);
}

export function createChangeManifest(input: ChangeManifestInput): ChangeManifest {
  const body: Omit<ChangeManifest, "fingerprint"> = {
    ...input,
    changeId: input.changeId.trim(),
    versionId: input.versionId.trim(),
    headSha: input.headSha.trim(),
    baseSha: input.baseSha?.trim() || undefined,
    workItemIds: clean(input.workItemIds),
    dependencies: input.dependencies?.map((dependency) => ({ changeId: dependency.changeId.trim(), headSha: dependency.headSha.trim() })).sort((a, b) => a.changeId.localeCompare(b.changeId)),
    affectedRefs: clean(input.affectedRefs),
    diffRefs: clean(input.diffRefs),
    checkRefs: clean(input.checkRefs),
    securityRefs: clean(input.securityRefs),
    migrationVersion: input.migrationVersion?.trim() || undefined,
    deploymentRevision: input.deploymentRevision?.trim() || undefined,
    featureFlagRefs: clean(input.featureFlagRefs),
    provenanceRefs: clean(input.provenanceRefs),
    sbomRefs: clean(input.sbomRefs),
    independentReviewRefs: clean(input.independentReviewRefs),
    recoveryRefs: clean(input.recoveryRefs),
    contextPacketHash: input.contextPacketHash?.trim() || undefined,
    unknowns: clean(input.unknowns) ?? [],
    schemaVersion: "gsp-change-manifest/v1",
  };
  return { ...body, fingerprint: fingerprint(body) };
}

export function validateChangeManifest(manifest: ChangeManifest): ChangeManifestValidation {
  const errors: string[] = [];
  if (!manifest.changeId) errors.push("changeId is required");
  if (!manifest.versionId) errors.push("versionId is required");
  if (!validSha(manifest.headSha)) errors.push("headSha must be a Git object SHA");
  if (!validSha(manifest.baseSha)) errors.push("baseSha must be a Git object SHA when present");
  if (!manifest.risk) errors.push("risk is required");
  for (const dependency of manifest.dependencies ?? []) {
    if (!dependency.changeId || !validSha(dependency.headSha)) errors.push(`invalid dependency identity for ${dependency.changeId || "unknown"}`);
  }
  const expected = fingerprint({ ...manifest, fingerprint: undefined } as unknown as Omit<ChangeManifest, "fingerprint">);
  if (manifest.fingerprint !== expected) errors.push("manifest fingerprint does not match manifest evidence identity");
  return { valid: errors.length === 0, manifest, errors };
}

export function isManifestCurrent(manifest: ChangeManifest, current: ManifestCurrentIdentity): ManifestFreshness {
  const reasons: string[] = [];
  if (current.headSha !== undefined && current.headSha !== manifest.headSha) reasons.push(`Change head drift: manifest ${manifest.headSha}, current ${current.headSha}.`);
  if (current.baseSha !== undefined && current.baseSha !== manifest.baseSha) reasons.push(`Base head drift: manifest ${manifest.baseSha ?? "unknown"}, current ${current.baseSha}.`);

  for (const [changeId, currentHead] of Object.entries(current.dependencyHeads ?? {})) {
    const recorded = manifest.dependencies?.find((dependency) => dependency.changeId === changeId)?.headSha;
    if (recorded !== currentHead) reasons.push(`Dependency ${changeId} drift: manifest ${recorded ?? "unknown"}, current ${currentHead}.`);
  }

  if (current.migrationVersion !== undefined && current.migrationVersion !== manifest.migrationVersion) reasons.push(`Migration identity drift: manifest ${manifest.migrationVersion ?? "unknown"}, current ${current.migrationVersion}.`);
  if (current.deploymentRevision !== undefined && current.deploymentRevision !== manifest.deploymentRevision) reasons.push(`Deployment revision drift: manifest ${manifest.deploymentRevision ?? "unknown"}, current ${current.deploymentRevision}.`);
  if (current.contextPacketHash !== undefined && current.contextPacketHash !== manifest.contextPacketHash) reasons.push(`Context packet identity drift: manifest ${manifest.contextPacketHash ?? "unknown"}, current ${current.contextPacketHash}.`);

  return { current: reasons.length === 0, reasons };
}
