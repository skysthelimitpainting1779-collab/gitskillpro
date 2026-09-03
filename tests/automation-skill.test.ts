import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("repository automation Agent Skill", () => {
  it("ships an automation reference", () => {
    expect(existsSync("skills/git-skill-pro/references/automation.md")).toBe(true);
  });

  it("teaches separate authorities, background-writer discovery, loop prevention and hook safety", () => {
    const skill = readFileSync("skills/git-skill-pro/SKILL.md", "utf8");
    expect(skill).toMatch(/auto-stage.*auto-commit.*auto-push/is);
    expect(skill).toMatch(/background.*writer|automation.*actor/is);
    expect(skill).toMatch(/loop.*prevent|self-trigger/is);
    expect(skill).toMatch(/idempoten/is);
    expect(skill).toMatch(/hook.*bypass|--no-verify/is);
    expect(skill).toMatch(/checkpoint.*worktree/is);
  });
});
