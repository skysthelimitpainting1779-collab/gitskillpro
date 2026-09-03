import { describe, expect, it } from "vitest";
import { reportContextCost } from "../src/context/cost.js";

describe("context cost telemetry", () => {
  it("does not call lower token usage a success when quality drops", () => {
    const report = reportContextCost({
      inputTokens: 1_000,
      outputTokens: 200,
      retrievedTokens: 300,
      cachedTokens: 400,
      avoidedTokens: 2_000,
      taskSucceeded: true,
      qualityScoreBefore: 0.95,
      qualityScoreAfter: 0.8,
      evidenceCompletenessBefore: 1,
      evidenceCompletenessAfter: 1,
    });
    expect(report.optimizationSuccessful).toBe(false);
    expect(report.reasons.join(" ")).toMatch(/quality/i);
  });

  it("accepts savings only when task success, quality and evidence are preserved", () => {
    const report = reportContextCost({
      inputTokens: 900,
      outputTokens: 150,
      retrievedTokens: 250,
      cachedTokens: 350,
      avoidedTokens: 1_500,
      taskSucceeded: true,
      qualityScoreBefore: 0.9,
      qualityScoreAfter: 0.92,
      evidenceCompletenessBefore: 0.95,
      evidenceCompletenessAfter: 0.95,
    });
    expect(report.optimizationSuccessful).toBe(true);
    expect(report.uncachedInputTokens).toBe(550);
  });

  it("never produces negative uncached input tokens", () => {
    expect(reportContextCost({
      inputTokens: 100,
      outputTokens: 20,
      retrievedTokens: 0,
      cachedTokens: 500,
      avoidedTokens: 0,
      taskSucceeded: true,
    }).uncachedInputTokens).toBe(0);
  });
});
