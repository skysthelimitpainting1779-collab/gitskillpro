import { describe, expect, it } from "vitest";
import { normalizeLinearIssue } from "../src/adapters/linear.js";

describe("Linear host adapter contract", () => {
  it("normalizes Linear issue identity without promoting copied SCM state", () => {
    const issue = normalizeLinearIssue(
      {
        id: "uuid-1",
        identifier: "ENG-42",
        title: "Add work graph",
        status: { name: "In Progress" },
        project: { id: "p1", name: "GitSkillPro" },
        gitBranchName: "eng-42-work-graph",
        blockedBy: ["ENG-3"],
        acceptanceCriteria: ["Authority map is explicit"],
      },
      { "In Progress": "in_progress" },
    );

    expect(issue.id).toBe("ENG-42");
    expect(issue.provider).toBe("linear");
    expect(issue.status).toBe("in_progress");
    expect(issue.blockers).toEqual(["ENG-3"]);
    expect(issue.branchName).toBe("eng-42-work-graph");
    expect(issue.projectId).toBe("p1");
  });

  it("preserves unknown status instead of guessing", () => {
    const issue = normalizeLinearIssue({ id: "uuid-2", identifier: "ENG-43", title: "Unknown", status: { name: "Custom State" } }, {});
    expect(issue.status).toBe("unknown");
  });
});
