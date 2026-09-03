export type WorkflowStage =
  | "claimed"
  | "implementing"
  | "local_verified"
  | "pr_open"
  | "in_review"
  | "ci_verified"
  | "merge_ready"
  | "merged"
  | "deploying"
  | "production_verified"
  | "done";

export interface WorkflowProgress {
  claimed?: boolean;
  implementing?: boolean;
  localVerified?: boolean;
  prOpen?: boolean;
  inReview?: boolean;
  ciVerified?: boolean;
  mergeReady?: boolean;
  merged?: boolean;
  deploying?: boolean;
  productionVerified?: boolean;
  done?: boolean;
}

const ORDER: ReadonlyArray<[WorkflowStage, keyof WorkflowProgress]> = [
  ["claimed", "claimed"],
  ["implementing", "implementing"],
  ["local_verified", "localVerified"],
  ["pr_open", "prOpen"],
  ["in_review", "inReview"],
  ["ci_verified", "ciVerified"],
  ["merge_ready", "mergeReady"],
  ["merged", "merged"],
  ["deploying", "deploying"],
  ["production_verified", "productionVerified"],
  ["done", "done"],
];

export function nextWorkflowStage(progress: WorkflowProgress): WorkflowStage | undefined {
  for (const [stage, key] of ORDER) {
    if (progress[key] !== true) return stage;
  }
  return undefined;
}
