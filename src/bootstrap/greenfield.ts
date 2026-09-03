import type { RiskTier } from "../core/types.js";
import type { WorkProvider } from "../work/types.js";

export interface GreenfieldBootstrapInput {
  repositoryExists: boolean;
  workTracker?: WorkProvider;
  executionGraph?: WorkProvider;
  licensePolicy?: string;
  maintainers?: string[];
  securityContacts?: string[];
  deploymentKnown?: boolean;
  databaseKnown?: boolean;
}

export interface BootstrapStep {
  id:
    | "repository_baseline"
    | "repo_instructions"
    | "work_authority"
    | "issue_conventions"
    | "isolation_policy"
    | "ci_baseline"
    | "pr_policy"
    | "governance_audit"
    | "provider_discovery"
    | "definition_of_ready"
    | "definition_of_done"
    | "context_policy"
    | "proving_issue";
  title: string;
  risk: RiskTier;
  evidence: string[];
}

export interface BootstrapPlan {
  mode: "greenfield";
  inputs: GreenfieldBootstrapInput;
  steps: BootstrapStep[];
  unknowns: string[];
}

export function planGreenfieldBootstrap(input: GreenfieldBootstrapInput): BootstrapPlan {
  const unknowns: string[] = [];
  if (!input.licensePolicy) unknowns.push("license_policy");
  if (!input.maintainers || input.maintainers.length === 0) unknowns.push("maintainers");
  if (!input.securityContacts || input.securityContacts.length === 0) unknowns.push("security_contacts");
  if (input.deploymentKnown !== true) unknowns.push("deployment_provider_or_environment");
  if (input.databaseKnown !== true) unknowns.push("database_or_stateful_systems");

  const steps: BootstrapStep[] = [
    {
      id: "repository_baseline",
      title: "Resolve repository identity and baseline",
      risk: "R0",
      evidence: [input.repositoryExists ? "Repository exists" : "Repository creation is required before code workflow setup"],
    },
    {
      id: "repo_instructions",
      title: "Establish repository-local agent and contributor instructions",
      risk: "R1",
      evidence: ["README/AGENTS/instruction ownership must be explicit", "Do not invent maintainers or license policy"],
    },
    {
      id: "work_authority",
      title: "Define tracker and work-graph authority",
      risk: "R1",
      evidence: [
        "Explicit authority map required",
        `Selected work tracker: ${input.workTracker ?? "unknown"}`,
        `Selected execution graph: ${input.executionGraph ?? "unknown"}`,
      ],
    },
    {
      id: "issue_conventions",
      title: "Define implementation-ready issue contract",
      risk: "R1",
      evidence: ["Outcome, acceptance criteria, blockers, repository identity, verification and Definition of Done are represented"],
    },
    {
      id: "isolation_policy",
      title: "Define branch/worktree and remote-isolation conventions",
      risk: "R1",
      evidence: ["Local worktrees preferred only when persistent Git and work-graph concurrency are safe"],
    },
    {
      id: "ci_baseline",
      title: "Establish a trusted CI baseline",
      risk: "R1",
      evidence: ["Typecheck/test/build commands and required check names are proven on the default branch"],
    },
    {
      id: "pr_policy",
      title: "Define PR, independent review and merge-readiness policy",
      risk: "R1",
      evidence: ["Comments, approvals, merge recommendation and merge execution remain distinct"],
    },
    {
      id: "governance_audit",
      title: "Audit repository rules against the declared workflow",
      risk: "R0",
      evidence: ["Rulesets/branch protection/required checks are inspected before proposing mutations"],
    },
    {
      id: "provider_discovery",
      title: "Discover deployment and database/state providers",
      risk: "R0",
      evidence: ["Unknown providers remain unknown rather than inferred from naming"],
    },
    {
      id: "definition_of_ready",
      title: "Define the project Definition of Ready",
      risk: "R1",
      evidence: ["Material ambiguity and unresolved blockers prevent automatic readiness"],
    },
    {
      id: "definition_of_done",
      title: "Define the project Definition of Done",
      risk: "R1",
      evidence: ["Completion specifies whether merge, deploy, migration, release and production verification are required"],
    },
    {
      id: "context_policy",
      title: "Define minimum-sufficient context and evidence policy",
      risk: "R1",
      evidence: ["Context packets reference current task/revision facts rather than inherited conversation sprawl"],
    },
    {
      id: "proving_issue",
      title: "Run one representative issue through the complete declared workflow",
      risk: "R2",
      evidence: ["A clean end-to-end issue proves the workflow rather than merely documenting it"],
    },
  ];

  return { mode: "greenfield", inputs: { ...input }, steps, unknowns };
}
