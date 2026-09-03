# GitSkillPro — Canonical Specification v0.2

**Version:** 0.2-design

**Status:** Canonical workflow extension and partial supersession of `SPEC.md`

**Repository:** `skysthelimitpainting1779-collab/gitskillpro`

This specification extends `SPEC.md` with project-management, issue-tracking, greenfield-bootstrap, agent-comment, agent-review, and repository-governance requirements. Where this file conflicts with `SPEC.md`, this v0.2 specification wins. All requirements in `SPEC.md` that are not modified here remain normative.

GitSkillPro v0.2 is an end-to-end software-workflow operating system for coding agents. It coordinates work intent, repository state, agent delegation, pull requests, review, CI, repository rules, deployment, databases, and completion without collapsing those systems into one source of truth.

---

## 1. Canonical truth boundaries

GitSkillPro MUST preserve the following authority boundaries:

- **Project/issue tracker** — canonical for work intent, priority, dependencies, assignment/delegation, milestones, and work status.
- **Git repository** — canonical for commits, refs, local working-tree/index state, and version history.
- **SCM platform (GitHub/GitLab/etc.)** — canonical for remote branches, pull requests/change requests, review threads, merge state, checks, repository rules, and remote collaboration state.
- **CI provider** — canonical for CI execution evidence.
- **Deployment/infrastructure provider** — canonical for deployment and runtime infrastructure evidence.
- **Database/state provider** — canonical for migration/schema/data-state evidence within its observable boundary.

A status copied from one system into another is a projection/link, not a replacement for the source system's truth.

---

## 2. Universal software-work lifecycle

GitSkillPro MUST support this full lifecycle:

```text
INITIATIVE / OUTCOME (optional)
          ↓
PROJECT
          ↓
ISSUE / WORK ITEM
          ↓
READY CHECK
          ↓
CLAIM / DELEGATE
          ↓
BRANCH + WORKTREE OR REMOTE ISOLATION
          ↓
IMPLEMENT
          ↓
AGENT PROGRESS / MATERIAL COMMENTS
          ↓
LOCAL VERIFICATION
          ↓
PULL REQUEST
          ↓
INDEPENDENT AGENT REVIEW
          ↓
CI / SECURITY / POLICY CHECKS
          ↓
MERGE READINESS
          ↓
MERGE
          ↓
DATABASE / DEPLOYMENT EXECUTION WHEN REQUIRED
          ↓
PRODUCTION VERIFICATION
          ↓
ISSUE COMPLETION
          ↓
PROJECT / MILESTONE STATUS UPDATE
          ↓
EVIDENCE + LEARNING / FOLLOW-UP ISSUES
```

GitSkillPro MUST NOT mark a work item complete merely because code was committed or a PR was opened.

The project's Definition of Done determines whether completion requires merge only, deployment, migration, production observation, documentation, release, or another explicit postcondition.

---

## 3. Work-management adapter model

GitSkillPro MUST add a first-class work-management adapter family alongside Git/SCM, CI, deployment, and database adapters.

Initial adapters/reference packs:

- Linear — first-class;
- GitHub Issues / GitHub Projects — first-class fallback and optional companion;
- GitLab Issues/Epics — adapter contract;
- Jira — adapter contract;
- Azure Boards — adapter contract;
- other issue/project systems through the same capability vocabulary.

The capability broker MUST prefer an already-authorized host-native connector/plugin when it exposes the required issue/project/comment capability.

If Linear is connected and configured as the work tracker, GitSkillPro SHOULD use the native Linear connector rather than duplicating credentials.

---

## 4. Linear — first-class work-management adapter

The Linear adapter MUST support, where the connected capability allows:

- projects;
- initiatives when used;
- issues;
- issue status;
- priority;
- labels;
- estimates when configured;
- assignee;
- agent delegate;
- parent/sub-issue relationships;
- blocking/blocked-by/related/duplicate relationships;
- cycles where used;
- milestones;
- releases where used;
- issue branch-name metadata;
- issue/project comments and replies;
- documents/resources/links;
- project status updates;
- issue/project lookup and search.

GitSkillPro MUST adapt to the team's actual Linear statuses instead of hard-coding one status vocabulary.

A recommended semantic mapping is:

