# GitSkillPro Recovery / Archaeology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic recovery core that can reconstruct and classify unhealthy project state across work items, branches/PRs, CI, deployment and database evidence, then produce a prioritized selective-salvage recovery plan without destructive cleanup.

**Architecture:** Recovery consumes normalized evidence snapshots rather than coupling the core to one remote provider. GitHub/Linear/provider adapters will later populate those snapshots; this layer owns evidence graph reconstruction, default-branch CI baseline diagnosis, artifact classification, supersession/duplicate reasoning, salvage planning, tracker reconciliation and lane-based recovery plans. Unknown remains a valid result.

**Tech Stack:** Existing Node.js 22+/TypeScript/Vitest GitSkillPro core. Node standard library only.

**Spec:** `SPEC-v0.3.md` is primary, with authority/evidence/risk rules inherited from earlier/later specs.

## Global Constraints

- Base is verified workflow stack SHA `c70061cd3fde11c59c5e2c9362393523313975a7`.
- Recovery mode inventories/classifies before mutation.
- Name similarity alone MUST NOT establish issue/branch/PR identity or supersession.
- Default-branch CI health MUST be evaluated before blaming PR code.
- Explicit duplicate/supersession/issue links outrank timestamp or title heuristics.
- Stale/failed PRs are not merged wholesale to "save work"; salvage is selective and evidence-backed.
- Git rollback is not database rollback; deployment/database compatibility remains explicit.
- This layer is read/classify/plan only. Closing PRs, deleting branches, modifying tracker state, changing CI/rules, deploying, or migrating remains adapter/policy gated.

---

## Target files

```text
src/recovery/
  types.ts
  evidence-graph.ts
  ci-baseline.ts
  classify.ts
  supersession.ts
  salvage.ts
  reconcile.ts
  planner.ts
src/cli/index.ts
src/index.ts
skills/git-skill-pro/references/recovery.md
tests/
  recovery-graph.test.ts
  recovery-ci.test.ts
  recovery-classify.test.ts
  recovery-salvage.test.ts
  recovery-plan.test.ts
  recovery-acceptance.test.ts
  fixtures/recovery/messy-project.json
```

---

### Task 1: Recovery snapshot and evidence graph

**Files:** `src/recovery/types.ts`, `src/recovery/evidence-graph.ts`, `tests/recovery-graph.test.ts`.

- [ ] Write a failing test proving explicit issue/PR/commit/deployment links are preserved while two same-title artifacts remain unlinked.
- [ ] Run `npm test -- tests/recovery-graph.test.ts` and confirm failure.
- [ ] Define `RecoveryArtifact`, `RecoveryArtifactType`, `RecoveryEdge`, `RecoverySnapshot`, `RecoveryClassification`, and `buildRecoveryEvidenceGraph`.
- [ ] Graph edges carry `explicit | inferred`, evidence references, and reason. Inference requires supplied evidence such as shared stable issue ID, explicit replacement text/metadata, ancestry, or provider-native relationship; title similarity alone is ignored.
- [ ] Run the focused test and typecheck; commit.

### Task 2: Default-branch CI baseline diagnosis

**Files:** `src/recovery/ci-baseline.ts`, `tests/recovery-ci.test.ts`.

- [ ] Write failing tests for: (a) same failure fingerprint on main and three PRs -> `baseline_broken`; (b) main green and one PR unique failure -> `pr_specific`; (c) insufficient main evidence -> `unknown`.
- [ ] Run red test.
- [ ] Implement `FailureFingerprint`, `CiRunEvidence`, `diagnoseCiBaseline` and `classifyPrCiFailure`.
- [ ] Fingerprints are normalized check/job + stable error category/signature supplied by adapters; timestamps are not fingerprints.
- [ ] Run green test + typecheck; commit.

### Task 3: PR/work artifact classification and supersession graph

**Files:** `src/recovery/classify.ts`, `src/recovery/supersession.ts`, `tests/recovery-classify.test.ts`.

- [ ] Write failing tests classifying current, stale, duplicate, superseded, abandoned, orphaned, conflicted, baseline-CI-failed, PR-specific-failed, merged-but-tracker-open, tracker-done-but-unmerged and unknown.
- [ ] Add a test proving a newer timestamp alone does not establish supersession.
- [ ] Implement classification as a set of labels with reasons/evidence, not one lossy enum.
- [ ] Explicit provider/tracker supersession wins; inferred supersession requires at least a stable shared work ID plus replacement evidence. Preserve old artifacts.
- [ ] Run green tests; commit.

