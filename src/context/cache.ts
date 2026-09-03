import { createHash } from "node:crypto";

export type CacheIdentity = Record<string, unknown>;

export interface CacheMetadata {
  source: string;
  observedAt: string;
  maxAgeMs?: number;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  source: string;
  observedAt: string;
  maxAgeMs?: number;
  contentHash: string;
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Cache identity numbers must be finite");
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => canonicalize(item));
  if (typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      if (input[key] === undefined) continue;
      output[key] = canonicalize(input[key]);
    }
    return output;
  }
  if (value === undefined) return undefined;
  throw new Error(`Unsupported cache identity value type: ${typeof value}`);
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export function createCacheKey(identity: CacheIdentity): string {
  if (!identity.kind || typeof identity.kind !== "string") throw new Error("Cache identity requires a string kind");
  return `gsp-cache-v1:${hash(identity)}`;
}

export class ContextCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  put<T>(key: string, value: T, metadata: CacheMetadata): CacheEntry<T> {
    if (!key.trim()) throw new Error("Cache key is required");
    if (!metadata.source.trim()) throw new Error("Cache source is required");
    const observedAtMs = Date.parse(metadata.observedAt);
    if (!Number.isFinite(observedAtMs)) throw new Error("Cache observedAt must be a valid timestamp");
    if (metadata.maxAgeMs !== undefined && (!Number.isFinite(metadata.maxAgeMs) || metadata.maxAgeMs < 0)) {
      throw new Error("Cache maxAgeMs must be a non-negative finite number");
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      source: metadata.source,
      observedAt: new Date(observedAtMs).toISOString(),
      maxAgeMs: metadata.maxAgeMs,
      contentHash: hash(value),
    };
    this.entries.set(key, entry as CacheEntry<unknown>);
    return entry;
  }

  get<T = unknown>(key: string, now = Date.now()): CacheEntry<T> | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.maxAgeMs !== undefined) {
      const expiresAt = Date.parse(entry.observedAt) + entry.maxAgeMs;
      if (now > expiresAt) return undefined;
    }
    return entry as CacheEntry<T>;
  }

  delete(key: string): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
