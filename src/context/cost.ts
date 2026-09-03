export interface ContextCostInput {
  inputTokens: number;
  outputTokens: number;
  retrievedTokens: number;
  cachedTokens: number;
  avoidedTokens: number;
  taskSucceeded: boolean;
  qualityScoreBefore?: number;
  qualityScoreAfter?: number;
  evidenceCompletenessBefore?: number;
  evidenceCompletenessAfter?: number;
}

export interface ContextCostReport extends ContextCostInput {
  uncachedInputTokens: number;
  observedTokens: number;
  optimizationSuccessful: boolean;
  reasons: string[];
}

function count(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative finite number`);
  return value;
}

function score(value: number | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${name} must be between 0 and 1`);
  return value;
}

export function reportContextCost(input: ContextCostInput): ContextCostReport {
  const inputTokens = count(input.inputTokens, "inputTokens");
  const outputTokens = count(input.outputTokens, "outputTokens");
  const retrievedTokens = count(input.retrievedTokens, "retrievedTokens");
  const cachedTokens = count(input.cachedTokens, "cachedTokens");
  const avoidedTokens = count(input.avoidedTokens, "avoidedTokens");
  const qualityScoreBefore = score(input.qualityScoreBefore, "qualityScoreBefore");
  const qualityScoreAfter = score(input.qualityScoreAfter, "qualityScoreAfter");
  const evidenceCompletenessBefore = score(input.evidenceCompletenessBefore, "evidenceCompletenessBefore");
  const evidenceCompletenessAfter = score(input.evidenceCompletenessAfter, "evidenceCompletenessAfter");
  const reasons: string[] = [];

  if (!input.taskSucceeded) reasons.push("Task success was not preserved.");
  if (avoidedTokens <= 0) reasons.push("No avoided-token savings were demonstrated.");

  if (qualityScoreBefore !== undefined) {
    if (qualityScoreAfter === undefined) reasons.push("Post-optimization quality was not measured.");
    else if (qualityScoreAfter < qualityScoreBefore) reasons.push("Quality score decreased after context optimization.");
  }

  if (evidenceCompletenessBefore !== undefined) {
    if (evidenceCompletenessAfter === undefined) reasons.push("Post-optimization evidence completeness was not measured.");
    else if (evidenceCompletenessAfter < evidenceCompletenessBefore) reasons.push("Evidence completeness decreased after context optimization.");
  }

  return {
    ...input,
    inputTokens,
    outputTokens,
    retrievedTokens,
    cachedTokens,
    avoidedTokens,
    qualityScoreBefore,
    qualityScoreAfter,
    evidenceCompletenessBefore,
    evidenceCompletenessAfter,
    uncachedInputTokens: Math.max(0, inputTokens - cachedTokens),
    observedTokens: inputTokens + outputTokens + retrievedTokens,
    optimizationSuccessful: reasons.length === 0,
    reasons,
  };
}
