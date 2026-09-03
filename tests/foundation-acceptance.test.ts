import { execFileSync } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  LocalGitAdapter,
  auditGit,
  createEvidencePacket,
  planIntent,
} from "../src/index.js";

describe("GitSkillPro foundation acceptance", () => {
  it("inspects, audits, records evidence, and plans without mutating the repository", async () => {
    const dir = await mkdtemp(join(tmpdir(), "gsp-acceptance-"));
    execFileSync("git", ["init", "-b", "main"], { cwd: dir });
    execFileSync("git", ["config", "user.email", "acceptance@example.com"], { cwd: dir });
    execFileSync("git", ["config", "user.name", "Acceptance Test"], { cwd: dir });

    await writeFile(join(dir, "tracked.txt"), "baseline\n");
    execFileSync("git", ["add", "tracked.txt"], { cwd: dir });
    execFileSync("git", ["commit", "-m", "baseline"], { cwd: dir });
    await writeFile(join(dir, "tracked.txt"), "changed\n");

    const before = execFileSync("git", ["status", "--porcelain"], { cwd: dir, encoding: "utf8" });
    const snapshot = await new LocalGitAdapter().inspectRepository(dir);
    const audit = auditGit(snapshot);
    const evidence = createEvidencePacket({
      operationId: "acceptance-inspect",
      intent: "inspect",
      risk: "R0",
      expectedState: { headSha: snapshot.headSha ?? undefined },
    });
    const plan = planIntent("inspect");
    const after = execFileSync("git", ["status", "--porcelain"], { cwd: dir, encoding: "utf8" });

    expect(snapshot.headSha).toMatch(/^[0-9a-f]{40,64}$/);
    expect(snapshot.dirty).toBe(true);
    expect(audit.findings.some((finding) => finding.code === "UNEXPLAINED_DIRTY_WORK")).toBe(true);
    expect(evidence.persistence).toBeUndefined();
    expect(plan.risk).toBe("R0");
    expect(after).toBe(before);
  });
});