```text
TRIAGE/BACKLOG
READY/TODO
IN PROGRESS
IN REVIEW
MERGED / DEPLOYING (optional project-specific states)
DONE
CANCELED
```

Actual Linear status names MUST be discovered and mapped to these semantic states.

---

## 5. Project hierarchy and scope

GitSkillPro MUST understand that projects and repositories are not necessarily one-to-one.

Supported topologies include:

- one project → one repository;
- one project → multiple repositories;
- multiple projects → one monorepo;
- initiative → multiple projects → multiple repositories;
- issue → one repository;
- issue → coordinated changes across multiple repositories when explicitly modeled.

Repository/project relationships MUST be explicit in configuration, issue metadata, project resources, or another authoritative mapping. GitSkillPro MUST NOT join systems merely because their names look similar.

A project SHOULD define:

- outcome;
- scope;
- owning team;
- repositories;
- environments/providers;
- milestones/releases where used;
- Definition of Ready;
- Definition of Done;
- risk policy overrides;
- required review policy;
- deployment/database completion requirements.

---

## 6. Issue contract

Every implementation task SHOULD originate from an issue/work item unless the task is an explicitly authorized emergency or trivial administrative operation.

An implementation-ready issue SHOULD contain or derive:

- stable issue identifier;
- requested outcome;
- rationale/context;
- explicit scope;
- acceptance criteria;
- non-goals where ambiguity exists;
- dependencies/blockers;
- owning project/team;
- priority;
- risk indicators;
- affected repository/repositories;
- deployment implications when known;
- database implications when known;
- required verification;
- Definition of Done.

GitSkillPro MUST distinguish an **issue description** from later **agent claims** about what was implemented.

### 6.1 Definition of Ready

Before implementation, GitSkillPro SHOULD verify:

- outcome is understandable;
- target repository is resolved;
- blockers are not unresolved or are explicitly accepted;
- acceptance criteria are testable enough for the risk tier;
- required authority exists;
- destructive/production work has necessary escalation or governance.

If the issue is underspecified but low-risk and safely inferable, GitSkillPro MAY propose concrete acceptance criteria and record them before implementation. Material ambiguity MUST be escalated rather than guessed.

---

## 7. Issue-to-branch/worktree protocol

When work begins:

1. refresh the issue and project state;
2. refresh repository/default-branch state;
3. move the issue into the team's semantic `IN PROGRESS` state when authorized;
4. assign or delegate the issue to the responsible agent when the tracker supports it;
5. derive a branch name from repository policy and the stable issue identifier;
6. create an isolated worktree when local worktrees are available, otherwise an isolated remote branch/session;
7. record issue ID, project ID, base SHA, branch, worktree/session identity, and agent identity in the delegation/evidence packet.

Recommended branch naming form:

```text
<type>/<issue-id>-<short-slug>
```

Examples:

```text
feat/ENG-142-payment-retry
fix/ENG-188-oauth-callback
chore/ENG-205-pin-actions
```

The exact pattern MUST be repository-configurable and SHOULD use the issue tracker identifier when integration/linking benefits from it.

---

## 8. Issue ↔ PR linking

GitSkillPro MUST create a durable link between the work item and the PR/change request.

When Linear's GitHub integration is configured, GitSkillPro SHOULD use supported linking conventions such as the Linear issue identifier in branch names/PR metadata and configured workflow automation rather than inventing a parallel linkage system.

When automatic linking is unavailable, GitSkillPro MUST explicitly attach/store the PR URL or identifier on the issue/work item when authorized.

A PR body SHOULD include the work-item identifier and completion semantics appropriate to the integration.

One issue MAY produce multiple PRs. Multiple PRs MUST be tracked independently until all PRs required by the issue's Definition of Done are complete.

A PR MAY address multiple issues only when the relationship is explicit; GitSkillPro MUST NOT infer closure of unrelated issues from overlapping files.

---

## 9. Agent identity and authorship

GitSkillPro MUST preserve who performed a material action.

Where a provider distinguishes an agent author from a human `onBehalfOf` identity, both SHOULD be retained in evidence.

Agent-authored issue comments, PR comments, reviews, commits, and status updates MUST NOT masquerade as human-authored decisions.

Evidence SHOULD contain:

