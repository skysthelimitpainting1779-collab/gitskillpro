import type { RecoveryEdge, RecoveryEvidenceGraph, RecoverySnapshot } from "./types.js";

function validEdge(edge: RecoveryEdge, knownIds: Set<string>): boolean {
  if (!knownIds.has(edge.from) || !knownIds.has(edge.to)) return false;
  if (!edge.explicit && edge.evidence.length === 0) return false;
  return true;
}

export function buildRecoveryEvidenceGraph(snapshot: RecoverySnapshot): RecoveryEvidenceGraph {
  const findings: RecoveryEvidenceGraph["findings"] = [];
  const knownIds = new Set(snapshot.artifacts.map((artifact) => artifact.id));
  const seenIds = new Set<string>();

  for (const artifact of snapshot.artifacts) {
    if (seenIds.has(artifact.id)) {
      findings.push({
        code: "DUPLICATE_ARTIFACT_ID",
        severity: "error",
        observation: `Recovery artifact ID ${artifact.id} appears more than once.`,
        evidence: { artifactId: artifact.id },
      });
    }
    seenIds.add(artifact.id);
  }

  const edges: RecoveryEdge[] = [];
  for (const edge of snapshot.edges) {
    if (!knownIds.has(edge.from) || !knownIds.has(edge.to)) {
      findings.push({
        code: "EDGE_ENDPOINT_UNKNOWN",
        severity: "warning",
        observation: `Recovery edge ${edge.from} -> ${edge.to} references an unknown artifact.`,
        evidence: { from: edge.from, to: edge.to, kind: edge.kind },
      });
      continue;
    }
    if (!edge.explicit && edge.evidence.length === 0) {
      findings.push({
        code: "UNSUPPORTED_INFERRED_LINK",
        severity: "warning",
        observation: `Inferred recovery edge ${edge.from} -> ${edge.to} has no retained evidence and was withheld.`,
        evidence: { from: edge.from, to: edge.to, kind: edge.kind },
      });
      continue;
    }
    if (validEdge(edge, knownIds)) edges.push({ ...edge, evidence: [...edge.evidence] });
  }

  return {
    nodes: snapshot.artifacts.map((artifact) => ({ ...artifact, metadata: artifact.metadata ? { ...artifact.metadata } : undefined })),
    edges,
    findings,
  };
}
