export type RiskTier = "R0" | "R1" | "R2" | "R3" | "R4";

export type CapabilityId =
  | "fs.read"
  | "fs.write"
  | "fs.persistent"
  | "process.spawn"
  | "shell"
  | "git.local.read"
  | "git.local.write"
  | "git.worktree"
  | "github.read"
  | "github.write"
  | "ci.inspect"
  | "deployment.inspect"
  | "deployment.write"
  | "database.inspect"
  | "database.write"
  | "agent.delegate"
  | "persistence.prove";

export type EnvironmentKind =
  | "local"
  | "worktree"
  | "container"
  | "vps"
  | "ephemeral_sandbox"
  | "ci_runner"
  | "plugin_only"
  | "read_only"
  | "unknown";

export type PersistenceKind = "persistent" | "ephemeral" | "unknown";

export interface EnvironmentSnapshot {
  kind: EnvironmentKind;
  cwd: string;
  persistence: PersistenceKind;
  capabilities: CapabilityId[];
  capturedAt: string;
  gitVersion?: string;
  gitDir?: string;
  gitCommonDir?: string;
  signals: Record<string, string | boolean | number | null>;
}

export interface RemoteSnapshot {
  name: string;
  fetchUrl?: string;
  pushUrl?: string;
}

export interface WorktreeSnapshot {
  path: string;
  headSha: string | null;
  branch: string | null;
  bare?: boolean;
  locked?: boolean;
  prunable?: boolean;
}

export interface RepositorySnapshot {
  root: string;
  gitDir: string;
  commonDir: string;
  branch: string | null;
  headSha: string | null;
  detached: boolean;
  dirty: boolean;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  upstream?: string;
  ahead?: number;
  behind?: number;
  shallow?: boolean;
  gitVersion?: string;
  remotes: RemoteSnapshot[];
  worktrees: WorktreeSnapshot[];
  capturedAt: string;
}

export type OperationIntent = string;

export interface ExpectedState {
  headSha?: string | null;
  baseSha?: string | null;
  prHeadSha?: string | null;
  deploymentRevision?: string | null;
  migrationVersion?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface OperationPlan {
  intent: OperationIntent;
  risk: RiskTier;
  requiredCapabilities: CapabilityId[];
  preconditions: string[];
  expectedState: ExpectedState;
  steps: string[];
  recovery: string[];
}

export interface OperationResult {
  ok: boolean;
  attempted: boolean;
  summary: string;
  details?: Record<string, unknown>;
}

export interface PersistenceProof {
  provider: string;
  reference: string;
  observedAt?: string;
}
