export interface Context7RequestPlan {
  next: "resolve" | "query";
  query: string;
  libraryName?: string;
  libraryId?: string;
  requestedVersion?: string;
}

export interface Context7PlanInput {
  libraryName?: string;
  exactLibraryId?: string;
  repoVersion?: string;
  concept: string;
}

export interface Context7HostResolution {
  libraryId: string;
  name: string;
  description?: string;
  sourceReputation?: string;
  benchmarkScore?: number;
  versions?: string[];
}

export interface Context7ResolutionEvidence extends Context7HostResolution {
  requestedVersion?: string;
  resolvedVersion?: string;
}

export interface Context7DocsEvidence {
  libraryId: string;
  query: string;
  reference?: string;
  contentHash?: string;
  observedAt: string;
}

const SENSITIVE_PATTERNS: RegExp[] = [
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/,
  /\bghp_[A-Za-z0-9]{16,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{16,}\b/,
  /\b(?:password|passwd|secret|api[_-]?key|access[_-]?token)\s*[:=]\s*\S+/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

function validLibraryId(value: string): boolean {
  return /^\/[^/\s]+\/[^/\s]+(?:\/[^/\s]+)?$/.test(value);
}

export function assertPrivacySafeDocsQuery(query: string): void {
  const value = query.trim();
  if (!value) throw new Error("Context7 query requires one focused concept");
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error("Context7 query appears to contain sensitive/secret material; provide a privacy-safe summary instead");
  }
  if (value.length > 2_000) {
    throw new Error("Context7 query is too large; provide a focused privacy-safe concept instead of proprietary context");
  }
}

export function planContext7Request(input: Context7PlanInput): Context7RequestPlan {
  const concept = input.concept.trim();
  assertPrivacySafeDocsQuery(concept);

  if (input.exactLibraryId) {
    const libraryId = input.exactLibraryId.trim();
    if (!validLibraryId(libraryId)) throw new Error("Invalid exact Context7 library ID");
    return {
      next: "query",
      libraryId,
      query: concept,
      requestedVersion: input.repoVersion?.trim() || undefined,
    };
  }

  const libraryName = input.libraryName?.trim();
  if (!libraryName) throw new Error("Context7 resolution requires an official library name when no exact library ID is known");
  return {
    next: "resolve",
    libraryName,
    query: concept,
    requestedVersion: input.repoVersion?.trim() || undefined,
  };
}

export function normalizeContext7Resolution(
  host: Context7HostResolution,
  options: { requestedVersion?: string } = {},
): Context7ResolutionEvidence {
  if (!validLibraryId(host.libraryId)) throw new Error("Host returned an invalid Context7 library ID");
  const requestedVersion = options.requestedVersion?.trim() || undefined;
  const versions = host.versions ? [...host.versions] : undefined;
  let resolvedVersion: string | undefined;

  if (requestedVersion && versions) {
    resolvedVersion = versions.find((version) => version === requestedVersion || version === `v${requestedVersion}`);
  }

  return {
    ...host,
    versions,
    requestedVersion,
    resolvedVersion,
  };
}

export function normalizeContext7Docs(input: Omit<Context7DocsEvidence, "observedAt"> & { observedAt?: string }): Context7DocsEvidence {
  if (!validLibraryId(input.libraryId)) throw new Error("Invalid Context7 library ID");
  assertPrivacySafeDocsQuery(input.query);
  return {
    ...input,
    observedAt: input.observedAt ?? new Date().toISOString(),
  };
}

export function context7CacheIdentity(input: { libraryId: string; version?: string; query: string }): Record<string, string> {
  if (!validLibraryId(input.libraryId)) throw new Error("Invalid Context7 library ID");
  assertPrivacySafeDocsQuery(input.query);
  const identity: Record<string, string> = {
    kind: "context7",
    libraryId: input.libraryId,
    query: input.query.trim(),
  };
  if (input.version?.trim()) identity.version = input.version.trim();
  return identity;
}
