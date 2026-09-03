import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Context Economy Agent Skill contract", () => {
  it("ships a load-on-demand context economy reference", () => {
    expect(existsSync("skills/git-skill-pro/references/context-economy.md")).toBe(true);
  });

  it("teaches progressive retrieval, bounded handoffs, Context7 privacy and quality-gated savings", () => {
    const skill = readFileSync("skills/git-skill-pro/SKILL.md", "utf8");
    expect(skill).toMatch(/progressive.*retriev|retrieve.*progressive/is);
    expect(skill).toMatch(/bounded.*subagent|subagent.*bounded/is);
    expect(skill).toMatch(/Context7/is);
    expect(skill).toMatch(/secret|privacy/is);
    expect(skill).toMatch(/quality.*token|token.*quality/is);
  });
});
