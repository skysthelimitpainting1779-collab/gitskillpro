import type { ExpectedState, PersistenceProof, RiskTier } from "./types.js";

export type EvidenceStage = "observed" | "planned" | "attempted" | "verified";

export interface EvidenceObservation {
  source: string;
  fact: string;
  reference?: string;
  observedAt: string;
}

export interface EvidenceAttempt {
  action: string;
  ok: boolean;
  summary: string;
  attemptedAt: string;
}

export interface EvidenceVerification {
  check: string;
  ok: boolean;
  reference?: string;
  verifiedAt: string;
}

export interface EvidencePacket {
  operationId: string;
  intent: string;
  createdAt: string;
  stage: EvidenceStage;
  risk?: RiskTier;
  expectedState: ExpectedState;
  observations: EvidenceObservation[];
  attempts: EvidenceAttempt[];
  verification: EvidenceVerification[];
  unknowns: string[];
  recovery: string[];
  persistence?: PersistenceProof;
}

export interface NewEvidenceInput {
  operationId: string;
  intent: string;
  risk?: RiskTier;
  expectedState?: ExpectedState;
}

export function createEvidencePacket(input: NewEvidenceInput): EvidencePacket {
  if (!input.operationId.trim()) throw new Error("operationId is required");
  if (!input.intent.trim()) throw new Error("intent is required");
  return {
    operationId: input.operationId,
    intent: input.intent,
    createdAt: new Date().toISOString(),
    stage: "observed",
    risk: input.risk,
    expectedState: { ...(input.expectedState ?? {}) },
    observations: [],
    attempts: [],
    verification: [],
    unknowns: [],
    recovery: [],
  };
}

export function recordObservation(packet: EvidencePacket, observation: Omit<EvidenceObservation, "observedAt"> & { observedAt?: string }): EvidencePacket {
  return {
    ...packet,
    observations: [...packet.observations, { ...observation, observedAt: observation.observedAt ?? new Date().toISOString() }],
  };
}

export function recordAttempt(packet: EvidencePacket, attempt: Omit<EvidenceAttempt, "attemptedAt"> & { attemptedAt?: string }): EvidencePacket {
  return {
    ...packet,
    stage: "attempted",
    attempts: [...packet.attempts, { ...attempt, attemptedAt: attempt.attemptedAt ?? new Date().toISOString() }],
  };
}

export function recordVerification(packet: EvidencePacket, verification: Omit<EvidenceVerification, "verifiedAt"> & { verifiedAt?: string }): EvidencePacket {
  return {
    ...packet,
    stage: verification.ok ? "verified" : packet.stage,
    verification: [...packet.verification, { ...verification, verifiedAt: verification.verifiedAt ?? new Date().toISOString() }],
  };
}

export function recordPersistenceProof(packet: EvidencePacket, proof: PersistenceProof): EvidencePacket {
  if (!proof.provider.trim()) throw new Error("Persistence proof provider is required");
  if (!proof.reference.trim()) throw new Error("Persistence proof reference is required");
  return {
    ...packet,
    persistence: { ...proof, observedAt: proof.observedAt ?? new Date().toISOString() },
  };
}

export function isExpectedStateCurrent(expected: ExpectedState, actual: ExpectedState): boolean {
  return Object.entries(expected).every(([key, value]) => value === undefined || actual[key] === value);
}
