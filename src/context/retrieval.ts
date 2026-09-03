export type RetrievalMode = "ci" | "pr" | "recovery" | "docs";

export type RetrievalStepKind =
  | "workflow_run"
  | "failed_job"
  | "failed_step_excerpt"
  | "wider_job_log"
  | "pr_metadata"
  | "changed_filenames"
  | "changed_file_patches"
  | "related_source"
  | "wider_repository"
  | "inventory_metadata"
  | "problem_clusters"
  | "exact_history_evidence"
  | "dependency_version"
  | "context7_library_resolution"
  | "context7_concept_query";

export interface RetrievalStep {
  kind: RetrievalStepKind;
  reason: string;
  query?: string;
}

export interface RetrievalPlanInput {
  mode: RetrievalMode;
  unresolved: boolean;
  concept?: string;
}

export interface RetrievalPlan {
  mode: RetrievalMode;
  steps: RetrievalStep[];
  expansionRequired: boolean;
}

export function planRetrieval(input: RetrievalPlanInput): RetrievalPlan {
  if (input.mode === "ci") {
    const steps: RetrievalStep[] = [
      { kind: "workflow_run", reason: "Identify the failing run before reading logs." },
      { kind: "failed_job", reason: "Narrow to the failed job." },
      { kind: "failed_step_excerpt", reason: "Read only the failing step and error excerpt first." },
    ];
    if (input.unresolved) steps.push({ kind: "wider_job_log", reason: "Expand only because the narrow failure evidence is insufficient." });
    return { mode: input.mode, steps, expansionRequired: input.unresolved };
  }

  if (input.mode === "pr") {
    const steps: RetrievalStep[] = [
      { kind: "pr_metadata", reason: "Establish base/head/current review state." },
      { kind: "changed_filenames", reason: "Map the change surface without loading patches yet." },
      { kind: "changed_file_patches", reason: "Inspect only the actual changed hunks." },
    ];
    if (input.unresolved) {
      steps.push(
        { kind: "related_source", reason: "Load directly related implementation/context only because the diff is insufficient." },
        { kind: "wider_repository", reason: "Expand repository context only after narrower evidence remains insufficient." },
      );
    }
    return { mode: input.mode, steps, expansionRequired: input.unresolved };
  }

  if (input.mode === "recovery") {
    const steps: RetrievalStep[] = [
      { kind: "inventory_metadata", reason: "Inventory artifacts before opening their full content." },
      { kind: "problem_clusters", reason: "Expand only stale, failed, conflicting, duplicate or superseded clusters." },
    ];
    if (input.unresolved) steps.push({ kind: "exact_history_evidence", reason: "Retrieve exact ancestry/history/evidence for unresolved clusters." });
    return { mode: input.mode, steps, expansionRequired: input.unresolved };
  }

  const concept = input.concept?.trim();
  if (!concept) throw new Error("Docs retrieval requires one focused concept");
  return {
    mode: "docs",
    expansionRequired: false,
    steps: [
      { kind: "dependency_version", reason: "Resolve the dependency/product version from repository evidence." },
      { kind: "context7_library_resolution", reason: "Resolve or reuse the exact Context7 library ID." },
      { kind: "context7_concept_query", reason: "Query one focused documentation concept.", query: concept },
    ],
  };
}
