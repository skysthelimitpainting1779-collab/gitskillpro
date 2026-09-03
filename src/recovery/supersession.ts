export interface SupersessionCandidate {
  id: string;
  workItemId?: string;
  updatedAt?: string;
  explicitSupersedes?: string[];
  replacementEvidence?: string[];
}

export interface SupersessionEdge {
  from: string;
  to: string;
  explicit: boolean;
  evidence: string[];
}

export interface SupersessionResolution {
  edges: SupersessionEdge[];
  unknowns: string[];
}

export function resolveSupersession(candidates: readonly SupersessionCandidate[]): SupersessionResolution {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const edges: SupersessionEdge[] = [];
  const unknowns: string[] = [];
  const seen = new Set<string>();

  const add = (edge: SupersessionEdge) => {
    const key = `${edge.from}->${edge.to}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(edge);
  };

  for (const candidate of candidates) {
    for (const targetId of candidate.explicitSupersedes ?? []) {
      if (!byId.has(targetId)) {
        unknowns.push(`Explicit supersession target ${targetId} from ${candidate.id} is not present in the supplied candidate set.`);
        continue;
      }
      add({ from: candidate.id, to: targetId, explicit: true, evidence: [`explicitSupersedes:${targetId}`] });
    }
  }

  for (const candidate of candidates) {
    if (!candidate.workItemId || !candidate.replacementEvidence?.length) continue;
    for (const target of candidates) {
      if (candidate.id === target.id) continue;
      if (!target.workItemId || target.workItemId !== candidate.workItemId) continue;
      const matchingEvidence = candidate.replacementEvidence.filter((entry) => entry.toLowerCase().includes(target.id.toLowerCase()));
      if (matchingEvidence.length === 0) continue;
      add({ from: candidate.id, to: target.id, explicit: false, evidence: [...matchingEvidence] });
    }
  }

  return { edges, unknowns };
}
