import type { CapabilityId, RiskTier } from "../core/types.js";

export type DelegationMode = "local_worktree" | "remote_branch" | "unavailable";

export interface DelegationPlanInput {
  issueId: string;
  title: string;
  capabilities: readonly CapabilityId[];
}

export interface DelegationPlan {
  mode: DelegationMode;
  branch: string;
  risk: RiskTier;
  requiredCapabilities: CapabilityId[];
  evidenceChecklist: string[];
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function createTaskBranchName(issueId: string, title: string): string {
  const id = slug(issueId).slice(0, 40) || "task";
  const titleSlug = slug(title).slice(0, 64);
  return titleSlug ? `${id}-${titleSlug}` : id;
}

export function planDelegation(input: DelegationPlanInput): DelegationPlan {
  const capabilities = new Set(input.capabilities);
  const branch = createTaskBranchName(input.issueId, input.title);

  if (capabilities.has("git.local.write") && capabilities.has("git.worktree") && capabilities.has("fs.persistent")) {
    return {
      mode: "local_worktree",
      branch,
      risk: "R1",
      requiredCapabilities: ["git.local.write", "git.worktree", "fs.persistent"],
      evidenceChecklist: [
        "Base ref and SHA are current",
        "Target branch is unused",
        "Destination path is unused",
        "Work-graph concurrency is independently safe before multiple agents write",
      ],
    };
  }

  if (capabilities.has("github.write")) {
    return {
      mode: "remote_branch",
      branch,
      risk: "R2",
      requiredCapabilities: ["github.write"],
      evidenceChecklist: [
        "Remote base/head state is current",
        "Remote task branch ownership is advisory rather than a lock",
        "Local worktree isolation is unavailable or unproven",
      ],
    };
  }

  return {
    mode: "unavailable",
    branch,
    risk: "R0",
    requiredCapabilities: [],
    evidenceChecklist: ["No safe writable delegation capability is currently proven"],
  };
}
