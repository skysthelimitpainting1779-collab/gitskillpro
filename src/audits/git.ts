import type { RepositorySnapshot, WorktreeSnapshot } from "../core/types.js";

export type FindingSeverity = "info" | "warning" | "error";

export interface GitFinding {
  code: string;
  severity: FindingSeverity;
  observation: string;
  recommendation: string;
  evidence?: Record<string, unknown>;
}

export interface GitAuditResult {
  healthy: boolean;
  findings: GitFinding[];
}

export type GitAuditInput = Pick<RepositorySnapshot, "branch" | "headSha" | "dirty" | "detached" | "worktrees"> & Partial<RepositorySnapshot>;

function duplicateWorktreeBranches(worktrees: WorktreeSnapshot[]): string[] {
  const counts = new Map<string, number>();
  for (const worktree of worktrees) {
    if (!worktree.branch) continue;
    counts.set(worktree.branch, (counts.get(worktree.branch) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([branch]) => branch);
}

export function auditGit(snapshot: GitAuditInput): GitAuditResult {
  const findings: GitFinding[] = [];

  if (snapshot.dirty) {
    findings.push({
      code: "UNEXPLAINED_DIRTY_WORK",
      severity: "warning",
      observation: "The working tree contains changes whose ownership is not proven by this snapshot.",
      recommendation: "Identify the owner and intent of each change before staging, stashing, overwriting, cleaning, or integrating anything.",
    });
  }

  if (snapshot.detached) {
    findings.push({
      code: "DETACHED_HEAD",
      severity: "warning",
      observation: `HEAD is detached at ${snapshot.headSha ?? "an unborn/unknown commit"}.`,
      recommendation: "Resolve the intended integration branch before authoring durable commits.",
    });
  }

  if (snapshot.branch && snapshot.upstream === undefined) {
    findings.push({
      code: "NO_UPSTREAM",
      severity: "info",
      observation: `Branch ${snapshot.branch} has no observed upstream tracking branch.`,
      recommendation: "Confirm whether the branch is intentionally local before planning remote synchronization.",
    });
  }

  if (snapshot.shallow === true) {
    findings.push({
      code: "SHALLOW_REPOSITORY",
      severity: "warning",
      observation: "The repository is shallow; ancestry/history analysis may be incomplete.",
      recommendation: "Do not make history-dependent recovery or merge-base claims until enough history is available.",
    });
  }

  if (!snapshot.gitVersion) {
    findings.push({
      code: "GIT_VERSION_UNKNOWN",
      severity: "info",
      observation: "Git version was not observed.",
      recommendation: "Feature-detect version-sensitive primitives before relying on them.",
    });
  }

  const duplicateBranches = duplicateWorktreeBranches(snapshot.worktrees ?? []);
  for (const branch of duplicateBranches) {
    findings.push({
      code: "DUPLICATE_WORKTREE_BRANCH",
      severity: "warning",
      observation: `Branch ${branch} appears writable from more than one worktree.`,
      recommendation: "Treat branch ownership as conflicted until the worktree topology is reconciled.",
      evidence: { branch },
    });
  }

  return {
    healthy: findings.every((finding) => finding.severity !== "error" && finding.code !== "UNEXPLAINED_DIRTY_WORK" && finding.code !== "DETACHED_HEAD" && finding.code !== "DUPLICATE_WORKTREE_BRANCH"),
    findings,
  };
}
