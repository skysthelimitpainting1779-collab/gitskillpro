import type { CompletionGate, ProjectWorkflowPolicy, WorkItem } from "./types.js";

export interface WorkflowFinding {
  code: string;
  severity: "info" | "warning" | "error";
  observation: string;
}

export interface ReadinessAssessment {
  ready: boolean;
  findings: WorkflowFinding[];
}

export interface CompletionState {
  merged?: boolean;
  deployed?: boolean;
  databaseVerified?: boolean;
  productionVerified?: boolean;
  documentation?: boolean;
  released?: boolean;
}

export interface CompletionAssessment {
  complete: boolean;
  missing: CompletionGate[];
}

export function assessReadiness(item: WorkItem, policy: ProjectWorkflowPolicy): ReadinessAssessment {
  const findings: WorkflowFinding[] = [];

  if (policy.requireAcceptanceCriteria && (!item.acceptanceCriteria || item.acceptanceCriteria.length === 0)) {
    findings.push({
      code: "MISSING_ACCEPTANCE_CRITERIA",
      severity: "error",
      observation: `Work item ${item.id} has no acceptance criteria.`
    });
  }

  if (policy.requireRepository && !item.repository) {
    findings.push({
      code: "MISSING_REPOSITORY",
      severity: "error",
      observation: `Work item ${item.id} has no resolved repository identity.`
    });
  }

  if ((policy.requireNoBlockers ?? true) && item.blockers.length > 0) {
    findings.push({
      code: "BLOCKED_DEPENDENCY",
      severity: "error",
      observation: `Work item ${item.id} is blocked by: ${item.blockers.join(", ")}.`
    });
  }

  return { ready: findings.every((finding) => finding.severity !== "error"), findings };
}

function gateSatisfied(gate: CompletionGate, state: CompletionState): boolean {
  switch (gate) {
    case "merged": return state.merged === true;
    case "deployed": return state.deployed === true;
    case "database_verified": return state.databaseVerified === true;
    case "production_verified": return state.productionVerified === true;
    case "documentation": return state.documentation === true;
    case "release": return state.released === true;
  }
}

export function assessCompletion(state: CompletionState, policy: Pick<ProjectWorkflowPolicy, "completionRequires">): CompletionAssessment {
  const missing = policy.completionRequires.filter((gate) => !gateSatisfied(gate, state));
  return { complete: missing.length === 0, missing };
}
