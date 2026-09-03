# GitSkillPro — Canonical Specification v0.3

**Version:** 0.3-design

**Status:** Canonical recovery/work-graph extension and partial supersession of `SPEC.md` + `SPEC-v0.2.md`

**Repository:** `skysthelimitpainting1779-collab/gitskillpro`

This specification adds two first-class capabilities:

1. **work-graph adapters**, including Beads (`bd`) as a first-class execution tracker; and
2. **Project Takeover / Recovery Mode** for inherited repositories with broken CI, stale/failed PRs, duplicate or superseded work, conflicting tracker state, tangled branches, abandoned agent work, and uncertain deployment/database state.

Where this file conflicts with an older GitSkillPro specification, v0.3 wins. Older requirements remain normative unless modified here.

---

## 1. Work-management authority map

GitSkillPro MUST NOT assume there is exactly one work-management system.

A project may use:

- Linear for product/project planning;
- Beads for dependency-aware agent execution;
- GitHub Issues for external/community work;
- GitHub Projects for a delivery view;
- another tracker for compliance or operations.

GitSkillPro MUST resolve an explicit **authority map** describing which system is canonical for each semantic domain.

Example:

```text
Linear
  canonical: project outcome, roadmap, milestone, human-visible issue

Beads
  canonical: executable task graph, dependencies, agent claims, blockers, discovered work

GitHub
  canonical: branch, commit, PR, review, checks, merge state
```

A mirror or integration is a projection/link unless explicitly configured as authoritative.

GitSkillPro MUST NOT create uncontrolled bidirectional synchronization between trackers.

---

## 2. Work-graph adapter contract

In addition to project/issue tracker adapters, GitSkillPro MUST support a **work-graph adapter** optimized for executable dependency graphs.

Required semantic capabilities include, when supported by the provider:

- create/read/update/close work items;
- atomic claim or equivalent ownership transition;
- assignee/agent identity;
- parent/child hierarchy;
- blocking dependencies;
- related links;
- duplicate relationships;
- supersession relationships;
- discovered-from provenance;
- ready-work computation;
- stale-work detection;
- persistent project memory where explicitly supported;
- comments/messages where supported;
- local/offline state;
- remote synchronization/federation;
- health/doctor/preflight capabilities;
- backup/restore evidence.

Provider capability absence MUST be represented explicitly.

---

## 3. Beads (`bd`) — first-class work-graph adapter

GitSkillPro MUST detect Beads rather than blindly initialize it.

Detection SHOULD inspect, where available:

- `bd` presence and version;
- `.beads/` project configuration;
- project identity/prefix;
- Dolt backend mode;
- embedded vs per-project server vs shared-server mode;
- remote/federation configuration;
- synchronization state;
- worktree integration mode;
- database health;
- current issue/claim state;
- ready work;
- dependency graph;
- duplicate/superseded/stale/orphaned work;
- tracked vs runtime-only Beads files.

### 3.1 Version-aware behavior

Beads evolves quickly. GitSkillPro MUST NOT assume one fixed command surface.

The adapter MUST:

1. discover the installed version;
2. inspect supported commands/options when feasible;
3. use a versioned capability table;
4. treat unsupported/unknown commands as capability absence;
5. avoid destructive recovery recipes copied from another version without validating current state.

### 3.2 Core Beads semantics

Where supported, GitSkillPro SHOULD understand and use concepts equivalent to:

- `bd ready` for blocker-aware executable work;
- atomic claim semantics such as `bd update <id> --claim`;
- dependency edges;
- duplicates;
- supersession chains;
- discovered-from relationships;
- close/reopen/update flows;
- persistent Beads memory when the project explicitly uses it;
- Dolt pull/push/federation or configured remote sync;
- doctor/preflight/health operations.

The adapter MUST prefer semantic relationships such as duplicate/supersedes over deleting historical work.

### 3.3 Beads concurrency

GitSkillPro MUST account for the configured storage mode.

- Embedded/single-writer configurations MUST NOT be treated as safe concurrent multi-agent writers merely because multiple Git worktrees exist.
- Server/shared-server configurations MAY support concurrent agents, subject to actual health/capability evidence.
- Worktrees MUST NOT silently create independent competing Beads databases unless project policy explicitly requires that topology.

Before assigning several agents, GitSkillPro MUST prove that both Git isolation **and work-graph write concurrency** are safe.

### 3.4 Beads recovery safety

Beads itself can be unhealthy. GitSkillPro MUST distinguish:

