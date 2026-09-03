import { describe, expect, it } from "vitest";
import {
  auditChangeStack,
  auditMergeGroup,
  createChangeManifest,
  isManifestCurrent,
  planRelease,
} from "../src/index.js";

describe("frontier public API acceptance", () => {
  it("invalidates upper evidence when the lower stack changes and keeps merge/release gates separate", () => {
    const baseHead = "a".repeat(40);
    const upperHead = "b".repeat(40);
    const newBaseHead = "c".repeat(40);
    const mergeGroupSha = "d".repeat(40);

    const manifest = createChangeManifest({
      changeId: "upper",
      versionId: "v1",
      headSha: upperHead,
      baseSha: baseHead,
      dependencies: [{ changeId: "base", headSha: baseHead }],
      risk: "R3",
      checkRefs: ["pr-ci:1"],
      independentReviewRefs: ["review:agent-2"],
      recoveryRefs: ["revert:plan"],
      contextPacketHash: "ctx-1",
    });

    expect(isManifestCurrent(manifest, { dependencyHeads: { base: baseHead } }).current).toBe(true);
    expect(isManifestCurrent(manifest, { dependencyHeads: { base: newBaseHead } }).current).toBe(false);

    expect(auditChangeStack({
      layers: [
        { changeId: "base", headSha: baseHead, dependencyHeads: {} },
        { changeId: "upper", headSha: upperHead, dependencyHeads: { base: baseHead } },
      ],
      currentHeads: { base: newBaseHead, upper: upperHead },
    }).current).toBe(false);

    const mergeGroup = auditMergeGroup({
      mergeGroupRequired: true,
      prHeadSha: upperHead,
      mergeGroupSha,
      requiredChecks: ["CI"],
      checks: [{ name: "CI", sha: upperHead, status: "success" }],
    });
    expect(mergeGroup.ready).toBe(false);

    const release = planRelease({
      deploymentHealthy: true,
      deploymentRevision: upperHead,
      currentExposurePercent: 10,
      targetExposurePercent: 100,
      metricsHealthy: true,
    });
    expect(release.releaseComplete).toBe(false);
  });
});
