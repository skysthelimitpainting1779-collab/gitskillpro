# GitSkillPro Frontier Change System Implementation Plan

**Base:** verified Repository Automation SHA `2a0cc00f113f65dfb9af57442e8f0af13db2fda1`

**Goal:** implement the stable core abstractions from SPEC-v0.6 without making experimental tooling mandatory.

## Guardrails

- Git remains physical repository truth; logical Change IDs are an additional identity layer, never a replacement for commit SHAs.
- Stacked PRs/merge groups are feature-detected. Repositories without them remain first-class.
- A PR-head CI result is not automatically valid for a merge-group SHA.
- Proof-carrying manifests reference evidence; they do not duplicate whole logs/diffs.
- Manifest validity is conditional on identities (change version/head/base/dependencies/check runs/deploy/migration/context packet). Identity drift makes dependent evidence stale.
- Deployment and release/exposure are distinct state transitions.
- Provenance/SBOM/policy evidence is modeled provider-neutrally; absence remains unknown/not-proven.
- Jujutsu/alternative VCS support is a normalized identity boundary only in this stack; no `jj` mutation execution.
- No production rollout, merge, provider, or policy mutation in this stack.

## Task 1 — Logical Change Graph

Create `src/change/types.ts`, `src/change/graph.ts`, `tests/change-graph.test.ts`.

Model stable logical Change ID, physical versions/commit SHAs, base/change dependencies, stack ordering, supersession and status. Prove a logical change survives commit-SHA replacement/rebase and that cycles/duplicate active versions are audited.

## Task 2 — Stacked PR + merge-group audit

Create `src/change/stack.ts`, `src/audits/merge-group.ts`, tests.

Prove stack order/dependencies, stale base/head layers, lower-layer invalidation, and distinct merge-group SHA checks. Required checks proven only on PR head must not satisfy a merge-group gate when merge queue/merge-group evidence is required.

## Task 3 — Proof-Carrying Change Manifest

Create `src/change/manifest.ts`, `tests/change-manifest.test.ts`.

Manifest fields include work identity, logical Change ID/version, physical SHA/base, dependencies, affected graph/diff refs, risk, checks, security, DB/migrations, flags/release, provenance/SBOM, independent reviews, deployment/recovery, context packet hash and unknowns.

Validate references and compute a deterministic manifest fingerprint. `isManifestCurrent(manifest, currentIdentities)` must return false on head/base/dependency/migration/deployment/context identity drift.

## Task 4 — Provenance / policy / release evidence

Create `src/change/provenance.ts`, `src/change/policy.ts`, `src/release/plan.ts`, tests.

Model artifact attestations/SBOM/signature evidence separately from source commit verification. Model policy decisions as evaluated evidence (policy ID/version/input hash/result), not prose approval. Model `deploy -> verify -> expose/promotion -> observe -> complete/rollback` with progressive percentages/flag identity where used.

## Task 5 — Alternative VCS normalization

Create `src/adapters/change-vcs.ts`, tests.

Normalize Git commit-only and Jujutsu-style stable change IDs into the same logical ChangeVersion model. Never infer that a conflict has been resolved simply because the VCS permits conflicted state to persist.

## Task 6 — CLI + Skill + acceptance

CLI read/audit/plan surfaces:
- `gsp change manifest <snapshot.json> [--json]`
- `gsp change audit-stack <snapshot.json> [--json]`
- `gsp merge-group audit <snapshot.json> [--json]`
- `gsp release plan <snapshot.json> [--json]`

Add `skills/git-skill-pro/references/frontier.md`, exports, README and CI smoke.

Acceptance proves one stacked change manifest invalidates when a lower dependency/head changes; merge-group checks remain separate from PR-head checks; deployment can be healthy while release/exposure remains incomplete.
