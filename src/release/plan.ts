export interface ReleasePlanInput {
  deploymentHealthy: boolean;
  deploymentRevision: string;
  currentExposurePercent: number;
  targetExposurePercent: number;
  featureFlagId?: string;
  metricsHealthy?: boolean;
}

export type ReleaseStepKind = "verify_deployment" | "observe_metrics" | "increase_exposure" | "complete_release" | "rollback_or_pause";

export interface ReleaseStep {
  kind: ReleaseStepKind;
  reason: string;
  targetExposurePercent?: number;
}

export interface ReleasePlanResult extends ReleasePlanInput {
  blocked: boolean;
  releaseComplete: boolean;
  steps: ReleaseStep[];
}

function percent(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 100) throw new Error(`${name} must be between 0 and 100`);
  return value;
}

export function planRelease(input: ReleasePlanInput): ReleasePlanResult {
  const currentExposurePercent = percent(input.currentExposurePercent, "currentExposurePercent");
  const targetExposurePercent = percent(input.targetExposurePercent, "targetExposurePercent");
  if (targetExposurePercent < currentExposurePercent) throw new Error("targetExposurePercent cannot be lower than current exposure in a promotion plan");
  const steps: ReleaseStep[] = [];

  if (!input.deploymentHealthy) {
    steps.push({ kind: "verify_deployment", reason: "Deployment health must be proven before release exposure increases." });
    return { ...input, currentExposurePercent, targetExposurePercent, blocked: true, releaseComplete: false, steps };
  }

  if (input.metricsHealthy === false) {
    steps.push({ kind: "rollback_or_pause", reason: "Observed rollout metrics are unhealthy; pause exposure or execute the release recovery plan." });
    return { ...input, currentExposurePercent, targetExposurePercent, blocked: true, releaseComplete: false, steps };
  }

  if (input.metricsHealthy === undefined && currentExposurePercent > 0 && currentExposurePercent < targetExposurePercent) {
    steps.push({ kind: "observe_metrics", reason: "Current exposure exists but health metrics are not yet proven for further promotion." });
    return { ...input, currentExposurePercent, targetExposurePercent, blocked: true, releaseComplete: false, steps };
  }

  if (currentExposurePercent < targetExposurePercent) {
    steps.push({ kind: "increase_exposure", reason: "Deployment is healthy and rollout evidence permits the next exposure target.", targetExposurePercent });
    steps.push({ kind: "observe_metrics", reason: "Observe release-specific metrics after exposure changes before declaring completion." });
    return { ...input, currentExposurePercent, targetExposurePercent, blocked: false, releaseComplete: false, steps };
  }

  steps.push({ kind: "complete_release", reason: "Target exposure is reached and deployment/metrics evidence is healthy." });
  return { ...input, currentExposurePercent, targetExposurePercent, blocked: false, releaseComplete: true, steps };
}