- agent/harness identity;
- role for the operation (implementer, reviewer, supervisor, CI diagnostician, deployment verifier, etc.);
- human/on-behalf-of principal when provided by the host;
- operation/evidence reference;
- relevant SHA/resource version.

---

## 10. Agent comment protocol

Agent comments are for coordination and evidence, not command-by-command narration.

GitSkillPro SHOULD write a comment only for a material state transition, decision, blocker, review result, or retained evidence checkpoint.

Recommended comment classes:

- `CLAIMED` — agent accepted/delegated the issue;
- `PLAN` — implementation approach when it materially affects coordination;
- `PROGRESS` — material milestone, not routine activity;
- `BLOCKED` — blocker with required next action;
- `CI_DIAGNOSIS` — root cause and evidence for a CI failure;
- `REVIEW` — independent review outcome;
- `MERGE_READY` — evidence-backed merge recommendation;
- `DEPLOYMENT` — deploy/readiness/health result;
- `DATABASE` — migration/readiness/verification result;
- `COMPLETION` — Definition-of-Done evidence;
- `FOLLOW_UP` — resulting issue/debt/risk.

A material agent comment SHOULD include:

```text
Agent/role
Current work item
Branch/PR/SHA when relevant
State/result
Evidence
Risk/blockers
Next required action
```

GitSkillPro MUST avoid flooding Linear/GitHub with comments for every shell command, commit, or test invocation.

---

## 11. Discussion placement rules

To prevent duplicate/conflicting conversations:

- code-line findings belong in PR inline review comments when possible;
- PR-wide code-review findings belong in the PR review/PR conversation;
- work scope, priority, blockers, and project decisions belong in the issue/project tracker;
- a concise review/CI/deployment summary MAY be projected back to the work item;
- detailed logs SHOULD be referenced, not pasted in full, unless needed for durable diagnosis;
- the same disagreement SHOULD NOT be independently litigated in multiple systems without cross-links.

If Linear/GitHub review synchronization is active, GitSkillPro SHOULD use the integrated path while preserving GitHub PR state as the code-integration source of truth.

---

## 12. Independent agent-review protocol

The existing autonomous PR rules in `SPEC.md` remain normative and are expanded as follows.

The implementer and reviewer SHOULD be different agent contexts for R2 changes and MUST be different contexts for R3 changes.

A reviewer MUST inspect:

- issue outcome and acceptance criteria;
- actual diff/patch;
- changed configuration/workflows;
- tests/static checks;
- CI evidence;
- dependency/security implications;
- database implications;
- deployment implications;
- repository-policy compliance;
- whether the implementation exceeded issue scope;
- rollback/forward-fix feasibility.

Review finding severities:

- **BLOCKER** — merge MUST stop;
- **MAJOR** — merge SHOULD stop unless explicitly waived by policy/authority;
- **MINOR** — improvement that does not normally block;
- **NOTE** — informational/contextual.

The reviewer SHOULD place findings on exact changed lines when possible and MUST provide a PR-level summary/recommendation.

The review result MUST be bound to the reviewed head SHA. A later material push invalidates review freshness according to repository policy.

---

## 13. Review resolution loop

For blocking review findings:

```text
REVIEW FINDING
   ↓
IMPLEMENTER ACKNOWLEDGES / DISPUTES WITH EVIDENCE
   ↓
FIX IN SAME TASK BRANCH
   ↓
LOCAL VERIFY
   ↓
PUSH
   ↓
CI REFRESH
   ↓
RE-REVIEW CHANGED HEAD
   ↓
RESOLVE THREAD ONLY WHEN EVIDENCE SUPPORTS RESOLUTION
```

Agents MUST NOT resolve review threads merely to satisfy a merge gate.

If implementer and reviewer disagree materially, the disagreement MUST remain explicit and be escalated or resolved through evidence/policy rather than silently overwritten.

---

## 14. Greenfield project bootstrap

GitSkillPro MUST support the case where the user says, in effect, "start a new project correctly."

The bootstrap process MUST begin with discovery rather than immediately writing application code.

### 14.1 Bootstrap Phase A — resolve project scope

Determine:

- project/outcome name;
- owning workspace/team;
- target repository or whether a repository must be created;
- public/private intent;
- stack/runtime when known;
- deployment target when known;
- database/state systems when known;
- issue tracker preference;
- risk/governance requirements;
- whether project is single-repo, multi-repo, or monorepo.

