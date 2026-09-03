import type { CiStatus, DeploymentSnapshot } from "../providers/types.js";

export type CompatibilityState = "compatible" | "incompatible" | "unknown";

export interface DeploymentAuditInput {
  deployment: DeploymentSnapshot;
  ciStatus?: CiStatus;
  expectedSourceRevision?: string;
  rollbackRequested?: boolean;
  databaseCompatibility?: CompatibilityState;
  resourceCompatibility?: CompatibilityState;
}

export interface DeploymentFinding {
  code:
    | "DEPLOYMENT_FAILED"
    | "DEPLOYMENT_PENDING"
    | "DEPLOYMENT_STATUS_UNKNOWN"
    | "RUNTIME_HEALTH_UNKNOWN"
    | "RUNTIME_UNHEALTHY"
    | "SOURCE_REVISION_UNKNOWN"
    | "SOURCE_REVISION_MISMATCH"
    | "DATABASE_ROLLBACK_COMPATIBILITY_UNKNOWN"
    | "DATABASE_ROLLBACK_INCOMPATIBLE"
    | "RESOURCE_ROLLBACK_COMPATIBILITY_UNKNOWN"
    | "RESOURCE_ROLLBACK_INCOMPATIBLE";
  severity: "warning" | "error";
  observation: string;
}

export interface DeploymentAuditResult {
  state: "healthy" | "degraded" | "unhealthy" | "unknown";
  readyToPromote: boolean;
  findings: DeploymentFinding[];
  ciStatus?: CiStatus;
}

export function auditDeployment(input: DeploymentAuditInput): DeploymentAuditResult {
  const findings: DeploymentFinding[] = [];
  const add = (code: DeploymentFinding["code"], observation: string, severity: DeploymentFinding["severity"] = "error") => {
    findings.push({ code, observation, severity });
  };

  if (input.deployment.status === "failure" || input.deployment.status === "cancelled") {
    add("DEPLOYMENT_FAILED", `Deployment status is ${input.deployment.status}.`);
  } else if (input.deployment.status === "queued" || input.deployment.status === "building") {
    add("DEPLOYMENT_PENDING", `Deployment is still ${input.deployment.status}.`);
  } else if (input.deployment.status === "unknown") {
    add("DEPLOYMENT_STATUS_UNKNOWN", "Deployment control-plane status is unknown.");
  }

  if (input.deployment.runtimeEvidence !== "proven" || input.deployment.healthy === undefined) {
    add("RUNTIME_HEALTH_UNKNOWN", "Provider deployment state does not include proven runtime health evidence.");
  } else if (input.deployment.healthy === false) {
    add("RUNTIME_UNHEALTHY", "Runtime health evidence reports the deployment unhealthy.");
  }

  if (input.expectedSourceRevision) {
    if (!input.deployment.sourceRevision) {
      add("SOURCE_REVISION_UNKNOWN", `Expected deployed revision ${input.expectedSourceRevision}, but provider evidence contains no source revision.`);
    } else if (input.deployment.sourceRevision !== input.expectedSourceRevision) {
      add("SOURCE_REVISION_MISMATCH", `Expected deployed revision ${input.expectedSourceRevision}, observed ${input.deployment.sourceRevision}.`);
    }
  }

  if (input.rollbackRequested) {
    const db = input.databaseCompatibility ?? "unknown";
    const resources = input.resourceCompatibility ?? "unknown";
    if (db === "unknown") add("DATABASE_ROLLBACK_COMPATIBILITY_UNKNOWN", "Rollback is requested but database/code compatibility is unknown.");
    if (db === "incompatible") add("DATABASE_ROLLBACK_INCOMPATIBLE", "Database evidence says the requested code rollback is incompatible.");
    if (resources === "unknown") add("RESOURCE_ROLLBACK_COMPATIBILITY_UNKNOWN", "Rollback is requested but provider-resource compatibility is unknown.");
    if (resources === "incompatible") add("RESOURCE_ROLLBACK_INCOMPATIBLE", "Provider resource/binding evidence says the requested rollback is incompatible.");
  }

  const hasErrors = findings.some((finding) => finding.severity === "error");
  let state: DeploymentAuditResult["state"];
  if (hasErrors && findings.some((finding) => ["DEPLOYMENT_FAILED", "RUNTIME_UNHEALTHY", "DATABASE_ROLLBACK_INCOMPATIBLE", "RESOURCE_ROLLBACK_INCOMPATIBLE"].includes(finding.code))) {
    state = "unhealthy";
  } else if (hasErrors) {
    state = "degraded";
  } else if (input.deployment.status === "success" && input.deployment.runtimeEvidence === "proven" && input.deployment.healthy === true) {
    state = "healthy";
  } else {
    state = "unknown";
  }

  return {
    state,
    readyToPromote: state === "healthy" && !hasErrors,
    findings,
    ciStatus: input.ciStatus,
  };
}
