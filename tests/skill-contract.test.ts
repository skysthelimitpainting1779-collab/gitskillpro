import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const required = [
  "package.json",
  "tsconfig.json",
  ".github/workflows/ci.yml",
  "AGENTS.md",
  "skills/git-skill-pro/SKILL.md",
  "skills/git-skill-pro/references/primitive-safety.md",
  "skills/git-skill-pro/references/environment.md",
  "skills/git-skill-pro/references/workflow.md",
  "skills/git-skill-pro/references/beads.md",
];

describe("repository contract", () => {
  it("contains the required GitSkillPro surfaces", () => {
    for (const path of required) expect(existsSync(path), path).toBe(true);
  });

  it("keeps the Agent Skill discoverable and safety-focused", () => {
    const skill = readFileSync("skills/git-skill-pro/SKILL.md", "utf8");
    expect(skill).toMatch(/^---[\s\S]*name:\s*git-skill-pro/m);
    expect(skill).toMatch(/description:\s*Use when/i);
    expect(skill).toMatch(/discover.*capabilit/is);
    expect(skill).toMatch(/assume.*concurr/is);
    expect(skill).toMatch(/code correctness/is);
    expect(skill).toMatch(/CI health/is);
    expect(skill).toMatch(/deployment health/is);
    expect(skill).toMatch(/database state/is);
    expect(skill).toMatch(/minimum sufficient context/i);
    expect(skill).toMatch(/never claim persistence/i);
    expect(skill).toMatch(/authority map/i);
    expect(skill).toMatch(/Linear/i);
    expect(skill).toMatch(/Beads/i);
    expect(skill).toMatch(/comment.*review/is);
  });
});
