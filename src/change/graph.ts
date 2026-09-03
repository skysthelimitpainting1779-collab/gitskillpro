import type { ChangeGraph, ChangeGraphFinding, ChangeGraphInput, ChangeGraphValidation, ChangeVersion } from "./types.js";

export function buildChangeGraph(input: ChangeGraphInput): ChangeGraph {
  const changes = input.changes.map((change) => ({
    ...change,
    workItemIds: change.workItemIds ? [...change.workItemIds] : undefined,
    versions: change.versions.map((version) => ({ ...version })),
  }));
  const dependencies = input.dependencies.map((dependency) => ({ ...dependency }));
  const byId = new Map<string, (typeof changes)[number]>();
  for (const change of changes) if (!byId.has(change.id)) byId.set(change.id, change);
  return { changes, dependencies, byId };
}

export function currentChangeVersion(graph: ChangeGraph, changeId: string): ChangeVersion | undefined {
  return graph.byId.get(changeId)?.versions.find((version) => version.active);
}

function cycleFindings(graph: ChangeGraph): ChangeGraphFinding[] {
  const adjacency = new Map<string, string[]>();
  for (const dependency of graph.dependencies) {
    if (dependency.kind === "related") continue;
    adjacency.set(dependency.from, [...(adjacency.get(dependency.from) ?? []), dependency.to]);
  }
  const findings: ChangeGraphFinding[] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  const reported = new Set<string>();

  const visit = (id: string, path: string[]): void => {
    if (stack.has(id)) {
      const start = path.indexOf(id);
      const cycle = start >= 0 ? [...path.slice(start), id] : [...path, id];
      const key = [...new Set(cycle)].sort().join("|");
      if (!reported.has(key)) {
        reported.add(key);
        findings.push({ code: "CHANGE_DEPENDENCY_CYCLE", changeId: id, observation: `Change dependency cycle detected: ${cycle.join(" -> ")}.` });
      }
      return;
    }
    if (visited.has(id)) return;
    visited.add(id);
    stack.add(id);
    for (const next of adjacency.get(id) ?? []) visit(next, [...path, id]);
    stack.delete(id);
  };

  for (const id of graph.byId.keys()) visit(id, []);
  return findings;
}

export function validateChangeGraph(graph: ChangeGraph): ChangeGraphValidation {
  const findings: ChangeGraphFinding[] = [];
  const counts = new Map<string, number>();
  for (const change of graph.changes) counts.set(change.id, (counts.get(change.id) ?? 0) + 1);
  for (const [id, count] of counts) {
    if (count > 1) findings.push({ code: "DUPLICATE_CHANGE_ID", changeId: id, observation: `Logical Change ID ${id} appears ${count} times.` });
  }

  for (const change of graph.changes) {
    const active = change.versions.filter((version) => version.active);
    if (active.length > 1) {
      findings.push({ code: "MULTIPLE_ACTIVE_CHANGE_VERSIONS", changeId: change.id, observation: `Logical change ${change.id} has ${active.length} active physical versions.` });
    }
    if (change.supersededBy && (!graph.byId.has(change.supersededBy) || change.supersededBy === change.id)) {
      findings.push({ code: "INVALID_SUPERSESSION", changeId: change.id, observation: `Change ${change.id} has invalid supersededBy target ${change.supersededBy}.` });
    }
  }

  for (const dependency of graph.dependencies) {
    if (!graph.byId.has(dependency.from) || !graph.byId.has(dependency.to)) {
      findings.push({ code: "UNKNOWN_CHANGE_REFERENCE", changeId: dependency.from, observation: `Dependency ${dependency.from} -> ${dependency.to} references an unknown logical change.` });
    }
  }

  findings.push(...cycleFindings(graph));
  return { valid: findings.length === 0, findings };
}