### 14.2 Bootstrap Phase B — work-management setup

When Linear is configured as canonical work management, GitSkillPro SHOULD establish or audit:

- team;
- project;
- optional initiative;
- project description/outcome;
- milestones where useful;
- issue status mapping;
- labels only where they encode useful workflow semantics;
- Definition of Ready;
- Definition of Done;
- initial architecture/bootstrap issues;
- blocker/dependency relationships;
- project/repository resource links.

GitSkillPro MUST NOT create duplicate Linear and GitHub issue backlogs unless explicit sync or dual-system policy exists.

If no external issue tracker is configured, GitHub Issues MAY become the work tracker.

### 14.3 Bootstrap Phase C — repository baseline

For a new repository, GitSkillPro SHOULD establish or audit as appropriate:

- default branch;
- `.gitignore` appropriate to the detected stack;
- license if the owner has selected one;
- `README.md`;
- repository-agent instructions such as `AGENTS.md` where the agent ecosystem uses them;
- contribution/workflow documentation when useful;
- security reporting policy where appropriate;
- dependency/lockfile policy;
- runtime/toolchain version pinning strategy;
- formatter/lint/typecheck/test/build commands appropriate to the stack;
- issue template(s) when GitHub Issues are used;
- PR template containing issue/evidence/risk/deploy/database fields;
- CODEOWNERS only when real ownership is known;
- dependency update automation when authorized;
- secret scanning/security features when supported/appropriate;
- `.gitskillpro.yml` mapping project, tracker, environments, providers, and policy.

GitSkillPro MUST NOT invent maintainers, code owners, licenses, security contacts, deployment accounts, or credentials.

### 14.4 Bootstrap Phase D — CI baseline

GitSkillPro SHOULD detect the stack and establish the minimum deterministic verification chain needed for safe PRs, for example:

```text
install / dependency integrity
lint / format check where used
typecheck / compile where applicable
unit tests
integration/contract tests where applicable
build/package validation
security/dependency checks appropriate to the project
provider-specific validation where relevant
```

Required checks MUST reference real workflow/check names that exist. Repository rules MUST NOT require nonexistent checks.

### 14.5 Bootstrap Phase E — repository governance

GitSkillPro SHOULD propose and, when authorized, configure repository rules/rulesets for the default/protected branch.

Baseline policy for agent-heavy repos SHOULD consider:

- require pull request before merge;
- block force pushes to protected/default branch;
- block deletion of protected/default branch;
- require relevant status checks;
- require conversation resolution;
- require branch to be current or use merge queue when concurrency justifies it;
- restrict bypass actors to explicitly authorized identities/apps;
- require signed commits only when the signing infrastructure is actually available;
- require deployments before merge only when the environment/check semantics truly support that model;
- code scanning/dependency review gates when configured;
- allowed merge methods selected deliberately;
- merge queue for sufficiently concurrent supported repositories.

GitSkillPro MUST audit layered rulesets/branch protections rather than assuming one visible rule is the full effective policy.

Repository-rule changes are governance mutations and MUST respect the risk/authority model in `SPEC.md`.

### 14.6 Bootstrap Phase F — environments and deployment

When deployment exists, bootstrap/audit:

- development/preview/staging/production distinction as appropriate;
- provider project mapping;
- preview deployment strategy;
- protected production environment semantics;
- secret/variable scopes without exposing values;
- domain/DNS ownership boundaries;
- deployment checks;
- rollback path;
- health/smoke validation.

### 14.7 Bootstrap Phase G — database baseline

When stateful systems exist, bootstrap/audit:

- development vs production database identity;
- migration framework;
- schema source of truth;
- migration history/versioning;
- backup/PITR/restore capabilities;
- RLS/permissions when relevant;
- migration CI validation;
- seed/test-data policy;
- prohibition against accidental production resets/seeds;
- rollback/forward-fix expectations.

### 14.8 Bootstrap Phase H — first issue-to-PR proof

A project bootstrap is not proven complete until at least one representative low-risk issue can traverse the configured workflow:

```text
issue -> claim -> branch/worktree -> change -> local checks -> PR -> agent review -> CI -> merge -> issue completion
```

