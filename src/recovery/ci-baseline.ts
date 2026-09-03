export interface FailureFingerprint {
  check: string;
  category: string;
  signature: string;
}

export interface CiRunEvidence {
  id: string;
  target: "default_branch" | "pull_request";
  conclusion: "success" | "failure" | "cancelled" | "unknown";
  fingerprints: readonly FailureFingerprint[];
  observedAt?: string;
  sha?: string;
}

export type CiBaselineState = "healthy" | "baseline_broken" | "unknown";

export interface CiBaselineDiagnosis {
  state: CiBaselineState;
  sourceRunId?: string;
  activeFingerprints: FailureFingerprint[];
  reason: string;
}

export type PrCiFailureClassification = "baseline_broken" | "pr_specific" | "unknown" | "not_failing";

export interface PrCiFailureResult {
  classification: PrCiFailureClassification;
  sharedFingerprints: FailureFingerprint[];
  reason: string;
}

function fingerprintKey(fingerprint: FailureFingerprint): string {
  return `${fingerprint.check.trim()}|${fingerprint.category.trim()}|${fingerprint.signature.trim()}`;
}

function newest(runs: readonly CiRunEvidence[]): CiRunEvidence | undefined {
  if (runs.length === 0) return undefined;
  const withTime = runs.filter((run) => run.observedAt);
  if (withTime.length === runs.length) {
    return [...runs].sort((a, b) => (b.observedAt ?? "").localeCompare(a.observedAt ?? ""))[0];
  }
  return runs[0];
}

export function diagnoseCiBaseline(defaultBranchRuns: readonly CiRunEvidence[]): CiBaselineDiagnosis {
  const runs = defaultBranchRuns.filter((run) => run.target === "default_branch");
  const current = newest(runs);
  if (!current) {
    return { state: "unknown", activeFingerprints: [], reason: "No current default-branch CI run evidence was supplied." };
  }

  if (current.conclusion === "success") {
    return { state: "healthy", sourceRunId: current.id, activeFingerprints: [], reason: "The current observed default-branch CI run succeeded." };
  }

  if (current.conclusion === "failure") {
    return {
      state: "baseline_broken",
      sourceRunId: current.id,
      activeFingerprints: current.fingerprints.map((fingerprint) => ({ ...fingerprint })),
      reason: "The current observed default-branch CI run failed; PR failures must be compared against this baseline before source changes are blamed.",
    };
  }

  return {
    state: "unknown",
    sourceRunId: current.id,
    activeFingerprints: [],
    reason: `The current default-branch CI conclusion is ${current.conclusion}; baseline health is not proven.`,
  };
}

export function classifyPrCiFailure(prRun: CiRunEvidence, baseline: CiBaselineDiagnosis): PrCiFailureResult {
  if (prRun.conclusion !== "failure") {
    return { classification: "not_failing", sharedFingerprints: [], reason: `PR run conclusion is ${prRun.conclusion}, not failure.` };
  }

  if (baseline.state === "unknown") {
    return { classification: "unknown", sharedFingerprints: [], reason: "Default-branch CI health is unknown, so PR causality is not safely attributable." };
  }

  const baselineKeys = new Set(baseline.activeFingerprints.map(fingerprintKey));
  const shared = prRun.fingerprints.filter((fingerprint) => baselineKeys.has(fingerprintKey(fingerprint))).map((fingerprint) => ({ ...fingerprint }));

  if (baseline.state === "baseline_broken" && shared.length > 0) {
    return {
      classification: "baseline_broken",
      sharedFingerprints: shared,
      reason: "The PR reproduces one or more active default-branch failure fingerprints.",
    };
  }

  if (baseline.state === "healthy") {
    return {
      classification: "pr_specific",
      sharedFingerprints: [],
      reason: "The current default-branch baseline is healthy and the PR run fails.",
    };
  }

  return {
    classification: "pr_specific",
    sharedFingerprints: [],
    reason: "Default-branch CI is broken, but this PR failure does not match the observed baseline fingerprints and needs separate diagnosis.",
  };
}
