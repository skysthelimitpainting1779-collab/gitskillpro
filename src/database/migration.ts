export type MigrationPhase = "expand" | "deploy_compatible_code" | "backfill" | "contract";
export type RollbackCompatibility = "compatible" | "incompatible" | "unknown";

export interface MigrationSequenceInput {
  hasExpandStep: boolean;
  hasBackfill: boolean;
  hasContractStep: boolean;
  rollbackCompatibility: RollbackCompatibility;
}

export interface MigrationSequenceFinding {
  code: "ROLLBACK_COMPATIBILITY_UNKNOWN" | "ROLLBACK_INCOMPATIBLE" | "CONTRACT_WITHOUT_COMPATIBILITY_WINDOW";
  observation: string;
}

export interface MigrationSequencePlan {
  order: MigrationPhase[];
  findings: MigrationSequenceFinding[];
  safeToProceed: boolean;
}

export function planMigrationSequence(input: MigrationSequenceInput): MigrationSequencePlan {
  const order: MigrationPhase[] = [];
  const findings: MigrationSequenceFinding[] = [];

  if (input.hasExpandStep) order.push("expand");
  if (input.hasExpandStep || input.hasBackfill || input.hasContractStep) order.push("deploy_compatible_code");
  if (input.hasBackfill) order.push("backfill");
  if (input.hasContractStep) order.push("contract");

  if (input.rollbackCompatibility === "unknown") {
    findings.push({ code: "ROLLBACK_COMPATIBILITY_UNKNOWN", observation: "Code/schema rollback compatibility is not proven." });
  } else if (input.rollbackCompatibility === "incompatible") {
    findings.push({ code: "ROLLBACK_INCOMPATIBLE", observation: "Evidence says rollback to the older application/schema combination is incompatible." });
  }

  if (input.hasContractStep && !input.hasExpandStep && !input.hasBackfill) {
    findings.push({
      code: "CONTRACT_WITHOUT_COMPATIBILITY_WINDOW",
      observation: "A contract/removal step is planned without an explicit expand/backfill compatibility window.",
    });
  }

  return {
    order,
    findings,
    safeToProceed: !findings.some((finding) => finding.code === "ROLLBACK_INCOMPATIBLE" || finding.code === "CONTRACT_WITHOUT_COMPATIBILITY_WINDOW"),
  };
}
