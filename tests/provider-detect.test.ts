import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detectRepositoryProviders } from "../src/providers/detect.js";

async function repoWith(files: Record<string, string>) {
  const root = await mkdtemp(join(tmpdir(), "gsp-provider-detect-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    const parts = path.split("/");
    if (parts.length > 1) await mkdir(join(root, ...parts.slice(0, -1)), { recursive: true });
    await writeFile(full, content);
  }
  return root;
}

describe("repository provider detection", () => {
  it("detects explicit deployment/provider config as repository signals only", async () => {
    const root = await repoWith({
      "vercel.json": "{}",
      "wrangler.toml": "name='worker'",
      "netlify.toml": "[build]",
      "fly.toml": "app='x'",
      "railway.json": "{}",
      "render.yaml": "services: []",
      "docker-compose.yml": "services: {}",
      "k8s/deployment.yaml": "apiVersion: apps/v1\nkind: Deployment\n",
    });
    const result = await detectRepositoryProviders(root);
    const providers = result.map((entry) => entry.provider);
    expect(providers).toEqual(expect.arrayContaining(["vercel", "cloudflare", "netlify", "fly", "railway", "render", "docker", "kubernetes"]));
    expect(result.every((entry) => entry.accountAccessProven === false)).toBe(true);
  });

  it("detects linked Vercel project metadata without treating it as deployment health", async () => {
    const root = await repoWith({ ".vercel/project.json": JSON.stringify({ projectId: "prj_123", orgId: "team_123" }) });
    const result = await detectRepositoryProviders(root);
    expect(result).toContainEqual(expect.objectContaining({ provider: "vercel", signal: ".vercel/project.json" }));
  });

  it("does not infer Hostinger from generic VPS-looking files", async () => {
    const root = await repoWith({ "docker-compose.yml": "services: {}", "nginx.conf": "server {}" });
    const result = await detectRepositoryProviders(root);
    expect(result.some((entry) => entry.provider === "hostinger_vps" || entry.provider === "hostinger_horizons")).toBe(false);
  });

  it("returns no provider signals when no supported config is present", async () => {
    const root = await repoWith({ "README.md": "generic project" });
    expect(await detectRepositoryProviders(root)).toEqual([]);
  });
});
