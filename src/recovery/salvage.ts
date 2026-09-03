import type { RecoveryClassification } from "./types.js";

export type SalvageStrategy =
  | "fresh_branch_cherry_pick"
  | "patch_selected"
  | "reimplement_current_spec"
  | "rerun_after_baseline"
  | "hold_unknown"
  | "no_salvage";

export interface SalvageInput {
  artifactId: string;
  classifications: readonly RecoveryClassification[];
  selectedCommits?: string[];
  selectedFiles?: string[];
  architectureCurrent?: boolean;
  evidenceComplete: boolean;
}

export interface SalvagePlan {
  artifactId: string;
  strategy: SalvageStrategy;
  selectedCommits: string[];
  selectedFiles: string[];
  steps: string[];
  requiredValidation: string[];
  reason: string;
}

export function planSalvage(input: SalvageInput): SalvagePlan {
  const labels = new Set(input.classifications);
  const selectedCommits = [...(input.selectedCommits ?? [])];
  const selectedFiles = [...(input.selectedFiles ?? [])];
  const base = {
    artifactId: input.artifactId,
    selectedCommits,
    selectedFiles,
  };

  if (labels.has("unsafe_to_salvage")) {
    return {
      ...base,
      strategy: "no_salvage",
      steps: ["Preserve the artifact and its evidence; do not integrate it."],
      requiredValidation: ["Resolve or explicitly accept the safety finding before reconsidering salvage"],
      reason: "The artifact is explicitly classified unsafe to salvage.",
    };
  }

  if (!input.evidenceComplete || labels.has("unknown")) {
    return {
      ...base,
      strategy: "hold_unknown",
      steps: ["Preserve the artifact", "Acquire the missing identity, dependency, diff, CI or architecture evidence", "Reclassify before mutation"],
      requiredValidation: ["Evidence gap is resolved"],
      reason: "Available evidence is insufficient for a safe salvage decision.",
    };
  }

  if (labels.has("failed_baseline_ci") && !labels.has("failed_pr_specific")) {
    return {
      ...base,
      strategy: "rerun_after_baseline",
      steps: ["Repair and prove the default-branch CI baseline", "Re-run the artifact against the trusted baseline", "Reclassify any remaining failures"],
      requiredValidation: ["Default-branch CI is healthy", "Fresh PR checks are evaluated"],
      reason: "The material failure is attributed to the shared CI baseline rather than the change.",
    };
  }

  if (input.architectureCurrent === false) {
    return {
      ...base,
      strategy: "reimplement_current_spec",
      steps: ["Create a fresh branch from the current trusted base", "Re-read the current work-item acceptance criteria", "Reimplement the desired behavior using the current architecture", "Use old code only as evidence/reference"],
      requiredValidation: ["Current acceptance criteria pass", "No obsolete architectural dependency was reintroduced"],
      reason: "The old implementation targets an obsolete architecture, so direct integration is riskier than reimplementation.",
    };
  }

  if (selectedCommits.length > 0) {
    return {
      ...base,
      strategy: "fresh_branch_cherry_pick",
      steps: ["Create a fresh branch/worktree from the current trusted base", "Inspect each selected commit independently", "Cherry-pick only the selected commits", "Resolve conflicts using current intent and tests", "Review the resulting diff as a new integration candidate"],
      requiredValidation: ["Selected commits are still required", "Resulting diff passes current verification", "No stale branch-only state was imported"],
      reason: "Specific useful commits are identified and can be selectively replayed onto a fresh base.",
    };
  }

  if (selectedFiles.length > 0) {
    return {
      ...base,
      strategy: "patch_selected",
      steps: ["Create a fresh branch/worktree from the current trusted base", "Inspect selected files/hunks", "Apply only required changes", "Review the resulting diff against current intent"],
      requiredValidation: ["Selected changes are behaviorally required", "Current tests and acceptance criteria pass"],
      reason: "Useful work is identified at file/hunk granularity rather than as safe replayable commits.",
    };
  }

  if (labels.has("salvageable")) {
    return {
      ...base,
      strategy: "reimplement_current_spec",
      steps: ["Create a fresh branch from the current trusted base", "Use the artifact as implementation evidence", "Recreate only behavior required by the current work item"],
      requiredValidation: ["Current acceptance criteria pass", "Fresh diff receives independent review"],
      reason: "The artifact contains useful evidence but no safe selective replay unit is identified.",
    };
  }

  return {
    ...base,
    strategy: "no_salvage",
    steps: ["Preserve the artifact for history; no integration action is recommended."],
    requiredValidation: [],
    reason: "No evidence-backed salvage requirement is present.",
  };
}
