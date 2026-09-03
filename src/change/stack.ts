export interface ChangeStackLayer {
  changeId: string;
  prNumber?: number;
  headSha: string;
  dependencyHeads: Record<string, string>;
}

export interface ChangeStackAuditInput {
  layers: ChangeStackLayer[];
  currentHeads: Record<string, string>;
}

export interface ChangeStackFinding {
  code: "STALE_CHANGE_HEAD" | "STALE_STACK_DEPENDENCY" | "UNKNOWN_STACK_DEPENDENCY";
  changeId: string;
  dependencyChangeId?: string;
  observation: string;
}

export interface ChangeStackAuditResult {
  current: boolean;
  findings: ChangeStackFinding[];
}

export function auditChangeStack(input: ChangeStackAuditInput): ChangeStackAuditResult {
  const findings: ChangeStackFinding[] = [];
  const layerIds = new Set(input.layers.map((layer) => layer.changeId));

  for (const layer of input.layers) {
    const current = input.currentHeads[layer.changeId];
    if (current && current !== layer.headSha) {
      findings.push({
        code: "STALE_CHANGE_HEAD",
        changeId: layer.changeId,
        observation: `Recorded head ${layer.headSha} for ${layer.changeId} differs from current head ${current}.`,
      });
    }

    for (const [dependencyChangeId, recordedHead] of Object.entries(layer.dependencyHeads)) {
      if (!layerIds.has(dependencyChangeId) && input.currentHeads[dependencyChangeId] === undefined) {
        findings.push({
          code: "UNKNOWN_STACK_DEPENDENCY",
          changeId: layer.changeId,
          dependencyChangeId,
          observation: `Stack layer ${layer.changeId} references unknown dependency ${dependencyChangeId}.`,
        });
        continue;
      }
      const currentDependencyHead = input.currentHeads[dependencyChangeId];
      if (currentDependencyHead && currentDependencyHead !== recordedHead) {
        findings.push({
          code: "STALE_STACK_DEPENDENCY",
          changeId: layer.changeId,
          dependencyChangeId,
          observation: `Stack layer ${layer.changeId} was validated against ${dependencyChangeId}@${recordedHead}, but current dependency head is ${currentDependencyHead}.`,
        });
      }
    }
  }

  return { current: findings.length === 0, findings };
}