### Task 4: Selective salvage planner

**Files:** `src/recovery/salvage.ts`, `tests/recovery-salvage.test.ts`.

- [ ] Write failing tests: stale PR with selected useful commits -> fresh branch + inspected cherry-picks; obsolete architecture -> reimplement; baseline-CI-only failure -> rerun after baseline fix; unsafe/unknown -> hold for evidence.
- [ ] Verify red.
- [ ] Implement `planSalvage` returning strategy `fresh_branch_cherry_pick | patch_selected | reimplement_current_spec | rerun_after_baseline | hold_unknown | no_salvage` plus selected commit/file references and required validations.
- [ ] Never recommend merging the entire stale branch merely because useful work exists.
- [ ] Verify green; commit.

### Task 5: Tracker/code/runtime reconciliation

**Files:** `src/recovery/reconcile.ts`, `tests/recovery-classify.test.ts`.

- [ ] Add failing tests for issue done/PR unmerged, PR merged/issue in-progress, Bead in-progress after merged work, GitHub issue closed but production verification failed, and blocker resolved by merged evidence.
- [ ] Implement `reconcileProjectState` producing proposed status/relationship corrections with source evidence and authority domain; no write is executed.
- [ ] Corrections preserve history and distinguish observed mismatch from proposed mutation.
- [ ] Verify green; commit.

### Task 6: Lane-based project recovery planner

**Files:** `src/recovery/planner.ts`, `tests/recovery-plan.test.ts`, `tests/fixtures/recovery/messy-project.json`.

- [ ] Create an adversarial fixture: broken default-branch CI shared by multiple PRs, one PR-specific failure, explicit supersession chain, duplicate active work, abandoned branch, tracker drift, deployed revision behind newest merge, unknown database rollback compatibility.
- [ ] Write failing test expecting lanes: work-graph reconciliation, CI baseline repair, governance audit, PR salvage/cleanup, deployment/database reconciliation, proving issue.
- [ ] Implement `planProjectRecovery(snapshot)` producing health summary, evidence graph, classifications, CI diagnosis, salvage set, close/abandon proposals, unknowns, explicit-authority requirements, and ordered recovery work items.
- [ ] Recovery plan marks parallelizable lanes only when mutation scopes are disjoint.
- [ ] Verify green; commit.

### Task 7: Recovery CLI + Skill reference

**Files:** `src/cli/index.ts`, `skills/git-skill-pro/references/recovery.md`, `skills/git-skill-pro/SKILL.md`, `tests/cli.test.ts`, `tests/skill-contract.test.ts`.

- [ ] Add failing CLI tests for `gsp recover project <snapshot.json> --json` and `gsp recover ci <snapshot.json> --json`.
- [ ] Add skill test requiring recovery reference and rules: default-branch baseline first, archaeology before cleanup, selective salvage, unknown remains valid.
- [ ] Verify red.
- [ ] Implement JSON snapshot loading with strict top-level shape checks; do not execute paths/scripts from input.
- [ ] Add `recovery.md` with safety freeze, inventory, evidence graph, classification, CI baseline, salvage and proof-of-recovery flow.
- [ ] Verify green; commit.

### Task 8: Public API and recovery acceptance

**Files:** `src/index.ts`, `tests/recovery-acceptance.test.ts`, `README.md`, `.github/workflows/ci.yml`.

- [ ] Write failing acceptance test importing recovery APIs from package root and processing the messy fixture end-to-end.
- [ ] Verify red.
- [ ] Export recovery modules; update README.
- [ ] CI smoke: `node dist/cli/index.js recover project tests/fixtures/recovery/messy-project.json --json` and `recover ci ...`; retain tracked-state cleanliness check.
- [ ] Run full verification: `npm ci --ignore-scripts`, typecheck, tests, build, pack dry-run, all existing CLI smoke commands plus recovery commands.

---

## Acceptance criteria

The recovery layer is acceptable when it can: reconstruct explicit evidence relationships; refuse name-only identity; diagnose shared default-branch CI failures separately from PR-specific failures; preserve explicit duplicate/supersession; classify unknown honestly; propose selective salvage rather than stale-branch merges; identify tracker/code/runtime mismatches; produce ordered recovery lanes; and do all of this without performing cleanup or provider mutations.
