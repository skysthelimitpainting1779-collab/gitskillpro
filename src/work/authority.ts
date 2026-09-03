import type { AuthorityBinding, AuthorityMap, WorkDomain } from "./types.js";

export interface AuthorityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateAuthorityMap(map: AuthorityMap): AuthorityValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const canonicalByDomain = new Map<WorkDomain, AuthorityBinding[]>();

  for (const binding of map.bindings) {
    if (!binding.canonical) continue;
    const current = canonicalByDomain.get(binding.domain) ?? [];
    current.push(binding);
    canonicalByDomain.set(binding.domain, current);
  }

  for (const [domain, bindings] of canonicalByDomain) {
    if (bindings.length > 1) {
      errors.push(`Domain ${domain} has multiple canonical providers: ${bindings.map((binding) => binding.provider).join(", ")}`);
    }
  }

  const knownDomains: WorkDomain[] = ["project_intent", "execution_graph", "scm", "ci", "deployment", "database"];
  for (const domain of knownDomains) {
    if (!canonicalByDomain.has(domain)) warnings.push(`Domain ${domain} has no canonical provider configured`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function resolveAuthority(map: AuthorityMap, domain: WorkDomain): AuthorityBinding | undefined {
  const canonical = map.bindings.filter((binding) => binding.domain === domain && binding.canonical);
  return canonical.length === 1 ? canonical[0] : undefined;
}
