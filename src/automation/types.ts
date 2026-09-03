export type AutomationAuthority =
  | "auto-stage"
  | "auto-commit"
  | "auto-push"
  | "auto-pr"
  | "auto-review"
  | "auto-merge"
  | "auto-deploy";

export type AutomationOperation = AutomationAuthority | "checkpoint-commit";

export type AutomationObservedOperation = "stage" | "commit" | "amend" | "push" | "force-push" | "pr" | "review" | "merge" | "tag" | "release" | "deploy";

export type AutomationActorKind =
  | "checkpoint"
  | "generator"
  | "formatter"
  | "hook"
  | "watcher"
  | "ci-bot"
  | "dependency-bot"
  | "release-bot"
  | "sync-bot"
  | "hosted-agent"
  | "ide-plugin"
  | "unknown";

export interface AutomationActor {
  id: string;
  kind: AutomationActorKind;
  source: string;
  trigger: string;
  authorities: AutomationAuthority[];
  observedOperations?: AutomationObservedOperation[];
  identity?: string;
  runtimeEnvironment?: string;
  credentialScope?: string[];
  repositoryScope?: string[];
  allowedBranches?: string[];
  allowedPaths?: string[];
  stagePolicy?: "explicit" | "broad" | "none" | "unknown";
  commitPolicy?: "checkpoint" | "semantic" | "generated" | "release" | "sync" | "unknown";
  pushPolicy?: "none" | "normal" | "rewrite" | "unknown";
  requireIsolatedWorktree?: boolean;
  expectedStatePolicy?: "required" | "optional" | "unknown";
  concurrencyPolicy?: "isolated" | "locked" | "shared" | "unknown";
  loopPrevention?: string[];
  idempotencyExpectation?: "required" | "preferred" | "not_applicable" | "unknown";
  verification?: string[];
  recovery?: string[];
}

export interface AutomationScope {
  branch?: string;
  paths?: string[];
  isolatedWorktree?: boolean;
}

export interface AutomationAuthorityDecision {
  allowed: boolean;
  required: AutomationAuthority[];
  missing: AutomationAuthority[];
  reasons: string[];
}
