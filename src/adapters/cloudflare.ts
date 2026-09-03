import { createDeploymentSnapshot, type DeploymentSnapshot, type DeploymentStatus, type EvidenceStatus } from "../providers/types.js";

export type CloudflareBindingKind = "d1" | "kv" | "r2" | "queue" | "durable_object" | "service" | "other";

export interface CloudflareDeploymentPayload {
  surface: "worker" | "pages";
  deploymentId: string;
  versionId?: string;
  sourceRevision?: string;
  status: DeploymentStatus;
  environment?: string;
  runtimeEvidence?: EvidenceStatus;
  healthy?: boolean;
  routes?: string[];
  domains?: string[];
  bindings?: Array<{ name: string; kind: CloudflareBindingKind }>;
  rolloutStatus?: "full" | "gradual" | "staged" | "unknown";
  rollbackCompatibility?: "compatible" | "incompatible" | "unknown";
  logReferences?: string[];
}

export function normalizeCloudflareDeployment(payload: CloudflareDeploymentPayload): DeploymentSnapshot {
  const resourceKinds = [...new Set((payload.bindings ?? []).map((binding) => binding.kind))];
  return createDeploymentSnapshot({
    provider: "cloudflare",
    evidenceStatus: payload.status === "unknown" ? "unknown" : "partial",
    status: payload.status,
    deploymentId: payload.deploymentId,
    sourceRevision: payload.sourceRevision,
    targetEnvironment: payload.environment,
    healthy: payload.healthy,
    domains: payload.domains ? [...payload.domains] : payload.routes ? [...payload.routes] : undefined,
    runtimeEvidence: payload.runtimeEvidence ?? "unknown",
    rollbackEvidence: payload.rollbackCompatibility === "compatible" ? "proven" : "unknown",
    references: [...(payload.logReferences ?? [])],
    metadata: {
      surface: payload.surface,
      versionId: payload.versionId,
      resourceKinds,
      bindings: (payload.bindings ?? []).map((binding) => ({ ...binding })),
      rolloutStatus: payload.rolloutStatus ?? "unknown",
      rollbackCompatibility: payload.rollbackCompatibility ?? "unknown",
    },
  });
}
