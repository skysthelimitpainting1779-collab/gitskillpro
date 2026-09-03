export type CiFailureClassification =
  | "source"
  | "test"
  | "type_static"
  | "dependency"
  | "workflow"
  | "permission"
  | "secret"
  | "runtime"
  | "runner"
  | "cache_artifact"
  | "concurrency"
  | "external"
  | "quota"
  | "deployment"
  | "database"
  | "unknown";

export interface FailedCiStep {
  name: string;
  category?: string;
  logExcerpt?: string;
}

export interface CiFailureClassificationResult {
  classification: CiFailureClassification;
  confidence: "structured" | "pattern" | "unknown";
  summary: string;
  evidence: string[];
}

export interface CiAuditInput {
  status: "success" | "failure" | "pending" | "cancelled" | "unknown";
  failedSteps: FailedCiStep[];
  requiredChecks?: string[];
  emittedChecks?: string[];
  hardeningFindings?: string[];
}

export interface CiWiringFinding {
  code: "REQUIRED_CHECK_NOT_EMITTED";
  check: string;
  observation: string;
}

export interface CiAuditResult {
  status: CiAuditInput["status"];
  rootCauses: CiFailureClassificationResult[];
  wiringFindings: CiWiringFinding[];
  hardeningFindings: string[];
  healthy: boolean;
}

const structuredCategories: Record<string, CiFailureClassification> = {
  source: "source",
  test: "test",
  tests: "test",
  type: "type_static",
  static: "type_static",
  lint: "type_static",
  dependency: "dependency",
  install: "dependency",
  workflow: "workflow",
  permission: "permission",
  permissions: "permission",
  secret: "secret",
  secrets: "secret",
  runtime: "runtime",
  toolchain: "runtime",
  runner: "runner",
  cache: "cache_artifact",
  artifact: "cache_artifact",
  concurrency: "concurrency",
  external: "external",
  provider: "external",
  quota: "quota",
  rate_limit: "quota",
  deployment: "deployment",
  deploy: "deployment",
  database: "database",
  db: "database",
};

const patterns: Array<[CiFailureClassification, RegExp]> = [
  ["type_static", /\bTS\d{4}\b|typecheck|type error|eslint.*error|lint.*failed/i],
  ["test", /AssertionError|expect\(.+\)|test(?:s| suite)? failed|FAIL\s+.+\.test\./i],
  ["dependency", /npm ERR|lockfile|dependency resolution|unable to resolve dependency|package.*not found/i],
  ["workflow", /invalid workflow|workflow.*syntax|yaml.*(?:parse|syntax)|mapping values are not allowed/i],
  ["permission", /resource not accessible by integration|permission denied|insufficient permission|HTTP 403|forbidden/i],
  ["secret", /secret.*(?:not found|missing|undefined)|missing.*secret|credential.*missing/i],
  ["runtime", /unsupported (?:node|python|runtime)|runtime version|toolchain.*(?:missing|unsupported)|command not found/i],
  ["runner", /runner.*(?:offline|lost|communication|unavailable)|no space left on device|hosted runner/i],
  ["cache_artifact", /cache.*(?:corrupt|restore failed|archive)|artifact.*(?:missing|corrupt|download failed)/i],
  ["concurrency", /cancelled.*concurr|canceled.*concurr|superseded by newer run/i],
  ["quota", /rate limit|quota.*exceed|usage limit|too many requests|HTTP 429/i],
  ["deployment", /vercel.*deploy.*fail|deployment failed|deploy.*failed|cloudflare.*deploy.*fail/i],
  ["database", /migration.*failed|database.*(?:unavailable|connection refused)|SQLSTATE|relation .* does not exist/i],
  ["external", /ECONNRESET|ETIMEDOUT|upstream.*(?:unavailable|error)|service unavailable|HTTP 502|HTTP 503/i],
  ["source", /compile(?:r)? error|build.*source.*failed|syntax error.*\.(?:ts|js|py|go|rs)/i],
];

export function classifyCiFailure(step: FailedCiStep): CiFailureClassificationResult {
  const category = step.category?.trim().toLowerCase();
  if (category && structuredCategories[category]) {
    const classification = structuredCategories[category];
    return {
      classification,
      confidence: "structured",
      summary: `${step.name} is classified ${classification} from structured CI metadata.`,
      evidence: [category, step.logExcerpt ?? ""].filter(Boolean),
    };
  }

  const excerpt = step.logExcerpt ?? "";
  for (const [classification, pattern] of patterns) {
    if (pattern.test(excerpt)) {
      return {
        classification,
        confidence: "pattern",
        summary: `${step.name} matches a bounded ${classification} failure pattern.`,
        evidence: [excerpt.slice(0, 1000)],
      };
    }
  }

  return {
    classification: "unknown",
    confidence: "unknown",
    summary: `${step.name} cannot be safely classified from the supplied metadata/log excerpt.`,
    evidence: excerpt ? [excerpt.slice(0, 1000)] : [],
  };
}

export function auditCi(input: CiAuditInput): CiAuditResult {
  const rootCauses = input.failedSteps.map(classifyCiFailure);
  const emitted = new Set(input.emittedChecks ?? []);
  const wiringFindings: CiWiringFinding[] = [];

  for (const check of input.requiredChecks ?? []) {
    if (!emitted.has(check)) {
      wiringFindings.push({
        code: "REQUIRED_CHECK_NOT_EMITTED",
        check,
        observation: `Repository policy requires check ${check}, but it is absent from the supplied current workflow/check set.`,
      });
    }
  }

  return {
    status: input.status,
    rootCauses,
    wiringFindings,
    hardeningFindings: [...(input.hardeningFindings ?? [])],
    healthy: input.status === "success" && rootCauses.length === 0 && wiringFindings.length === 0,
  };
}
