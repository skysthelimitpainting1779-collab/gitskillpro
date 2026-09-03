import { describe, expect, it } from "vitest";
import { classifyPrCiFailure, diagnoseCiBaseline } from "../src/recovery/ci-baseline.js";

const sharedFailure = { check: "verify", category: "workflow", signature: "missing-required-secret" } as const;

describe("recovery CI baseline diagnosis", () => {
  it("identifies a shared default-branch failure before blaming PRs", () => {
    const baseline = diagnoseCiBaseline([
      { id: "main-1", target: "default_branch", conclusion: "failure", fingerprints: [sharedFailure] },
      { id: "main-2", target: "default_branch", conclusion: "failure", fingerprints: [sharedFailure] },
    ]);
    expect(baseline.state).toBe("baseline_broken");

    for (const id of ["pr-1", "pr-2", "pr-3"]) {
      const result = classifyPrCiFailure(
        { id, target: "pull_request", conclusion: "failure", fingerprints: [sharedFailure] },
        baseline,
      );
      expect(result.classification).toBe("baseline_broken");
    }
  });

  it("classifies a unique PR failure when the default branch is healthy", () => {
    const baseline = diagnoseCiBaseline([
      { id: "main-green", target: "default_branch", conclusion: "success", fingerprints: [] },
    ]);
    const result = classifyPrCiFailure(
      { id: "pr-bad", target: "pull_request", conclusion: "failure", fingerprints: [{ check: "unit", category: "test", signature: "expected-2-got-3" }] },
      baseline,
    );
    expect(baseline.state).toBe("healthy");
    expect(result.classification).toBe("pr_specific");
  });

  it("keeps the baseline unknown when current default-branch evidence is insufficient", () => {
    const baseline = diagnoseCiBaseline([]);
    expect(baseline.state).toBe("unknown");
    const result = classifyPrCiFailure(
      { id: "pr-unknown", target: "pull_request", conclusion: "failure", fingerprints: [sharedFailure] },
      baseline,
    );
    expect(result.classification).toBe("unknown");
  });
});
