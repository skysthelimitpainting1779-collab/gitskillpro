import type { RiskTier } from "../core/types.js";

export type ContextItemKind =
  | "policy"
  | "scope"
  | "acceptance"
  | "evidence"
  | "recovery"
  | "diff"
  | "history"
  | "ci"
  | "pr"
  | "deployment"
  | "database"
  | "docs"
  | "unknown";

export interface ContextItem {
  id: string;
  kind: ContextItemKind;
  estimatedTokens: number;
  required?: boolean;
  unresolved?: boolean;
  priority?: number;
  reason: string;
  source?: string;
  reference?: string;
}

export interface PlannedContextItem extends ContextItem {
  effectiveRequired: boolean;
  priority: number;
}

export interface ContextPlanInput {
  risk: RiskTier;
  tokenBudget: number;
  items: ContextItem[];
}

export interface ContextPlan {
  risk: RiskTier;
  tokenBudget: number;
  estimatedTokens: number;
  included: PlannedContextItem[];
  deferred: PlannedContextItem[];
  budgetExceededForRequiredEvidence: boolean;
}
