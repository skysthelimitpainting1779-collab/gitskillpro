import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import type { ProviderKind } from "./types.js";

export interface ProviderDetection {
  provider: ProviderKind;
  signal: string;
  accountAccessProven: false;
  confidence: "explicit_config" | "strong_config_signal";
  metadata?: Record<string, string>;
}

async function exists(root: string, path: string): Promise<boolean> {
  try {
    await access(join(root, path), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function jsonMetadata(root: string, path: string, keys: string[]): Promise<Record<string, string> | undefined> {
  try {
    const raw = await readFile(join(root, path), "utf8");
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
    const record = value as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const key of keys) {
      if (typeof record[key] === "string") result[key] = record[key];
    }
    return Object.keys(result).length ? result : undefined;
  } catch {
    return undefined;
  }
}

export async function detectRepositoryProviders(root = process.cwd()): Promise<ProviderDetection[]> {
  const detections: ProviderDetection[] = [];
  const add = (provider: ProviderKind, signal: string, confidence: ProviderDetection["confidence"] = "explicit_config", metadata?: Record<string, string>) => {
    if (detections.some((entry) => entry.provider === provider && entry.signal === signal)) return;
    detections.push({ provider, signal, accountAccessProven: false, confidence, metadata });
  };

  if (await exists(root, ".vercel/project.json")) {
    add("vercel", ".vercel/project.json", "explicit_config", await jsonMetadata(root, ".vercel/project.json", ["projectId", "orgId"]));
  }
  if (await exists(root, "vercel.json")) add("vercel", "vercel.json");

  for (const path of ["wrangler.toml", "wrangler.json", "wrangler.jsonc"]) {
    if (await exists(root, path)) add("cloudflare", path);
  }
  if (await exists(root, "netlify.toml")) add("netlify", "netlify.toml");
  if (await exists(root, "fly.toml")) add("fly", "fly.toml");
  for (const path of ["railway.json", "railway.toml"]) {
    if (await exists(root, path)) add("railway", path);
  }
  for (const path of ["render.yaml", "render.yml"]) {
    if (await exists(root, path)) add("render", path);
  }

  for (const path of ["docker-compose.yml", "docker-compose.yaml", "compose.yml", "compose.yaml", "Dockerfile"]) {
    if (await exists(root, path)) add("docker", path, path === "Dockerfile" ? "strong_config_signal" : "explicit_config");
  }

  for (const path of [
    "k8s/deployment.yaml",
    "k8s/deployment.yml",
    "kubernetes/deployment.yaml",
    "kubernetes/deployment.yml",
    "helm/Chart.yaml",
    "Chart.yaml",
  ]) {
    if (await exists(root, path)) add("kubernetes", path);
  }

  // Hostinger is intentionally not inferred from generic VPS, Nginx, Docker, or domain signals.
  // Only explicit project metadata added by a future Hostinger adapter may prove Horizons/VPS product identity.

  return detections.sort((a, b) => `${a.provider}:${a.signal}`.localeCompare(`${b.provider}:${b.signal}`));
}
