import type { ContextItem, ContextPlan, ContextPlanInput, PlannedContextItem } from "./types.js";

function validateItem(item: ContextItem): void {
  if (!item.id.trim()) throw new Error("Context item id is required");
  if (!Number.isFinite(item.estimatedTokens) || item.estimatedTokens < 0) {
    throw new Error(`Context item ${item.id} has invalid estimatedTokens`);
  }
  if (!item.reason.trim()) throw new Error(`Context item ${item.id} requires a reason`);
}

function normalizeItem(item: ContextItem): PlannedContextItem {
  validateItem(item);
  return {
    ...item,
    effectiveRequired: item.required === true || item.unresolved === true,
    priority: item.priority ?? 0,
  };
}

export function planContext(input: ContextPlanInput): ContextPlan {
  if (!Number.isFinite(input.tokenBudget) || input.tokenBudget < 0) {
    throw new Error("tokenBudget must be a non-negative finite number");
  }

  const normalized = input.items.map(normalizeItem);
  const required = normalized.filter((item) => item.effectiveRequired);
  const optional = normalized
    .filter((item) => !item.effectiveRequired)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => b.item.priority - a.item.priority || a.index - b.index)
    .map(({ item }) => item);

  const included = [...required];
  const deferred: PlannedContextItem[] = [];
  let estimatedTokens = required.reduce((sum, item) => sum + item.estimatedTokens, 0);

  for (const item of optional) {
    if (estimatedTokens + item.estimatedTokens <= input.tokenBudget) {
      included.push(item);
      estimatedTokens += item.estimatedTokens;
    } else {
      deferred.push(item);
    }
  }

  return {
    risk: input.risk,
    tokenBudget: input.tokenBudget,
    estimatedTokens,
    included,
    deferred,
    budgetExceededForRequiredEvidence: required.reduce((sum, item) => sum + item.estimatedTokens, 0) > input.tokenBudget,
  };
}
