import type { RiskTier } from "../core/types.js";
import { compareRisk } from "../core/operation.js";
import type { ReviewDecision } from "./comments.js";

export interface ReviewRequirement {
  independentRequired: boolean;
  independentRecommended: boolean;
}

export interface ReviewEvidence {
  reviewerId: string;
  implementerId: string;
  decision: ReviewDecision;
}

export interface ReviewFinding {
  code: string;
  observation: string;
}

export interface ReviewAssessment {
  complete: boolean;
  findings: ReviewFinding[];
}

export function reviewRequirementForRisk(risk: RiskTier): ReviewRequirement {
  return {
    independentRequired: compareRisk(risk, "R3") >= 0,
    independentRecommended: compareRisk(risk, "R2") >= 0,
  };
}

export function assessReviewEvidence(risk: RiskTier, reviews: readonly ReviewEvidence[]): ReviewAssessment {
  const findings: ReviewFinding[] = [];
  const requirement = reviewRequirementForRisk(risk);
  const independent = reviews.filter((review) => review.reviewerId !== review.implementerId);
  const blocking = reviews.filter((review) => review.decision === "request_changes");
  const independentApproval = independent.some((review) => review.decision === "approve" || review.decision === "merge_recommendation");

  if (blocking.length > 0) {
    findings.push({ code: "CHANGES_REQUESTED", observation: "At least one review requests changes." });
  }

  if (requirement.independentRequired && independent.length === 0) {
    findings.push({ code: "NO_INDEPENDENT_REVIEW", observation: "This risk tier requires a reviewer distinct from the implementer." });
  } else if (requirement.independentRequired && !independentApproval) {
    findings.push({ code: "NO_INDEPENDENT_APPROVAL", observation: "Independent review exists but no independent approval or merge recommendation is recorded." });
  }

  return { complete: findings.length === 0, findings };
}
