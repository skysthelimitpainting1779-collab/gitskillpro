export interface MergeGroupCheck {
  name: string;
  sha: string;
  status: "success" | "failure" | "pending" | "cancelled" | "unknown";
}

export interface MergeGroupAuditInput {
  mergeGroupRequired: boolean;
  prHeadSha: string;
  mergeGroupSha?: string;
  requiredChecks: string[];
  checks: MergeGroupCheck[];
}

export interface MergeGroupFinding {
  code: "MISSING_MERGE_GROUP_SHA" | "MISSING_MERGE_GROUP_CHECK" | "FAILED_MERGE_GROUP_CHECK";
  observation: string;
  check?: string;
}

export interface MergeGroupAuditResult {
  ready: boolean;
  findings: MergeGroupFinding[];
}

export function auditMergeGroup(input: MergeGroupAuditInput): MergeGroupAuditResult {
  if (!input.mergeGroupRequired) return { ready: true, findings: [] };
  const findings: MergeGroupFinding[] = [];
  if (!input.mergeGroupSha) {
    findings.push({ code: "MISSING_MERGE_GROUP_SHA", observation: "Merge-group/queue evidence is required but no merge-group SHA is known." });
    return { ready: false, findings };
  }

  for (const required of input.requiredChecks) {
    const exact = input.checks.filter((check) => check.name === required && check.sha === input.mergeGroupSha);
    if (!exact.length) {
      findings.push({
        code: "MISSING_MERGE_GROUP_CHECK",
        check: required,
        observation: `Required check ${required} is not proven on merge-group SHA ${input.mergeGroupSha}; PR-head evidence is not reused.`,
      });
      continue;
    }
    if (!exact.some((check) => check.status === "success")) {
      findings.push({
        code: "FAILED_MERGE_GROUP_CHECK",
        check: required,
        observation: `Required check ${required} has not succeeded on merge-group SHA ${input.mergeGroupSha}.`,
      });
    }
  }

  return { ready: findings.length === 0, findings };
}
