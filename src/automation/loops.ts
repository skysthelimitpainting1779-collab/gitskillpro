export interface AutomationLoopActor {
  id: string;
  triggerEvents: string[];
  emittedEvents: string[];
  provenanceGuard: boolean;
  pathGuard: boolean;
  concurrencyGuard: boolean;
}

export interface AutomationLoopInput {
  actors: AutomationLoopActor[];
}

export interface AutomationLoop {
  actorIds: string[];
  events: string[];
  reason: string;
}

export interface AutomationLoopResult {
  safe: boolean;
  loops: AutomationLoop[];
  recommendations: string[];
}

interface Edge { from: string; to: string; event: string; guarded: boolean }

function edges(input: AutomationLoopInput): Edge[] {
  const result: Edge[] = [];
  for (const source of input.actors) {
    for (const event of source.emittedEvents) {
      for (const target of input.actors) {
        if (!target.triggerEvents.includes(event)) continue;
        const selfProvenanceGuard = source.id === target.id && target.provenanceGuard;
        result.push({ from: source.id, to: target.id, event, guarded: selfProvenanceGuard });
      }
    }
  }
  return result;
}

export function analyzeAutomationLoops(input: AutomationLoopInput): AutomationLoopResult {
  const usableEdges = edges(input).filter((edge) => !edge.guarded);
  const byFrom = new Map<string, Edge[]>();
  for (const edge of usableEdges) byFrom.set(edge.from, [...(byFrom.get(edge.from) ?? []), edge]);
  const loops: AutomationLoop[] = [];
  const fingerprints = new Set<string>();

  const walk = (start: string, current: string, path: string[], eventPath: string[], visiting: Set<string>): void => {
    for (const edge of byFrom.get(current) ?? []) {
      if (edge.to === start) {
        const actorIds = [...path, current];
        const events = [...eventPath, edge.event];
        const canonical = [...new Set(actorIds)].sort().join("|");
        if (!fingerprints.has(canonical)) {
          fingerprints.add(canonical);
          loops.push({ actorIds: [...new Set(actorIds)], events, reason: `Automation events can return to ${start} without a proven self-trigger guard.` });
        }
        continue;
      }
      if (visiting.has(edge.to)) continue;
      const next = new Set(visiting);
      next.add(edge.to);
      walk(start, edge.to, [...path, current], [...eventPath, edge.event], next);
    }
  };

  for (const actor of input.actors) walk(actor.id, actor.id, [], [], new Set([actor.id]));

  const recommendations = loops.length
    ? ["Add actor/event provenance guards, generated-output idempotency, path filters, dedicated branches and concurrency controls before enabling recursive repository writes."]
    : [];
  return { safe: loops.length === 0, loops, recommendations };
}
