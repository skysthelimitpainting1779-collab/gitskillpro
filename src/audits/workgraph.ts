import type { AuthorityMap, WorkItem, WorkLink } from "../work/types.js";
import { validateAuthorityMap } from "../work/authority.js";

export interface WorkGraphFinding {
  code: string;
  severity: "info" | "warning" | "error";
  observation: string;
  evidence?: Record<string, unknown>;
}

export interface WorkGraphLink {
  sourceId: string;
  targetId: string;
  kind: WorkLink["kind"];
  explicit: boolean;
}

export interface WorkGraphAuditInput {
  items: readonly WorkItem[];
  authorityMap?: AuthorityMap;
  staleBefore?: string;
}

export interface WorkGraphAuditResult {
  healthy: boolean;
  findings: WorkGraphFinding[];
  links: WorkGraphLink[];
}

const INACTIVE = new Set(["done", "canceled"]);

function active(item: WorkItem): boolean {
  return !INACTIVE.has(item.status);
}

function explicitLinks(item: WorkItem): WorkGraphLink[] {
  const result: WorkGraphLink[] = [];
  for (const link of item.links ?? []) {
    if (!link.explicit) continue;
    result.push({ sourceId: item.id, targetId: link.targetId, kind: link.kind, explicit: true });
  }
  if (item.duplicateOf) result.push({ sourceId: item.id, targetId: item.duplicateOf, kind: "duplicate", explicit: true });
  for (const id of item.supersedes ?? []) result.push({ sourceId: item.id, targetId: id, kind: "supersedes", explicit: true });
  for (const id of item.supersededBy ?? []) result.push({ sourceId: item.id, targetId: id, kind: "superseded_by", explicit: true });
  return result;
}

export function auditWorkGraph(input: WorkGraphAuditInput): WorkGraphAuditResult {
  const findings: WorkGraphFinding[] = [];
  const byId = new Map(input.items.map((item) => [item.id, item]));
  const links = input.items.flatMap(explicitLinks);

  if (!input.authorityMap) {
    findings.push({
      code: "AUTHORITY_MAP_UNKNOWN",
      severity: "info",
      observation: "No explicit tracker authority map was supplied; cross-system canonical ownership remains unknown.",
    });
  } else {
    const validation = validateAuthorityMap(input.authorityMap);
    for (const error of validation.errors) {
      findings.push({ code: "INVALID_AUTHORITY_MAP", severity: "error", observation: error });
    }
  }

  for (const item of input.items) {
    if (item.duplicateOf && active(item)) {
      const target = byId.get(item.duplicateOf);
      if (target && active(target)) {
        findings.push({
          code: "ACTIVE_DUPLICATE_WORK",
          severity: "warning",
          observation: `${item.id} is explicitly marked duplicate of ${target.id}, but both remain active.`,
          evidence: { sourceId: item.id, targetId: target.id },
        });
      }
    }

    if ((item.supersededBy?.length ?? 0) > 0 && active(item)) {
      findings.push({
        code: "ACTIVE_SUPERSEDED_WORK",
        severity: "warning",
        observation: `${item.id} remains active despite explicit supersession by ${item.supersededBy?.join(", ")}.`,
        evidence: { itemId: item.id, supersededBy: item.supersededBy },
      });
    }

    if (item.status === "ready" && item.blockers.length > 0) {
      findings.push({
        code: "BLOCKED_BUT_READY",
        severity: "warning",
        observation: `${item.id} is marked ready while explicit blockers remain: ${item.blockers.join(", ")}.`,
        evidence: { itemId: item.id, blockers: item.blockers },
      });
    }

    if (input.staleBefore && item.status === "in_progress" && item.updatedAt && item.updatedAt < input.staleBefore) {
      findings.push({
        code: "STALE_ACTIVE_CLAIM",
        severity: "warning",
        observation: `${item.id} is still in progress but its observed update time predates the supplied stale threshold.`,
        evidence: { itemId: item.id, updatedAt: item.updatedAt, staleBefore: input.staleBefore },
      });
    }
  }

  const unhealthyCodes = new Set(["INVALID_AUTHORITY_MAP", "ACTIVE_DUPLICATE_WORK", "ACTIVE_SUPERSEDED_WORK", "BLOCKED_BUT_READY", "STALE_ACTIVE_CLAIM"]);
  return { healthy: findings.every((finding) => !unhealthyCodes.has(finding.code)), findings, links };
}
