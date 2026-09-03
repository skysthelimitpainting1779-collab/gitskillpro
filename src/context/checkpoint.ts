export interface ContextCheckpointInput {
  scope: Record<string, string | number | boolean | null>;
  acceptedFacts: string[];
  evidenceRefs: string[];
  decisions: string[];
  unknowns: string[];
  nextAction: string;
  previous?: ContextCheckpoint;
}

export interface CheckpointDelta {
  factsAdded: string[];
  evidenceAdded: string[];
  decisionsAdded: string[];
  unknownsAdded: string[];
  unknownsResolved: string[];
}

export interface ContextCheckpoint {
  scope: Record<string, string | number | boolean | null>;
  acceptedFacts: string[];
  evidenceRefs: string[];
  decisions: string[];
  unknowns: string[];
  nextAction: string;
  createdAt: string;
  delta?: CheckpointDelta;
}

export interface SubagentPacketInput {
  task: string;
  acceptanceCriteria: string[];
  relevantEvidenceRefs?: string[];
}

export interface SubagentPacket {
  task: string;
  acceptanceCriteria: string[];
  scope: Record<string, string | number | boolean | null>;
  acceptedFacts: string[];
  evidenceRefs: string[];
  decisions: string[];
  unknowns: string[];
  nextAction: string;
}

function clean(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const value = raw.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function difference(current: string[], previous: string[]): string[] {
  const previousSet = new Set(previous);
  return current.filter((value) => !previousSet.has(value));
}

export function createCheckpoint(input: ContextCheckpointInput): ContextCheckpoint {
  const acceptedFacts = clean(input.acceptedFacts);
  const evidenceRefs = clean(input.evidenceRefs);
  const decisions = clean(input.decisions);
  const unknowns = clean(input.unknowns);
  const nextAction = input.nextAction.trim();
  if (!nextAction) throw new Error("Checkpoint nextAction is required");

  const unknownSet = new Set(unknowns);
  const conflict = acceptedFacts.find((fact) => unknownSet.has(fact));
  if (conflict) throw new Error(`Statement cannot be both accepted and unknown: ${conflict}`);

  const checkpoint: ContextCheckpoint = {
    scope: { ...input.scope },
    acceptedFacts,
    evidenceRefs,
    decisions,
    unknowns,
    nextAction,
    createdAt: new Date().toISOString(),
  };

  if (input.previous) {
    checkpoint.delta = {
      factsAdded: difference(acceptedFacts, input.previous.acceptedFacts),
      evidenceAdded: difference(evidenceRefs, input.previous.evidenceRefs),
      decisionsAdded: difference(decisions, input.previous.decisions),
      unknownsAdded: difference(unknowns, input.previous.unknowns),
      unknownsResolved: difference(input.previous.unknowns, unknowns),
    };
  }

  return checkpoint;
}

export function buildSubagentPacket(checkpoint: ContextCheckpoint, input: SubagentPacketInput): SubagentPacket {
  const task = input.task.trim();
  if (!task) throw new Error("Subagent task is required");
  const criteria = clean(input.acceptanceCriteria);
  const requestedRefs = input.relevantEvidenceRefs ? clean(input.relevantEvidenceRefs) : checkpoint.evidenceRefs;
  const available = new Set(checkpoint.evidenceRefs);
  const evidenceRefs = requestedRefs.filter((reference) => available.has(reference));

  return {
    task,
    acceptanceCriteria: criteria,
    scope: { ...checkpoint.scope },
    acceptedFacts: [...checkpoint.acceptedFacts],
    evidenceRefs,
    decisions: [...checkpoint.decisions],
    unknowns: [...checkpoint.unknowns],
    nextAction: checkpoint.nextAction,
  };
}
