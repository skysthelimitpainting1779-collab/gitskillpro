export interface ArtifactProvenanceInput {
  sourceCommitVerified: boolean;
  artifactAttestationRef?: string;
  sbomRef?: string;
  signatureRef?: string;
  requireAttestation?: boolean;
  requireSbom?: boolean;
  requireSignature?: boolean;
}

export interface ProvenanceFinding {
  code: "MISSING_ARTIFACT_ATTESTATION" | "MISSING_SBOM" | "MISSING_ARTIFACT_SIGNATURE";
  observation: string;
}

export interface ArtifactProvenanceResult extends ArtifactProvenanceInput {
  artifactProvenanceVerified: boolean;
  findings: ProvenanceFinding[];
}

export function auditArtifactProvenance(input: ArtifactProvenanceInput): ArtifactProvenanceResult {
  const findings: ProvenanceFinding[] = [];
  if (input.requireAttestation && !input.artifactAttestationRef?.trim()) {
    findings.push({ code: "MISSING_ARTIFACT_ATTESTATION", observation: "Artifact attestation is required but not proven." });
  }
  if (input.requireSbom && !input.sbomRef?.trim()) {
    findings.push({ code: "MISSING_SBOM", observation: "SBOM evidence is required but not proven." });
  }
  if (input.requireSignature && !input.signatureRef?.trim()) {
    findings.push({ code: "MISSING_ARTIFACT_SIGNATURE", observation: "Artifact signature evidence is required but not proven." });
  }
  return {
    ...input,
    artifactProvenanceVerified: findings.length === 0,
    findings,
  };
}
