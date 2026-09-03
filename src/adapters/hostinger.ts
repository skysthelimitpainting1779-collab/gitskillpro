import { createDeploymentSnapshot, type DeploymentSnapshot, type DeploymentStatus, type EvidenceStatus } from "../providers/types.js";

export type HostingerDeploymentPayload =
  | {
      surface: "horizons";
      siteId: string;
      status: DeploymentStatus;
      sourceRevision?: string;
      url?: string;
      healthy?: boolean;
      runtimeEvidence?: EvidenceStatus;
    }
  | {
      surface: "vps";
      serverId: string;
      status: DeploymentStatus;
      sourceRevision?: string;
      processState?: string;
      serviceState?: string;
      healthy?: boolean;
      runtimeEvidence?: EvidenceStatus;
      backupEvidence?: EvidenceStatus;
      logReferences?: string[];
    };

export function normalizeHostingerDeployment(payload: HostingerDeploymentPayload): DeploymentSnapshot {
  if (payload.surface === "horizons") {
    return createDeploymentSnapshot({
      provider: "hostinger_horizons",
      evidenceStatus: payload.status === "unknown" ? "unknown" : "partial",
      status: payload.status,
      deploymentId: payload.siteId,
      sourceRevision: payload.sourceRevision,
      healthy: payload.healthy,
      url: payload.url,
      runtimeEvidence: payload.runtimeEvidence ?? "unknown",
      metadata: { surface: "horizons" },
    });
  }

  return createDeploymentSnapshot({
    provider: "hostinger_vps",
    evidenceStatus: payload.status === "unknown" ? "unknown" : "partial",
    status: payload.status,
    deploymentId: payload.serverId,
    sourceRevision: payload.sourceRevision,
    healthy: payload.healthy,
    runtimeEvidence: payload.runtimeEvidence ?? "unknown",
    rollbackEvidence: payload.backupEvidence ?? "unknown",
    references: [...(payload.logReferences ?? [])],
    metadata: {
      surface: "vps",
      processState: payload.processState,
      serviceState: payload.serviceState,
    },
  });
}