If deployment/database gates are part of normal Definition of Done, the proving issue SHOULD traverse those as well in a safe non-production or approved target.

---

## 15. Existing-repository onboarding

GitSkillPro MUST also handle brownfield repositories.

Before imposing a greenfield flow, audit:

- current branch strategy;
- existing issue tracker/project links;
- existing GitHub/SCM integration;
- current rulesets/branch protections;
- current CI checks;
- deployment integrations;
- database migrations;
- repository-native instructions;
- active PRs/issues;
- existing automation/bots;
- merge conventions;
- release process;
- gaps and contradictions.

GitSkillPro SHOULD preserve working conventions unless they conflict with explicit policy/safety requirements. It MUST NOT "standardize" a repository by destructively replacing established workflows without approval.

---

## 16. Repository rules audit

`gsp audit workflow` / the equivalent MCP tool MUST evaluate whether issue-to-merge flow is mechanically enforceable.

Audit categories include:

- default branch identity;
- direct-push exposure;
- force-push/deletion exposure;
- PR requirement;
- required check configuration;
- strict/up-to-date semantics;
- check source trust when configurable;
- conversation-resolution requirement;
- review requirements;
- stale-review behavior;
- latest-push review behavior;
- bypass actors/apps;
- merge methods;
- merge queue configuration/support;
- deployment-before-merge rules;
- signed-commit rules;
- code scanning/dependency review gates;
- overlapping/layered rulesets and branch protections;
- required checks that no longer exist;
- workflows whose names/trigger behavior do not satisfy configured rules.

The auditor MUST distinguish **recommended hardening** from **actual blockers** and **current root causes**.

---

## 17. Issue/PR status synchronization

GitSkillPro SHOULD support policy-driven work-status synchronization.

Default semantic transitions:

```text
issue becomes implementation-ready
    -> READY/TODO

agent claims/delegates and branch/worktree exists
    -> IN PROGRESS

PR opened
    -> IN REVIEW (if team workflow supports it)

PR changes requested
    -> remains IN REVIEW or team-specific blocked state

PR merged
    -> MERGED/DEPLOYING if post-merge work remains
    -> DONE only if Definition of Done is satisfied

deployment/database verification succeeds when required
    -> DONE
```

If the connected Linear/GitHub integration already automates a transition, GitSkillPro SHOULD avoid duplicating the update unless verification shows the automation failed.

Status automation MUST be idempotent and must not oscillate issue state because two integrations disagree.

---

## 18. Completion protocol

Before closing/completing an issue, GitSkillPro MUST evaluate its Definition of Done.

Possible required evidence:

- accepted PR merged at expected SHA;
- all required PRs merged;
- CI passed for the relevant final SHA;
- unresolved blockers/review threads cleared legitimately;
- documentation updated;
- migrations applied and verified;
- deployment succeeded;
- smoke/health checks passed;
- release created/published when required;
- follow-up issues created for accepted residual risk.

The completion comment SHOULD summarize evidence and link to the PR/deployment/database evidence rather than merely saying "done."

---

## 19. Project/milestone status updates

GitSkillPro MAY create project/milestone status updates at meaningful checkpoints, especially when multiple issues are coordinated.

A project status update SHOULD summarize:

- completed outcomes;
- current milestone progress;
- blockers/risks;
- material scope changes;
- deployment/release state;
- next critical path.

It SHOULD NOT dump per-command agent logs into project status updates.

---

## 20. Cross-repo and multi-agent projects

For a project spanning repositories, GitSkillPro MUST maintain explicit linkage between:

- project;
- issue;
- repository;
- branch/worktree/session;
- PR;
- deployment/database targets;
- responsible agent.

Cross-repo work SHOULD be decomposed into child issues or a coordination issue when independent integration units exist.

GitSkillPro MUST NOT merge unrelated repositories into one implicit transaction. Each repository keeps its own Git/CI/merge truth and evidence.

A parent coordination issue/project may aggregate completion only after all required child integration units meet their Definitions of Done.

---

## 21. Agent delegation through Linear

When Linear exposes agent delegation, GitSkillPro MAY use the issue delegate field as a work-assignment signal.

Delegation does not replace repository isolation.

The full delegation contract remains:

```text
issue assignment/delegate
+ repository
+ branch
+ worktree/session
+ base SHA
+ scope
+ acceptance criteria
+ required verification
+ allowed authority
+ completion/evidence contract
```

