import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("frontier Agent Skill", () => {
  it("ships a frontier reference", () => {
    expect(existsSync("skills/git-skill-pro/references/frontier.md")).toBe(true);
  });

  it("teaches logical Change identity, merge-group separation, proof manifests and deploy/release separation", () => {
    const skill = readFileSync("skills/git-skill-pro/SKILL.md", "utf8");
    expect(skill).toMatch(/logical.*Change.*commit SHA|commit SHA.*logical.*Change/is);
    expect(skill).toMatch(/merge[- ]group.*PR[- ]head|PR[- ]head.*merge[- ]group/is);
    expect(skill).toMatch(/proof[- ]carrying.*manifest|Change Manifest/is);
    expect(skill).toMatch(/deploy.*release|deployment.*exposure/is);
    expect(skill).toMatch(/provenance|SBOM/is);
    expect(skill).toMatch(/Jujutsu|alternative VCS/is);
  });
});
