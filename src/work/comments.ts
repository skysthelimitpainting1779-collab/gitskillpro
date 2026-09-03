export type AgentCommentType =
  | "claimed"
  | "plan"
  | "progress"
  | "blocked"
  | "ci_diagnosis"
  | "review"
  | "merge_ready"
  | "deployment"
  | "database"
  | "completion"
  | "follow_up";

export type ReviewDecision = "comment" | "approve" | "request_changes" | "merge_recommendation";

export interface AgentComment {
  type: AgentCommentType;
  body: string;
  actor: string;
  createdAt: string;
  reviewDecision?: ReviewDecision;
}

export function createAgentComment(
  type: AgentCommentType,
  body: string,
  input: { actor: string; reviewDecision?: ReviewDecision; createdAt?: string },
): AgentComment {
  if (!input.actor.trim()) throw new Error("Agent comment actor is required");
  if (!body.trim()) throw new Error("Agent comment body is required");

  const comment: AgentComment = {
    type,
    body,
    actor: input.actor,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  if (type === "review" && input.reviewDecision) comment.reviewDecision = input.reviewDecision;
  return comment;
}
