export type ProviderKind =
  | "github"
  | "gitlab"
  | "vercel"
  | "cloudflare"
  | "hostinger_horizons"
  | "hostinger_vps"
  | "netlify"
  | "railway"
  | "render"
  | "fly"
  | "aws"
  | "gcp"
  | "azure"
  | "docker"
  | "kubernetes"
  | "supabase"
  | "neon"
  | "postgres"
  | "mysql"
  | "sqlite"
  | "libsql"
  | "turso"
  | "d1"
  | "mongodb"
  | "redis"
  | "upstash"
  | "convex"
  | "firestore"
  | "dynamodb"
  | "unknown";

export type ProviderCapability =
  | "scm.read"
  | "scm.write"
  | "ci.read"
  | "ci.rerun"
  | "deployment.read"
  | "deployment.write"
  | "runtime.read"
  | "database.read"
  | "database.write"
  | "logs.read"
  | "domains.read"
  | "rules.read"
  | "secrets.metadata.read";

export type EvidenceStatus = "proven" | "partial" | "unknown" | "unavailable";

export interface SecretMetadata {
  name: string;
  present?: boolean;
  scope?: string;
}

export interface ProviderObservation {
  provider: ProviderKind;
  domain: "scm" | "ci" | "deployment" | "database" | "runtime";
  evidenceStatus: EvidenceStatus;
  observedAt?: string;
  references?: string[];
}

export type CiStatus = "success" | "failure" | "pending" | "cancelled" | "unknown";

export interface CiSnapshot extends ProviderObservation {
  domain: "ci";
  status: CiStatus;
  sha?: string;
  workflow?: string;
  runId?: string;
  failedSteps?: Array<{
    name: string;
    category?: string;
    logExcerpt?: string;
  }>;
}

export type DeploymentStatus = "queued" | "building" | "success" | "failure" | "cancelled" | "unknown";

export interface DeploymentSnapshot extends ProviderObservation {
  domain: "deployment";
  status: DeploymentStatus;
  healthy?: boolean;
  projectId?: string;
  deploymentId?: string;
  sourceRevision?: string;
  targetEnvironment?: string;
  url?: string;
  domains?: string[];
  secrets?: SecretMetadata[];
  buildEvidence?: EvidenceStatus;
  runtimeEvidence?: EvidenceStatus;
  rollbackEvidence?: EvidenceStatus;
  metadata?: Record<string, unknown>;
}

export type DatabaseHealth = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface DatabaseSnapshot extends ProviderObservation {
  domain: "database";
  health: DatabaseHealth;
  engine?: string;
  environment?: string;
  currentMigrationVersion?: string;
  pendingMigrations?: string[];
  recoveryCapability?: "backup" | "pitr" | "branch_clone" | "in_place_restore" | "new_database_cutover" | "unknown";
  rollbackCompatibility?: "compatible" | "incompatible" | "unknown";
  secrets?: SecretMetadata[];
  metadata?: Record<string, unknown>;
}

export function createCiSnapshot(input: Omit<CiSnapshot, "domain">): CiSnapshot {
  return { ...input, domain: "ci" };
}

export function createDeploymentSnapshot(input: Omit<DeploymentSnapshot, "domain">): DeploymentSnapshot {
  return { ...input, domain: "deployment" };
}

export function createDatabaseSnapshot(input: Omit<DatabaseSnapshot, "domain">): DatabaseSnapshot {
  return { ...input, domain: "database" };
}
