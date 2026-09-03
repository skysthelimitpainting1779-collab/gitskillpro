import type { AutomationActor, AutomationAuthority, AutomationObservedOperation } from "../automation/types.js";

export type AutomationFindingSeverity = "info" | "warning" | "error";

export interface AutomationFinding {
  code: string;
  severity: AutomationFindingSeverity;
  actorId?: string;
  observation: string;
  recommendation: string;
  evidence?: Record<string, unknown>;
}

export interface AutomationAuditInput {
  actors: AutomationActor[];
  sharedWritableWorktree: boolean;
  defaultBranch: string;
  changedPaths?: string[];
  unknownWriterRisk?: boolean;
  bypassHooks?: boolean;
}

export interface AutomationAuditResult {
  safeForAutomaticCommit: boolean;
  findings: AutomationFinding[];
}

const OP_AUTHORITY: Partial<Record<AutomationObservedOperation, AutomationAuthority>> = {
  stage: "auto-stage",
  commit: "auto-commit",
  amend: "auto-commit",
  push: "auto-push",
  "force-push": "auto-push",
  pr: "auto-pr",
  review: "auto-review",
  merge: "auto-merge",
  deploy: "auto-deploy",
};

function sensitive(path: string): boolean {
  const normalized = path.replace(/\\/g, "/").toLowerCase();
  return /(^|\/)(?:\.env(?:\.|$)|id_rsa$|id_ed25519$|credentials?(?:\.|$)|secrets?(?:\.|$)|\.npmrc$|\.pypirc$|service-account(?:\.|$))/.test(normalized);
}

function canWrite(actor: AutomationActor): boolean {
  return actor.authorities.includes("auto-stage") || actor.authorities.includes("auto-commit") || actor.authorities.includes("auto-push") || (actor.observedOperations?.length ?? 0) > 0;
}

export function auditAutomation(input: AutomationAuditInput): AutomationAuditResult {
  const findings: AutomationFinding[] = [];

  if (input.unknownWriterRisk) {
    findings.push({
      code: "UNKNOWN_BACKGROUND_WRITER",
      severity: "error",
      observation: "An active or configured repository writer has not been assigned a trusted automation identity/scope.",
      recommendation: "Identify or isolate the writer before automated staging, commit, recovery cleanup, or integration.",
    });
  }

  if (input.bypassHooks) {
    findings.push({
      code: "HOOK_BYPASS",
      severity: "error",
      observation: "Automation is configured to bypass repository hooks/verification.",
      recommendation: "Diagnose the hook or establish explicit policy justification; do not use hook bypass as the default fix.",
    });
  }

  for (const actor of input.actors) {
    if (input.sharedWritableWorktree && (actor.authorities.includes("auto-commit") || actor.observedOperations?.includes("commit"))) {
      findings.push({
        code: "AUTO_COMMIT_SHARED_WORKTREE",
        severity: "error",
        actorId: actor.id,
        observation: `Actor ${actor.id} can commit while the writable worktree is shared.`,
        recommendation: "Disable automatic commits or move the actor into an isolated worktree with explicit coordination.",
      });
    }

    if (actor.stagePolicy === "broad") {
      findings.push({
        code: "BROAD_AUTO_STAGE",
        severity: input.sharedWritableWorktree ? "error" : "warning",
        actorId: actor.id,
        observation: `Actor ${actor.id} uses broad/repository-wide staging.`,
        recommendation: "Prefer explicit path staging and verify the staged diff before commit.",
      });
    }

    if (input.changedPaths?.some(sensitive) && canWrite(actor) && (!actor.allowedPaths?.length || actor.allowedPaths.includes("**"))) {
      findings.push({
        code: "SENSITIVE_PATH_IN_AUTOMATION_SCOPE",
        severity: "error",
        actorId: actor.id,
        observation: `Sensitive-looking changed paths are inside the effective automation staging scope.`,
        recommendation: "Exclude credentials/local configuration and use an explicit allowlist owned by the automation actor.",
        evidence: { sensitivePaths: input.changedPaths.filter(sensitive) },
      });
    }

    const configured = new Set(actor.authorities);
    for (const operation of actor.observedOperations ?? []) {
      const required = OP_AUTHORITY[operation];
      if (required && !configured.has(required)) {
        findings.push({
          code: "OBSERVED_AUTHORITY_ESCALATION",
          severity: "error",
          actorId: actor.id,
          observation: `Actor ${actor.id} was observed performing ${operation} without configured ${required} authority.`,
          recommendation: "Stop the actor and reconcile its real capabilities with explicit policy before further automated writes.",
          evidence: { operation, requiredAuthority: required },
        });
      }
    }

    const defaultAllowed = actor.allowedBranches?.includes(input.defaultBranch) ?? false;
    const pushes = actor.authorities.includes("auto-push") || actor.observedOperations?.some((op) => op === "push" || op === "force-push");
    if (pushes && defaultAllowed) {
      findings.push({
        code: "AUTOMATION_DEFAULT_BRANCH_PUSH",
        severity: "error",
        actorId: actor.id,
        observation: `Actor ${actor.id} can target default branch ${input.defaultBranch} with a background push.`,
        recommendation: "Use task/release branches and PR integration unless an explicit protected-branch policy authorizes direct automation pushes.",
      });
    }

    if (actor.observedOperations?.includes("force-push") || actor.pushPolicy === "rewrite") {
      findings.push({
        code: "AUTOMATION_FORCE_PUSH",
        severity: "error",
        actorId: actor.id,
        observation: `Actor ${actor.id} can rewrite remote history.`,
        recommendation: "Deny background force push by default; require a separate high-risk history-rewrite policy and expected remote ref.",
      });
    }

    if ((actor.authorities.includes("auto-commit") || actor.authorities.includes("auto-push")) && actor.expectedStatePolicy !== "required") {
      findings.push({
        code: "MISSING_AUTOMATION_EXPECTED_STATE",
        severity: "warning",
        actorId: actor.id,
        observation: `Actor ${actor.id} does not require optimistic expected-state evidence before repository mutation.`,
        recommendation: "Require expected HEAD/branch/path or remote-ref evidence before commit/push.",
      });
    }
  }

  return {
    safeForAutomaticCommit: !findings.some((finding) => finding.severity === "error"),
    findings,
  };
}
