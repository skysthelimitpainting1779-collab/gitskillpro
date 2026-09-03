import { createDeploymentSnapshot, type DeploymentSnapshot, type DeploymentStatus, type EvidenceStatus, type SecretMetadata } from "../providers/types.js";

export interface VercelDeploymentPayload {
  deploymentId: string;
  projectId?: string;
  environment?: "preview" | "production" | string;
  sourceRevision?: string;
  status: DeploymentStatus;
  buildEvidence?: EvidenceStatus;
  runtimeEvidence?: EvidenceStatus;
  rollbackEvidence?: EvidenceStatus;
  healthy?: boolean;
  url?: string;
  domains?: string[];
  secrets?: SecretMetadata[];
  buildLogReference?: string;
  runtimeLogReference?: string;
}

export function normalizeVercelDeployment(payload: VercelDeploymentPayload): DeploymentSnapshot {
  const references = [payload.buildLogReference, payload.runtimeLogReference].filter((value): value is string => Boolean(value));
  return createDeploymentSnapshot({
    provider: "vercel",
    evidenceStatus: payload.status === "unknown" ? "unknown" : "partial",
    status: payload.status,
    deploymentId: payload.deploymentId,
    projectId: payload.projectId,
    sourceRevision: payload.sourceRevision,
    targetEnvironment: payload.environment,
    healthy: payload.healthy,
    url: payload.url,
    domains: payload.domains ? [...payload.domains] : undefined,
    secrets: payload.secrets?.map((secret) => ({ ...secret })),
    buildEvidence: payload.buildEvidence ?? "unknown",
    runtimeEvidence: payload.runtimeEvidence ?? "unknown",
    rollbackEvidence: payload.rollbackEvidence ?? "unknown",
    references,
  });
}
