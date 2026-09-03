import { describe, expect, it } from "vitest";
import { classifyEnvironment } from "../src/core/environment.js";

describe("environment discovery", () => {
  it("does not claim persistence for an ephemeral sandbox", () => {
    const result = classifyEnvironment({
      cwd: "/workspace",
      hasGit: true,
      hasWritableFs: true,
      persistence: "ephemeral",
      ci: false,
      container: true,
    });
    expect(result.kind).toBe("ephemeral_sandbox");
    expect(result.capabilities).not.toContain("fs.persistent");
    expect(result.capabilities).not.toContain("git.worktree");
  });

  it("represents unknown persistence honestly", () => {
    const result = classifyEnvironment({ cwd: "/x", persistence: "unknown" });
    expect(result.persistence).toBe("unknown");
    expect(result.capabilities).not.toContain("fs.persistent");
  });

  it("recognizes a persistent linked worktree from explicit evidence", () => {
    const result = classifyEnvironment({
      cwd: "/repo/.worktrees/task",
      hasGit: true,
      hasWritableFs: true,
      persistence: "persistent",
      isWorktree: true,
      canSpawn: true,
    });
    expect(result.kind).toBe("worktree");
    expect(result.capabilities).toContain("git.worktree");
  });
});
