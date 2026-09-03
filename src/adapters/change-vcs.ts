export type NormalizedConflictState = "clean" | "conflicted" | "unknown";

export type VcsChangeInput =
  | {
      kind: "git";
      logicalChangeId?: string;
      commitSha: string;
      active: boolean;
      conflictState?: NormalizedConflictState;
    }
  | {
      kind: "jujutsu";
      changeId: string;
      commitId: string;
      active: boolean;
      conflictState?: NormalizedConflictState;
    };

export interface NormalizedVcsChange {
  vcs: "git" | "jujutsu";
  logicalChangeId: string;
  physicalCommitSha: string;
  active: boolean;
  conflictState: NormalizedConflictState;
  safeToIntegrate: boolean;
}

function validCommit(value: string): boolean {
  return /^[0-9a-f]{40,64}$/i.test(value);
}

export function normalizeVcsChange(input: VcsChangeInput): NormalizedVcsChange {
  if (input.kind === "git") {
    const logicalChangeId = input.logicalChangeId?.trim();
    if (!logicalChangeId) throw new Error("Plain Git evidence requires a caller-proven logical Change ID; commit SHA alone is not stable logical identity");
    if (!validCommit(input.commitSha)) throw new Error("Invalid Git commit SHA");
    const conflictState = input.conflictState ?? "unknown";
    return {
      vcs: "git",
      logicalChangeId,
      physicalCommitSha: input.commitSha,
      active: input.active,
      conflictState,
      safeToIntegrate: conflictState === "clean",
    };
  }

  const logicalChangeId = input.changeId.trim();
  if (!logicalChangeId) throw new Error("Jujutsu evidence requires a stable change ID");
  if (!validCommit(input.commitId)) throw new Error("Invalid physical Jujutsu commit ID");
  const conflictState = input.conflictState ?? "unknown";
  return {
    vcs: "jujutsu",
    logicalChangeId,
    physicalCommitSha: input.commitId,
    active: input.active,
    conflictState,
    safeToIntegrate: conflictState === "clean",
  };
}
