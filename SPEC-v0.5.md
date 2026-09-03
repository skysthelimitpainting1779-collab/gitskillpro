# GitSkillPro — Canonical Specification v0.5

**Version:** 0.5-design

**Status:** Canonical repository-automation extension and partial supersession of prior GitSkillPro specifications

This specification adds first-class handling for **auto-commit scripts, Git hooks, watchers, code generators, bot-authored commits, automated pushes, automated PR creation, automated merge, dependency-update bots, release/version bots, and other background processes that mutate repository state**.

Where this specification conflicts with an older specification, v0.5 wins. Older requirements remain normative unless modified here.

---

## 1. Automation is an actor

GitSkillPro MUST model every process capable of mutating repository state as an **automation actor**.

Examples include:

- user-authored auto-commit scripts;
- agent checkpoint/snapshot scripts;
- Git hooks;
- Husky / Lefthook / pre-commit style hook managers;
- lint-staged or formatter fixup hooks;
- file watchers;
- cron/systemd/PM2 scheduled scripts;
- CI workflows that run `git commit` or `git push`;
- code generators;
- schema/client generators;
- changelog/version/release bots;
- dependency-update bots such as Dependabot/Renovate-style actors;
- documentation generators;
- synchronization/mirroring bots;
- IDE/plugin background Git automation;
- hosted coding agents;
- repository-integrated tools that write tracked metadata.

Automation actors MUST be included in concurrency analysis. GitSkillPro MUST NOT assume humans and explicitly spawned agents are the only writers.

---

## 2. Separate automation capabilities

The following capabilities are distinct and MUST be authorized separately:

```text
AUTO-STAGE
AUTO-COMMIT
AUTO-PUSH
AUTO-PR
AUTO-REVIEW
AUTO-MERGE
AUTO-DEPLOY
```

Possessing one capability does not imply any other capability.

Examples:

- an agent MAY be authorized to create local checkpoint commits but forbidden to push;
- a code generator MAY commit generated files to a task branch but may not open or merge a PR;
- a dependency bot MAY create PRs but may not merge them;
- a release workflow MAY create a release commit but deployment remains a separate gate.

---

## 3. Automation discovery

Before material repository work, especially in recovery mode, GitSkillPro SHOULD inventory automation that may modify Git state.

Detection SHOULD inspect where available:

- `.git/hooks/`;
- `core.hooksPath`;
- repository hook-manager configuration;
- package-manager scripts;
- shell/PowerShell/Python/Node scripts containing Git mutation commands;
- CI workflow definitions containing commit/push operations;
- scheduled jobs;
- file watchers;
- process managers;
- bot/app configuration;
- dependency-update configuration;
- release automation configuration;
- agent/harness configuration;
- repository instruction files describing automatic commit behavior.

GitSkillPro SHOULD recognize commands or APIs semantically equivalent to:

- stage/add;
- commit/amend;
- branch/ref update;
- push/force push;
- PR creation/update;
- merge;
- tag/release creation.

Unknown background writers MUST be surfaced as concurrency risk.

---

## 4. Automation actor contract

Every known repository automation actor SHOULD have metadata equivalent to:

```text
AutomationActor
  id
  kind
  executable/source
  trigger
  runtime_environment
  identity/author
  credentials_scope
  repository_scope
  allowed_branches
  allowed_paths
  stage_policy
  commit_policy
  push_policy
  pr_policy
  merge_policy
  expected_state_policy
  concurrency_policy
  loop_prevention
  idempotency_expectation
  verification
  recovery
```

GitSkillPro MUST prefer explicit configuration over inferred permissions.

---

## 5. Auto-commit categories

GitSkillPro MUST distinguish the intent of an automatic commit.

### 5.1 Checkpoint/snapshot commit

Purpose: preserve recoverable agent work during a long-running task.

Rules:

- SHOULD occur only on an isolated task branch/worktree;
- MUST NOT imply merge readiness;
- MAY use an explicit checkpoint commit convention;
- SHOULD be squashed/reorganized later if project policy requires semantic history;
- MUST preserve the work-item/agent identity in evidence;
- MUST NOT stage unrelated unexplained files.

### 5.2 Semantic task commit

Purpose: represent a coherent implementation change.

Rules:

- MUST correspond to known task scope;
- SHOULD include issue/Bead linkage according to project convention;
- MUST pass required local pre-commit validation;
- MUST NOT silently include another agent's changes.

### 5.3 Generated-artifact commit

Purpose: commit deterministic generated output.

Examples: generated clients, schemas, lockfiles, docs, compiled manifests when the repository intentionally tracks them.

Rules:

- generator identity/version SHOULD be recorded;
- generated path scope SHOULD be allowlisted;
- generation SHOULD be idempotent;
- re-running generation without source changes SHOULD produce no additional diff;
- source inputs SHOULD be linked in evidence;
- GitSkillPro MUST distinguish generated diffs from hand-authored source changes.

