export interface IdempotencyInput {
  inputHash: string;
  firstOutputHash: string;
  secondOutputHash: string;
}

export interface IdempotencyFinding {
  code: "NON_IDEMPOTENT_AUTOMATION";
  observation: string;
  recommendation: string;
}

export interface IdempotencyResult {
  idempotent: boolean;
  inputHash: string;
  firstOutputHash: string;
  secondOutputHash: string;
  finding?: IdempotencyFinding;
}

export function verifyIdempotency(input: IdempotencyInput): IdempotencyResult {
  for (const [name, value] of Object.entries(input)) {
    if (!value.trim()) throw new Error(`${name} is required`);
  }
  const idempotent = input.firstOutputHash === input.secondOutputHash;
  return {
    ...input,
    idempotent,
    finding: idempotent ? undefined : {
      code: "NON_IDEMPOTENT_AUTOMATION",
      observation: "Repeated execution with the same input identity produced a different semantic output hash.",
      recommendation: "Remove nondeterministic/generated churn or document and separately authorize the non-idempotent behavior before auto-commit loops are enabled.",
    },
  };
}