A Linear delegate value alone MUST NOT be treated as an exclusive lock on code or infrastructure.

---

## 22. Agent comments vs agent reviews

GitSkillPro MUST distinguish:

- **comment** — discussion/status/evidence note;
- **review** — structured evaluation of a concrete PR/diff/head SHA;
- **approval** — review conclusion under repository policy;
- **merge recommendation** — GitSkillPro policy result;
- **merge authorization** — repository/governance authority;
- **merge execution** — actual SCM mutation.

These are separate events. An agent saying "looks good" in a Linear comment MUST NOT satisfy a required GitHub review gate unless the SCM/repository policy recognizes it as such.

---

## 23. GitHub PR templates and machine-readable evidence

For repositories using autonomous review, GitSkillPro SHOULD create/audit a PR template containing fields such as:

```markdown
## Issue / Project

## Outcome

## Scope

## Changes

## Risk tier

## Verification

## CI

## Independent review

## Database implications

## Deployment implications

## Rollback / forward-fix

## Known unknowns
```

The human-readable PR description MAY be backed by a machine-readable evidence packet; neither replaces the other.

---

## 24. Greenfield default workflow recommendation

When the user requests "set this project up properly" and has not supplied another workflow, GitSkillPro SHOULD recommend this baseline:

```text
Linear Project (or GitHub Project fallback)
   ↓
Issue with acceptance criteria
   ↓
Agent claims/delegates issue
   ↓
Issue-ID task branch
   ↓
Dedicated worktree per local agent
   ↓
Test-first implementation where appropriate
   ↓
Push task branch
   ↓
Draft PR while incomplete
   ↓
Ready PR with evidence
   ↓
Independent reviewer agent
   ↓
Required CI/security checks
   ↓
Resolve review threads
   ↓
Revalidate latest head/base
   ↓
Merge through configured strategy/queue
   ↓
Deploy/migrate where required
   ↓
Verify runtime/data
   ↓
Complete issue
   ↓
Update project/milestone
```

Direct pushes to the default branch SHOULD be disallowed for normal agent-authored feature/fix work.

---

## 25. CLI additions

GitSkillPro v0.2 SHOULD add:

```text
gsp bootstrap
gsp audit workflow
gsp audit project
gsp audit issue
gsp issue plan <issue-id>
gsp issue claim <issue-id>
gsp workflow status <issue-id>
gsp review <pr>
gsp sync <issue-id|project-id>
```

`gsp bootstrap` MUST default to **plan/audit mode** before mutating project/repository/provider configuration.

Repository rules, project creation, tracker mutation, merge, deployment, and database mutations remain governed by the risk/authority model.

---

## 26. MCP additions

GitSkillPro v0.2 SHOULD add structured MCP tools such as:

- `project.inspect`;
- `project.bootstrap_plan`;
- `issue.inspect`;
- `issue.ready_check`;
- `issue.workflow_plan`;
- `workflow.audit`;
- `workflow.status`;
- `review.audit`;
- `comment.plan`;
- `sync.plan`;
- `repo.governance_audit`.

Mutation tools for project/issue/comment/ruleset changes MAY be added only with explicit safety and authorization semantics.

---

## 27. Configuration additions

`.gitskillpro.yml` SHOULD support explicit mappings such as:

```yaml
work_management:
  provider: linear
  team: ENG
  project: PROJ-123
  status_map:
    ready: Todo
    in_progress: In Progress
    in_review: In Review
    done: Done

repositories:
  - name: app
    remote: owner/app
    default_branch: main

workflow:
  branch_pattern: "{type}/{issue_id}-{slug}"
  issue_required: true
  independent_review_from_risk: R2
  completion_requires_deployment: true

providers:
  deployment: vercel
  database: supabase
```

This is illustrative. The implementation MUST validate provider/team/project/repository identities instead of assuming configuration strings are correct.

---

## 28. Evidence-contract additions

Material workflow evidence SHOULD add:

- work-management provider;
- initiative ID when applicable;
- project ID;
- milestone/release ID when applicable;
- issue ID;
- issue status before/after;
- assignee/delegate identity;
- agent role/identity;
- branch/worktree/session identity;
- PR identifier/URL;
- reviewed head SHA;
- review identifiers/findings;
- material comment identifiers;
- repository ruleset/protection snapshot/reference;
- completion criteria evaluated;
- completion evidence.