### 5.4 Release/version commit

Purpose: version bump, changelog, release metadata, generated release files.

Rules:

- release automation MUST be separately authorized;
- tag/release/publish/deploy permissions are separate from commit permission;
- reruns MUST avoid creating duplicate release versions or tags.

### 5.5 Synchronization/mirror commit

Purpose: synchronize derived or mirrored repository state.

Rules:

- canonical source MUST be explicit;
- synchronization direction MUST be explicit;
- loops between two auto-sync systems MUST be prevented;
- mirrored data MUST NOT silently become canonical merely because it is committed.

---

## 6. Staging safety

Automatic staging is frequently more dangerous than the commit itself.

GitSkillPro MUST determine exactly what an automation actor is allowed to stage.

Default policy:

- prefer explicit path staging;
- prefer path allowlists for generated/automation-owned files;
- avoid repository-wide `add -A` / equivalent in shared or uncertain workspaces;
- permit broad staging only when the worktree is proven isolated and all changes belong to the task;
- inspect staged diff before commit;
- reject unexpected sensitive files, credentials, build outputs, local configuration, or another actor's work.

An auto-commit actor MUST NOT treat "file changed while I was running" as proof that the file belongs to it.

---

## 7. Expected-state / optimistic concurrency requirement

Before an automatic commit or ref mutation, GitSkillPro SHOULD require expected-state evidence such as:

- expected HEAD SHA;
- expected branch;
- expected worktree identity;
- expected staged-path set;
- expected task/agent ownership;
- expected remote branch SHA before push.

If HEAD, branch, index, or owned path state changed unexpectedly, the automation MUST stop and re-plan rather than absorbing the new work.

Auto-push SHOULD use non-destructive expected-state semantics. Force push remains governed by the existing high-risk policy.

---

## 8. Shared-worktree rule

Automatic commit scripts MUST default to **disabled for shared writable worktrees**.

Preferred model:

```text
one agent/task
  -> one branch
  -> one worktree
  -> optional auto-checkpoint actor
```

If multiple writers intentionally share a worktree, GitSkillPro MUST require an explicit coordination/locking protocol before auto-staging or auto-committing is permitted.

---

## 9. Commit-message provenance

Automatically generated commits SHOULD include machine-readable or convention-compatible provenance sufficient to recover:

- originating issue/Bead/work item;
- automation actor;
- agent/task identity when relevant;
- generator/release operation when relevant.

The repository's native commit convention wins. GitSkillPro MUST NOT impose a new format when an existing validated convention exists.

A commit message MUST NOT claim tests, review, deployment, or persistence that did not occur.

---

## 10. Auto-push is a separate gate

A successful local auto-commit MUST NOT automatically imply permission to push.

Before auto-push:

1. fetch/refresh remote state;
2. verify expected remote ref;
3. ensure task branch ownership/policy permits push;
4. verify the local commit set being published;
5. confirm no forbidden secrets/artifacts are included;
6. use normal non-force push unless an explicitly authorized history-rewrite workflow applies;
7. record returned remote persistence evidence.

Default/protected branches SHOULD NOT be targets of background direct pushes.

---

## 11. Auto-PR and auto-merge separation

Automation MAY create or update a PR when authorized, but PR creation is not approval.

Auto-merge MUST remain subject to the normal GitSkillPro PR, independent-review, CI, database, deployment, repository-rule, risk, and concurrency gates.

A bot-authored PR MUST be reviewed as evidence, not trusted because the author is automation.

---

## 12. CI commit-loop prevention

GitSkillPro MUST detect and prevent recursive automation loops such as:

```text
push
 -> CI
 -> generator changes files
 -> commit + push
 -> CI
 -> generator changes files
 -> ...
```

Loop prevention SHOULD use explicit workflow semantics such as:

- actor/event guards;
- path filters;
- generated-output idempotency;
- dedicated automation branches;
- commit provenance checks;
- concurrency groups;
- run-attempt/operation IDs.

Skip-CI commit markers MUST NOT be used blindly because they may cause required checks to remain absent or leave changes unverified. They MAY be used only when compatible with repository policy and required-check semantics.

---

## 13. Idempotency requirement

Repository automation SHOULD be idempotent whenever practical.

For generators/fixers/sync jobs, the proving test is:

```text
run automation
 -> commit/result
run automation again with identical inputs
 -> no new semantic diff
```

Repeated execution that continuously rewrites equivalent output is a defect or explicit exception that MUST be documented.

---

## 14. Hooks and local automation

GitSkillPro MUST understand hook timing and side effects rather than treating a commit command as an atomic black box.

Before relying on local commit behavior, GitSkillPro SHOULD identify relevant hooks and determine whether they may:

- mutate files;
- mutate the index;
- run formatters/tests;
- reject the commit;
- alter commit messages;
- sign commits;
- perform network operations;
- trigger additional repository writes.

