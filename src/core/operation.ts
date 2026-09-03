import type { OperationPlan, RiskTier } from "./types.js";

const RISK_ORDER: readonly RiskTier[] = ["R0", "R1", "R2", "R3", "R4"];

export function compareRisk(a: RiskTier, b: RiskTier): number {
  return RISK_ORDER.indexOf(a) - RISK_ORDER.indexOf(b);
}

export function isMutationRisk(risk: RiskTier): boolean {
  return compareRisk(risk, "R1") >= 0;
}

export function planIntent(intent: string): OperationPlan {
  const normalized = intent.trim().toLowerCase();
  if (["doctor", "inspect", "audit", "audit git", "status"].includes(normalized)) {
    return {
      intent,
      risk: "R0",
      requiredCapabilities: ["git.local.read"],
      preconditions: ["Repository and local Git capability are observable"],
      expectedState: {},
      steps: ["Inspect current state without mutation"],
      recovery: [],
    };
  }

  if (/^(commit|stage|worktree|branch)/.test(normalized)) {
    return {
      intent,
      risk: "R1",
      requiredCapabilities: ["git.local.write"],
      preconditions: ["Writable local repository is isolated and expected state is current"],
      expectedState: {},
      steps: ["Revalidate repository state", "Perform only the planned local mutation", "Verify postcondition"],
      recovery: ["Preserve a recovery reference before destructive variants"],
    };
  }

  if (/^(push|open pr|update pr|comment)/.test(normalized)) {
    return {
      intent,
      risk: "R2",
      requiredCapabilities: ["github.write"],
      preconditions: ["Remote authority and expected head are current"],
      expectedState: {},
      steps: ["Refresh remote state", "Perform scoped shared mutation", "Verify persistence"],
      recovery: ["Use a non-destructive follow-up or revert where applicable"],
    };
  }

  return {
    intent,
    risk: "R3",
    requiredCapabilities: [],
    preconditions: ["Intent is not classified as safe for foundation execution"],
    expectedState: {},
    steps: ["Inspect and classify before any mutation"],
    recovery: ["Escalate or use a provider-specific recovery plan"],
  };
}
