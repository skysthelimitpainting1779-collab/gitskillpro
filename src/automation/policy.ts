import type {
  AutomationActor,
  AutomationAuthority,
  AutomationAuthorityDecision,
  AutomationOperation,
  AutomationScope,
} from "./types.js";

function requiredFor(operation: AutomationOperation): AutomationAuthority[] {
  if (operation === "checkpoint-commit") return ["auto-stage", "auto-commit"];
  return [operation];
}

function globToRegExp(pattern: string): RegExp {
  let source = "^";
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i]!;
    if (char === "*") {
      if (pattern[i + 1] === "*") {
        source += ".*";
        i += 1;
      } else {
        source += "[^/]*";
      }
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`${source}$`);
}

function matchesAny(value: string, patterns: string[] | undefined): boolean {
  if (!patterns?.length) return false;
  return patterns.some((pattern) => globToRegExp(pattern).test(value));
}

export function evaluateAutomationAuthority(
  actor: AutomationActor,
  operation: AutomationOperation,
  scope: AutomationScope = {},
): AutomationAuthorityDecision {
  const required = requiredFor(operation);
  const authoritySet = new Set(actor.authorities);
  const missing = required.filter((capability) => !authoritySet.has(capability));
  const reasons: string[] = [];

  if (missing.length) reasons.push(`Missing automation authority: ${missing.join(", ")}`);

  if (scope.branch !== undefined && actor.allowedBranches?.length) {
    if (!matchesAny(scope.branch, actor.allowedBranches)) {
      reasons.push(`Branch ${scope.branch} is outside actor ${actor.id} allowlist.`);
    }
  }

  if (scope.paths?.length) {
    if (!actor.allowedPaths?.length) {
      reasons.push(`Actor ${actor.id} has no explicit path allowlist for requested paths.`);
    } else {
      const outside = scope.paths.filter((path) => !matchesAny(path, actor.allowedPaths));
      if (outside.length) reasons.push(`Paths outside actor ${actor.id} allowlist: ${outside.join(", ")}`);
    }
  }

  if (operation === "checkpoint-commit" && actor.requireIsolatedWorktree && scope.isolatedWorktree !== true) {
    reasons.push(`Actor ${actor.id} requires an isolated worktree for checkpoint commits.`);
  }

  return { allowed: missing.length === 0 && reasons.length === 0, required, missing, reasons };
}
