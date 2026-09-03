import type { SemanticWorkStatus, WorkItem } from "../work/types.js";
import { mapProviderStatus, type ProviderStatusMap } from "../work/status.js";

export interface LinearIssuePayload {
  id: string;
  identifier?: string;
  title: string;
  status?: { name?: string } | null;
  project?: { id?: string; name?: string } | null;
  gitBranchName?: string | null;
  blockedBy?: string[];
  acceptanceCriteria?: string[];
  assigneeId?: string | null;
  delegateId?: string | null;
  updatedAt?: string;
}

export interface LinearHostCapabilities {
  issuesRead: boolean;
  issuesWrite: boolean;
  projectsRead: boolean;
  commentsRead: boolean;
  commentsWrite: boolean;
  delegateWrite: boolean;
}

export const READ_ONLY_LINEAR_HOST_CAPABILITIES: LinearHostCapabilities = {
  issuesRead: true,
  issuesWrite: false,
  projectsRead: true,
  commentsRead: true,
  commentsWrite: false,
  delegateWrite: false,
};

export function normalizeLinearIssue(payload: LinearIssuePayload, statusMap: ProviderStatusMap): WorkItem {
  const providerStatus = payload.status?.name?.trim() ?? "";
  const status: SemanticWorkStatus = providerStatus ? mapProviderStatus(providerStatus, statusMap) : "unknown";

  return {
    id: payload.identifier?.trim() || payload.id,
    provider: "linear",
    title: payload.title,
    status,
    projectId: payload.project?.id || undefined,
    branchName: payload.gitBranchName || undefined,
    acceptanceCriteria: payload.acceptanceCriteria ? [...payload.acceptanceCriteria] : undefined,
    blockers: [...(payload.blockedBy ?? [])],
    assigneeId: payload.assigneeId || undefined,
    delegateId: payload.delegateId || undefined,
    updatedAt: payload.updatedAt,
  };
}
