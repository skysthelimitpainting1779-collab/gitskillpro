import { createHash } from "node:crypto";

export type PolicyResult = "allow" | "deny" | "unknown";

export interface PolicyEvidenceInput {
  policyId: string;
  policyVersion: string;
  inputHash: string;
  result: PolicyResult;
  reasons?: string[];
  reference?: string;
}

export interface PolicyEvidence extends PolicyEvidenceInput {
  reasons: string[];
  fingerprint: string;
}

export function createPolicyEvidence(input: PolicyEvidenceInput): PolicyEvidence {
  const policyId = input.policyId.trim();
  const policyVersion = input.policyVersion.trim();
  const inputHash = input.inputHash.trim();
  if (!policyId || !policyVersion || !inputHash) throw new Error("Policy evidence requires policyId, policyVersion and inputHash");
  const reasons = [...new Set((input.reasons ?? []).map((reason) => reason.trim()).filter(Boolean))];
  const canonical = JSON.stringify({ policyId, policyVersion, inputHash, result: input.result, reasons, reference: input.reference?.trim() || undefined });
  return {
    ...input,
    policyId,
    policyVersion,
    inputHash,
    reasons,
    reference: input.reference?.trim() || undefined,
    fingerprint: `sha256:${createHash("sha256").update(canonical).digest("hex")}`,
  };
}
