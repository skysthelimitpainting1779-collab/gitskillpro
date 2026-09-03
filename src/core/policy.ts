import { compareRisk } from "./operation.js";
import type { CapabilityId, OperationPlan, RiskTier } from "./types.js";

export interface Authority {
  maxRisk: RiskTier;
  allowedCapabilities: CapabilityId[];
  allowedIntents?: string[];
}

export interface PolicyDecision {
  allowed: boolean;
  reasons: string[];
  missingCapabilities: CapabilityId[];
}

export function evaluatePolicy(plan: OperationPlan, authority: Authority): PolicyDecision {
  const allowedCapabilities = new Set(authority.allowedCapabilities);
  const missingCapabilities = plan.requiredCapabilities.filter((capability) => !allowedCapabilities.has(capability));
  const reasons: string[] = [];

  if (compareRisk(plan.risk, authority.maxRisk) > 0) {
    reasons.push(`Risk ${plan.risk} exceeds authorized maximum ${authority.maxRisk}`);
  }

  if (missingCapabilities.length > 0) {
    reasons.push(`Missing required capabilities: ${missingCapabilities.join(", ")}`);
  }

  if (authority.allowedIntents && !authority.allowedIntents.includes(plan.intent)) {
    reasons.push(`Intent ${JSON.stringify(plan.intent)} is not authorized`);
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    missingCapabilities,
  };
}
