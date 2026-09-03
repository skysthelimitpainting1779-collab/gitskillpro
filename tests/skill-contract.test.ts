import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const required = [
  "package.json",
  "tsconfig.json",
  ".github/workflows/ci.yml",
  "AGENTS.md",
  "skills/git-skill-pro/SKILL.md",
];

describe("repository contract", () => {
  it("contains the required GitSkillPro surfaces", () => {
    for (const path of required) expect(existsSync(path), path).toBe(true);
  });

  it("keeps the Agent Skill discoverable", () => {
    const skill = readFileSync("skills/git-skill-pro/SKILL.md", "utf8");
    expect(skill).toMatch(/^---[\s\S]*name:\s*git-skill-pro/m);
    expect(skill).toMatch(/description:\s*Use when/i);
  });
});
