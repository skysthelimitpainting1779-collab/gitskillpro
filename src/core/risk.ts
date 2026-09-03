import type { RiskTier } from "./types.js";

export interface OperationImpact {
  localMutation?: boolean;
  sharedMutation?: boolean;
  remoteMutation?: boolean;
  production?: boolean;
  database?: boolean;
  security?: boolean;
  ownership?: boolean;
  billing?: boolean;
  destructive?: boolean;
}

export function classifyOperationRisk(impact: OperationImpact): RiskTier {
  if (impact.destructive || impact.security || impact.ownership || impact.billing) return "R4";
  if (impact.production || impact.database) return "R3";
  if (impact.sharedMutation || impact.remoteMutation) return "R2";
  if (impact.localMutation) return "R1";
  return "R0";
}
