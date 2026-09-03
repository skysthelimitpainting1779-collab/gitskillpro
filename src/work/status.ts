import type { SemanticWorkStatus } from "./types.js";

export type ProviderStatusMap = Readonly<Record<string, SemanticWorkStatus>>;

export function mapProviderStatus(status: string, mapping: ProviderStatusMap): SemanticWorkStatus {
  const exact = mapping[status];
  if (exact) return exact;

  const normalized = status.trim().toLowerCase();
  const match = Object.entries(mapping).find(([providerStatus]) => providerStatus.trim().toLowerCase() === normalized);
  return match?.[1] ?? "unknown";
}