- work graph is healthy but Git/CI is broken;
- Beads database/server is unhealthy;
- project identity mismatch;
- remote missing/misconfigured;
- local work not synchronized;
- stale database/runtime state;
- worktree cannot resolve the expected database;
- JSONL/export exists but may not be equivalent to current canonical database state;
- version-specific tool regression.

GitSkillPro MUST snapshot or preserve recoverable Beads state before destructive database repair.

It MUST NOT delete `.beads` runtime/database state merely because a bootstrap/doctor command failed.

---

## 4. Project Takeover / Recovery Mode

GitSkillPro MUST support a deliberate operating mode for an inherited unhealthy project:

```text
NORMAL MODE
GREENFIELD BOOTSTRAP MODE
TAKEOVER / RECOVERY MODE
INCIDENT MODE
```

Recovery mode is selected when one or more of the following are observed:

- default-branch CI is failing or historically unreliable;
- many open PRs are failed, stale, conflicted, abandoned, or overlapping;
- multiple branches appear to implement the same intent;
- issues are duplicated, stale, contradictory, or incorrectly marked in progress/done;
- work has explicit or inferred supersession chains;
- repository rules refer to nonexistent/stale checks;
- deployments do not clearly map to repository revisions;
- database migration state is uncertain;
- agents have left partial work in shared worktrees/branches;
- tracker state and GitHub state disagree materially;
- the current production truth is unclear.

Recovery mode MUST favor archaeology, classification, and reconciliation before mutation.

---

## 5. Recovery Phase 0 — Safety freeze

Before broad repair, GitSkillPro SHOULD temporarily suspend or avoid, where authority permits:

- automatic merge;
- automatic production deployment;
- destructive cleanup;
- bulk branch deletion;
- force pushes;
- bulk issue closure;
- database migrations;
- production data/resource mutation.

If the system cannot disable such automation, it MUST at least identify the active automations and account for them in the plan.

The freeze is not permission to change governance silently; if disabling a production automation is itself high-impact, GitSkillPro MUST escalate according to policy.

---

## 6. Recovery Phase 1 — Full inventory

GitSkillPro MUST inventory the project before proposing a cleanup.

### 6.1 Work systems

Inventory:

- projects/initiatives;
- Linear issues/projects when present;
- Beads issues/dependencies/claims when present;
- GitHub Issues/Projects when present;
- active agent comments/handoffs;
- tracker-to-repo mappings;
- tracker integrations/mirrors.

### 6.2 Repository state

Inventory:

- default branch and current head;
- protected/ruleset branches;
- local worktrees;
- dirty worktrees;
- stashes;
- local branches;
- remote branches;
- tags/releases;
- unpushed commits where observable;
- shallow/partial clone constraints;
- submodules/monorepo boundaries.

### 6.3 PR/review state

Inventory:

- open PRs;
- draft PRs;
- recently closed/unmerged PRs;
- merged PRs relevant to current unresolved issues;
- head/base SHAs;
- merge conflicts;
- review decisions;
- unresolved threads;
- check status/freshness;
- deployment checks;
- linked issues;
- likely overlapping changed files/intents.

### 6.4 CI/governance state

Inventory:

- workflow files;
- required checks;
- branch protections/rulesets;
- merge queues;
- environment/deployment gates;
- dependency/security checks;
- action/runtime versions;
- CI history on default branch;
- CI history on active PRs.

### 6.5 Runtime/data state

Inventory where observable:

- currently deployed production revision;
- preview/staging deployments;
- deployment health;
- database/schema/migration version;
- pending migrations;
- provider resources relevant to rollback;
- last-known-good deployment.

---

## 7. Recovery Phase 2 — Build the project evidence graph

GitSkillPro MUST reconstruct links between:

```text
PROJECT / INITIATIVE
        ↕
ISSUE / BEAD / WORK ITEM
        ↕
BRANCH / WORKTREE
        ↕
COMMITS
        ↕
PR
        ↕
REVIEWS / COMMENTS
        ↕
CI RUNS / CHECKS
        ↕
MERGE
        ↕
DEPLOYMENT
        ↕
DATABASE MIGRATION
        ↕
PRODUCTION EVIDENCE
```

Links MAY come from explicit metadata, issue identifiers in branch/PR/commit text, native integrations, commit ancestry, changed-file overlap, or documented handoffs.

Inferred links MUST be marked inferred. Name similarity alone is insufficient to make a canonical link.

---

## 8. Recovery Phase 3 — Classification

Each work item, branch, PR, and relevant deployment artifact MUST be classified into one or more states:

- current;
- ready;
- blocked;
- stale;
- duplicate;
- superseded;
- abandoned;
- orphaned;
- merged-but-tracker-open;
- tracker-done-but-not-merged;
- failed-because-default-branch-is-broken;
- failed-because-change-is-broken;
- failed-because-CI-is-broken;
- failed-because-provider/external-service-is-broken;
- conflicted;
- salvageable;
- unsafe-to-salvage;
- production-active;
- unknown / insufficient evidence.

Unknown MUST remain a valid outcome.

---

## 9. Supersession and duplicate resolution

GitSkillPro MUST treat supersession as a graph problem, not "newest timestamp wins."

Evidence may include:

- explicit Beads `supersedes` relationships;
- tracker duplicate/supersession metadata;
- issue/project decisions;
- PR comments/reviews;
- commit ancestry;
- later PRs intentionally replacing earlier PRs;
- changed-file/behavior overlap;
- deployed production revision.

When explicit relationships exist, preserve them.

When GitSkillPro infers supersession, it MUST record the evidence and confidence/uncertainty and MUST NOT delete the older work automatically.

A superseded PR SHOULD normally be closed with a link to its replacement only after the replacement relationship is proven.

---

## 10. Default-branch CI baseline rule

GitSkillPro MUST establish whether the target/default branch itself is healthy before interpreting PR failures.

If default-branch CI is broken:

1. create a separate CI-recovery diagnosis;
2. identify the last-known-good baseline where practical;
3. classify PR failures that share the baseline failure separately from PR-specific failures;
4. repair the CI harness or baseline independently when possible;
5. rerun/re-evaluate affected PRs only after the baseline is trustworthy.

GitSkillPro MUST NOT modify every failed PR to work around one broken shared workflow.

---

## 11. CI archaeology and repair

For tangled CI, GitSkillPro MUST examine history, not only the latest red run.

It SHOULD detect patterns such as:

- workflow changed and broke all subsequent PRs;
- required check name no longer matches emitted check;
- action/runtime upgrade introduced failures;
- secret/permission change broke jobs;
- concurrency settings cancel valid work;
- stale caches/artifacts poison builds;
- deployment integration reports failure into CI;
- external quota/provider outages create false code failures;
- path filters skip checks required by rulesets;
- monorepo package changes break only a subset of jobs;
- branch protection/rulesets require obsolete checks.

Recovery MUST separate **root-cause repair** from optional CI hardening.

---

## 12. PR archaeology and salvage

GitSkillPro MUST avoid the naive strategy of "merge/fix every open PR."

For each candidate PR it SHOULD determine:

- whether the underlying issue is still wanted;
- whether another PR supersedes it;
- whether part of its commits were already merged elsewhere;
- whether it depends on abandoned work;
- whether it is based on an obsolete architecture;
- whether its failing checks are baseline failures;
- whether it can be updated cleanly;
- whether only selected commits/files should be salvaged.

### 12.1 Salvage methods

Preferred salvage patterns include:

- fresh branch/worktree from a known-good base;
- cherry-pick selected commits after inspection;
- patch selected hunks/files;
- reimplement from the current issue/spec when old code is too stale;
- range-diff/merge-base analysis to prove what changed;
- close obsolete PR after replacement PR exists and evidence is linked.

GitSkillPro SHOULD NOT merge a large stale branch merely to "save the work."

---

## 13. Tracker reconciliation

Recovery mode MUST reconcile work-management state with code reality.

Examples:

- issue says `Done`, PR never merged;
- PR merged, issue remains `In Progress`;
- multiple agents claimed equivalent work;
- Beads has excessive stale `in_progress` claims;
- blocker already resolved by a merged change;
- duplicate issues remain independently active;
- superseded issue still appears ready;
- Linear parent issue is open but all executable Beads children are closed;
- GitHub issue closed but production verification failed.

Reconciliation MUST preserve history. Correct status/relationship state; do not erase the archaeological record.

---

## 14. Recovery planning output

Before broad mutations, `gsp recover project` MUST be able to emit a recovery plan containing:

- project health summary;
- authority map;
- repository baseline;
- CI baseline health;
- work graph health;
- PR inventory and classification;
- supersession/duplicate graph;
- branch/worktree inventory;
- current production revision;
- database/migration state;
- proposed salvage set;
- proposed close/abandon set;
- CI repair lane;
- governance repair lane;
- prioritized executable recovery issues/beads;
- risks and unknowns;
- operations that require explicit authority.

The plan MUST distinguish evidence-backed actions from inferred recommendations.

---

## 15. Recovery execution strategy

Recovery SHOULD be decomposed into independently verifiable lanes:

```text
LANE A — tracker/work-graph reconciliation
LANE B — default-branch CI baseline repair
LANE C — repository rules/governance repair
LANE D — PR salvage/supersession cleanup
LANE E — deployment/database reconciliation
LANE F — first clean proving issue through the restored workflow
```

Lanes may run concurrently only when their mutation scopes do not conflict.

Every recovery action SHOULD itself be represented as a work item in the configured canonical execution graph.

---

## 16. Restored-workflow proof

Recovery is not complete because the backlog looks cleaner.

GitSkillPro MUST prove the repaired operating system with at least one representative issue that successfully traverses the project's required lifecycle:

```text
READY
→ CLAIM
→ ISOLATED WORK
→ IMPLEMENT
→ LOCAL VERIFY
→ PR
→ INDEPENDENT REVIEW
→ CI
→ MERGE
→ DEPLOY/MIGRATE IF REQUIRED
→ PRODUCTION VERIFY
→ ISSUE CLOSE
```

Only then MAY the project be classified as recovered/healthy, subject to remaining known debt.

---

## 17. New CLI surface

v0.3 adds:

```text
gsp audit workgraph
gsp audit beads
gsp audit backlog
gsp reconcile
gsp recover project
gsp recover ci
gsp recover pr <id>
gsp graph project
gsp classify pr
gsp classify issue
gsp salvage plan
```

Read-only inventory/classification is the default. Mutation requires normal GitSkillPro policy/authority gates.

---

## 18. New MCP surface

v0.3 SHOULD expose structured tools equivalent to:

- `workgraph.inspect`;
- `workgraph.ready`;
- `workgraph.health`;
- `beads.inspect`;
- `project.inventory`;
- `project.graph`;
- `project.reconcile`;
- `recovery.plan`;
- `recovery.classify_pr`;
- `recovery.classify_work_item`;
- `recovery.salvage_plan`.

Mutation tools for tracker cleanup, PR closure, branch deletion, Beads repair, or CI/governance repair MUST remain separately risk-gated.

---

## 19. Evidence additions

Recovery evidence MUST additionally record:

- tracker authority map;
- work-item identity across trackers;
- explicit/inferred artifact links;
- supersession/duplicate relationships;
- baseline CI health;
- artifact classification reason;
- salvage provenance;
- abandoned/closed artifact reason;
- work-graph health evidence;
- production/database reconciliation evidence;
- recovery-phase completion state.

---

## 20. Test fixtures required by v0.3

GitSkillPro MUST include adversarial fixture projects representing at least:

1. healthy Beads + multiple local worktrees;
2. unsafe single-writer Beads + concurrent-agent attempt;
3. Beads project identity/remote mismatch;
4. broken default-branch GitHub Actions affecting many PRs;
5. stale required-check rule after workflow rename;
6. ten open PRs where only three are current and several supersede each other;
7. duplicate Linear/Beads/GitHub work items with an explicit authority map;
8. issue marked done while PR is unmerged;
9. merged PR with stale in-progress Bead;
10. old branch partially merged into a newer implementation;
11. tangled commit history requiring selective salvage;
12. deployment revision that does not match the newest merged commit;
13. database migration that makes a code rollback incompatible;
14. abandoned dirty worktree belonging to another agent;
15. external provider outage that caused CI failures unrelated to code.

Tests MUST prove recovery does not destroy unexplained work or falsely classify uncertain state as resolved.

---

## 21. v0.3 acceptance criteria

GitSkillPro v0.3 is acceptable only when it can:

1. discover whether a project uses Linear, Beads, GitHub Issues, or a layered combination;
2. create an explicit authority map instead of silently syncing trackers;
3. inspect Beads health/capabilities without assuming a fixed `bd` version;
4. account for Beads storage/concurrency mode before multi-agent delegation;
5. enter recovery mode without immediately deleting/closing/rebasing stale artifacts;
6. reconstruct a project evidence graph across issues, branches, commits, PRs, CI, deploys, and databases;
7. distinguish baseline CI breakage from PR-specific breakage;
8. identify duplicates/supersession chains without using timestamp alone;
9. generate a selective salvage plan for stale PRs/branches;
10. reconcile tracker state with actual merge/deploy evidence;
11. preserve unexplained work;
12. produce a prioritized recovery work graph;
13. re-establish rules/CI/review flow;
14. prove the recovered workflow with a clean end-to-end issue.

---

## 22. Canonical rule

The implementation plan MUST read, in order:

1. `SPEC.md`;
2. `SPEC-v0.2.md`;
3. `SPEC-v0.3.md`.

The newest specification wins where requirements conflict.
