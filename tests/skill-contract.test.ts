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
  "skills/git-skill-pro/references/recovery.md",
  "skills/git-skill-pro/references/ci.md",
  "skills/git-skill-pro/references/deployment.md",
  "skills/git-skill-pro/references/databases.md",
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
    expect(skill).toMatch(/default[- ]branch.*baseline/is);
    expect(skill).toMatch(/archaeolog|inventory.*before.*cleanup/is);
    expect(skill).toMatch(/selective salvage/is);
    expect(skill).toMatch(/unknown.*valid|preserve.*unknown/is);
    expect(skill).toMatch(/root cause.*hardening|hardening.*root cause/is);
    expect(skill).toMatch(/provider.*success.*runtime|runtime.*provider.*success/is);
    expect(skill).toMatch(/Git revert.*database rollback|database rollback.*Git revert/is);
    expect(skill).toMatch(/Hostinger.*Horizons.*VPS|Hostinger.*VPS.*Horizons/is);
  });
});
