# CI Causality and Workflow Audit

Load this reference when a check, workflow, pipeline, runner, or required status is failing or unreliable.

## Diagnose the failing layer before changing code

Classify evidence into source, test, type/static analysis, dependency/install, workflow configuration, permissions, secrets, runtime/toolchain, runner, cache/artifact, concurrency, external service, quota/rate limit, deployment, database/service dependency, or unknown.

Structured job/step metadata is stronger than log-pattern inference. Bounded log patterns are fallback evidence only. Ambiguous logs remain unknown.

## Root cause is not hardening

Keep the current failure cause separate from unrelated improvements. Example: an action reference could deserve immutable SHA pinning while the actual failure is a missing secret. Do not rewrite application code or mislabel the pinning finding as root cause.

## Default branch baseline

Before blaming several PRs, establish current default-branch CI health and compare stable failure fingerprints. A shared main/default failure is a baseline-repair lane, not 20 independent PR code fixes.

## Required-check wiring

Compare repository-required check names with the checks current workflows can actually emit. A renamed/deleted workflow or job can leave a permanently impossible required check.

Also inspect merge-group/merge-queue triggers when those repository features are enabled; PR-head success does not automatically prove speculative integration success.

## Permissions and secrets

Audit least privilege and secret/variable scope without exposing values. Secret presence, name and environment scope are evidence; secret contents never belong in logs/evidence packets.