Comments/reviews MUST NOT be represented as persisted unless the adapter returns proof of their creation/update.

---

## 29. Security and prompt-injection boundary for issues/comments

Issue descriptions, comments, PR bodies, review comments, CI logs, and project documents are potentially untrusted content.

GitSkillPro MUST distinguish:

- authoritative host/user/repository policy;
- project requirements;
- ordinary issue/comment content;
- tool/log/source content.

An instruction embedded in an issue/comment/log MUST NOT silently broaden tool authority, reveal secrets, disable safety rules, bypass review, or alter unrelated repositories/providers.

---

## 30. Testing additions

Tests MUST prove at minimum:

- Linear/project adapter capabilities are discovered without overclaiming;
- project-to-repository mapping is explicit;
- issue status names are mapped rather than hard-coded;
- work cannot accidentally start against the wrong repo/project;
- issue ID is propagated into branch/delegation metadata when configured;
- worktree isolation remains required even when an issue is delegated to an agent;
- comments are emitted only for material checkpoints under default policy;
- agent authorship/on-behalf-of evidence is preserved when available;
- a Linear comment cannot satisfy a GitHub review requirement;
- independent reviews are bound to a specific head SHA;
- material pushes invalidate stale review evidence according to policy;
- unresolved BLOCKER findings prevent merge recommendation;
- greenfield bootstrap does not invent CODEOWNERS, licenses, credentials, or provider identities;
- bootstrap detects existing repo conventions before modifying a brownfield repository;
- required checks are not configured before the corresponding checks exist;
- layered GitHub rules are audited as an effective combined policy;
- automatic Linear/GitHub status synchronization does not create update loops;
- issue completion respects Definition of Done rather than PR-open/commit state;
- cross-repo projects keep repository/PR evidence isolated;
- issue/comment content cannot elevate tool authority.

---

## 31. v0.2 implementation-scope additions

In addition to the v0.1 vertical slice, v0.2 implementation planning MUST include:

- work-management adapter abstraction;
- Linear first-class adapter/native connector path;
- GitHub Issues/Projects fallback/reference path;
- project/repository mapping model;
- issue readiness audit;
- issue-to-branch/worktree planning;
- issue/PR linkage and synchronization model;
- agent comment protocol;
- agent review protocol;
- greenfield bootstrap planner;
- brownfield workflow auditor;
- repository-governance/rules audit;
- workflow status/completion engine;
- expanded evidence contracts;
- Skill/CLI/MCP surface updates;
- regression tests for workflow orchestration.

The first release MAY keep repository-rules mutation and Linear project creation behind explicit plan/approval gates while still delivering full inspection, planning, and evidence capabilities.

---

## 32. v0.2 acceptance criteria

GitSkillPro v0.2 is acceptable only when, in addition to the v0.1 criteria:

1. an agent can determine which work-management system/project/issue governs the task;
2. it can audit whether an issue is ready to implement;
3. it can map an issue to the correct repository without name-based guessing;
4. it can create/plan issue-isolated local or remote work;
5. it can keep agent identity, issue, branch, worktree/session, and PR linked in evidence;
6. it can produce material agent comments without flooding the tracker;
7. it can perform an independent review tied to the actual PR head SHA;
8. it can distinguish comment, review, approval, merge recommendation, authorization, and execution;
9. it can audit repository rules and detect gaps between intended and enforced workflow;
10. it can produce a safe greenfield bootstrap plan before application implementation;
11. it can onboard an existing repo without blindly replacing working conventions;
12. it can coordinate Linear/GitHub status transitions without duplicate-loop behavior;
13. it can enforce Definition of Done before issue completion;
14. it can aggregate multi-repo project progress without mixing repository truth;
15. its Skill, CLI, MCP, and provider adapters share the same workflow policy/evidence vocabulary.

---

## 33. Canonical rule

`SPEC.md` plus this explicitly versioned v0.2 specification form the current canonical design. Where they conflict, `SPEC-v0.2.md` supersedes `SPEC.md`.

The implementation plan MUST cover both documents and MUST treat this workflow layer as first-class rather than optional integration glue.