A hook-modified working tree/index MUST be re-inspected before the operation is considered complete.

Bypassing hooks (`--no-verify` or equivalent) MUST require explicit policy justification; it MUST NOT be the default response to a failing hook.

---

## 15. Auto-commit during recovery mode

Project Takeover / Recovery Mode MUST discover and classify existing automation before broad cleanup.

If an unknown auto-commit/watcher/bot is actively mutating the repository, GitSkillPro SHOULD pause recovery mutation until the actor is identified or safely isolated.

Recovery inventory MUST detect whether:

- failed PRs were repeatedly modified by bots;
- CI generated commits after review approval;
- automation rebased or force-pushed PR heads;
- release bots created unexplained tags/commits;
- generated metadata polluted branches;
- abandoned agents left checkpoint commits;
- automation created duplicate/superseded PRs.

Historical bot/checkpoint commits MUST be preserved until their relationship to current work is understood.

---

## 16. Context-economy integration

The Context Economy Engine SHOULD summarize stable automation configuration once and cache it by configuration/content hash.

Subagents SHOULD receive only the automation actors relevant to their writable scope.

Do not repeatedly load every hook/script/workflow into every task context.

Invalidate cached automation context when relevant files, Git config, workflow configuration, hook paths, actor permissions, or branch policy changes.

---

## 17. Configuration

`.gitskillpro.yml` MAY define automation policy such as:

```yaml
automation:
  autoCommit:
    default: deny
  actors:
    generated-client:
      kind: generator
      allowBranches: ["agent/*", "feat/*"]
      allowPaths:
        - "src/generated/**"
      commit: true
      push: false
      pr: false
    agent-checkpoint:
      kind: checkpoint
      requireIsolatedWorktree: true
      commit: true
      push: false
```

This is illustrative; the implementation schema defines the final syntax.

Configuration MUST NOT embed secrets.

---

## 18. CLI additions

v0.5 SHOULD provide:

```text
gsp audit automation
gsp automation list
gsp automation inspect <actor>
gsp automation plan-commit
gsp automation checkpoint
gsp automation verify-idempotency
gsp automation detect-loops
```

Mutation remains policy-gated.

---

## 19. MCP additions

v0.5 SHOULD expose structured equivalents of:

- `automation.inspect`;
- `automation.audit`;
- `automation.plan_commit`;
- `automation.verify_scope`;
- `automation.detect_loops`;
- `automation.verify_idempotency`.

The MCP server MUST NOT expose a generic "commit everything" tool without scope/policy preconditions.

---

## 20. Evidence additions

Auto-commit evidence MUST record when applicable:

- automation actor ID;
- trigger;
- initial HEAD;
- branch/worktree;
- pre-commit changed paths;
- staged paths;
- staged diff hash;
- hook/generator actions;
- resulting commit SHA;
- whether push occurred;
- remote persistence proof if pushed;
- task/issue/Bead linkage;
- unexpected concurrent changes;
- verification performed;
- recovery method.

---

## 21. Adversarial tests required

GitSkillPro MUST test at least:

1. auto-commit on an isolated agent worktree succeeds for allowlisted task files;
2. shared dirty worktree blocks automatic `add -A`;
3. another agent edits a file between snapshot and commit and expected-state validation blocks absorption;
4. pre-commit formatter changes files/index and GitSkillPro re-inspects the result;
5. failing hook is diagnosed rather than bypassed automatically;
6. generator is idempotent on second run;
7. non-idempotent generator is reported;
8. CI bot commit would recursively trigger itself and loop detection blocks it;
9. local checkpoint commit does not automatically push;
10. pushed bot commit does not automatically count as PR approval;
11. automation cannot push directly to protected/default branch unless policy explicitly permits it;
12. bot force-push is denied by default;
13. recovery mode detects an unknown background writer before cleanup;
14. generated allowlist prevents unrelated secret/config file from being staged;
15. automation context cache invalidates after hook/workflow configuration changes.

---

## 22. Acceptance criteria

v0.5 is acceptable only when GitSkillPro can:

1. discover common repository-writing automation;
2. represent automation as concurrent actors;
3. distinguish auto-stage, commit, push, PR, merge, and deploy authority;
4. safely create checkpoint commits in isolated worktrees;
5. prevent automatic commits from absorbing unexplained work;
6. revalidate expected HEAD/index/path state before mutation;
7. detect relevant Git hooks and post-hook mutations;
8. detect common CI self-trigger loops;
9. verify generator idempotency;
10. audit existing automation during project recovery;
11. produce evidence linking an automatic commit to its actor and work item;
12. preserve normal autonomous PR/review/CI/deployment gates after automation creates a commit.

---

## 23. Canonical rule

The implementation plan MUST read specifications in version order through `SPEC-v0.5.md`. The newest requirement wins where specifications conflict.
