import { describe, expect, it } from "vitest";
import { resolveAuthority, validateAuthorityMap } from "../src/work/authority.js";

describe("work authority map", () => {
  it("rejects two canonical providers for the same semantic domain", () => {
    const result = validateAuthorityMap({
      bindings: [
        { domain: "project_intent", provider: "linear", canonical: true },
        { domain: "project_intent", provider: "github", canonical: true },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/project_intent/i);
  });

  it("resolves layered Linear + Beads + GitHub authority explicitly", () => {
    const map = {
      bindings: [
        { domain: "project_intent", provider: "linear", canonical: true },
        { domain: "execution_graph", provider: "beads", canonical: true },
        { domain: "scm", provider: "github", canonical: true },
      ],
    } as const;

    expect(resolveAuthority(map, "execution_graph")?.provider).toBe("beads");
  });
});
