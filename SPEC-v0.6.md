# GitSkillPro — Canonical Specification v0.6

**Version:** 0.6-design

**Status:** Canonical frontier-capabilities extension and partial supersession of prior GitSkillPro specifications

This specification incorporates current and emerging software-delivery concepts that materially improve agentic development safety, speed, context efficiency, recovery, and provenance.

It does **not** require every project to adopt every new tool. GitSkillPro MUST distinguish stable capabilities from emerging and experimental capabilities, detect what a project actually uses, and preserve compatibility with ordinary Git/GitHub workflows.

Where this specification conflicts with an older GitSkillPro specification, v0.6 wins. Older requirements remain normative unless modified here.

---

## 1. Frontier maturity model

Every optional platform/workflow capability MUST carry a maturity classification:

- **CORE** — broadly established and safe to use when detected.
- **EMERGING** — production-capable but version/provider behavior is changing; feature-detect and pin semantics.
- **EXPERIMENTAL** — useful for evaluation or explicitly opted-in projects; never silently impose as repository policy.

A cutting-edge feature MUST NOT become the default merely because GitSkillPro knows about it.

The capability registry SHOULD record:

- provider/tool/version;
- maturity;
- detected feature flags/capabilities;
- required migration/compatibility considerations;
- fallback path;
- evidence source.

---

## 2. Change graph abstraction

GitSkillPro MUST add a first-class **Change Graph** above raw commits and PRs.

A logical change may survive rebases, amend operations, commit replacement, stack rebasing, cherry-pick salvage, or provider-specific change IDs.

```text
ChangeUnit
  logical_id
  issue/work_item_ids
  parent_change_ids
  dependency_change_ids
  supersedes_change_ids
  versions
    commit_sha(s)
    branch/ref
    PR/change-request id
  current_version
  state
  risk
  evidence
```

Commit SHAs remain canonical Git object identities. A logical change ID is not a replacement for a SHA; it is a stable workflow identity across rewritten physical versions.

This abstraction is required for:

- stacked PRs;
- Jujutsu-style stable change identities;
- rebases;
- recovery/salvage;
- supersession;
- agent checkpoint histories;
- comparing multiple implementations of the same work item.

---

## 3. Stacked changes and stacked pull requests

GitSkillPro MUST support a generic **change stack** model:

```text
trunk <- change A <- change B <- change C
```

Provider implementations MAY include:

- GitHub native stacked pull requests;
- Graphite stacks;
- GitButler stacked branches;
- manually maintained Git branch stacks;
- Jujutsu change stacks mapped to Git/GitHub.

### 3.1 GitHub native stacked PRs — EMERGING

GitHub's native stacked PR capability is currently an emerging/public-preview feature and MUST be feature-detected.

When supported, GitSkillPro SHOULD understand:

- stack membership and stack base/trunk;
- bottom-up dependency order;
- linear-history requirement;
- cascading stack rebase;
- branch protection/rules evaluated against the stack base;
- stack-aware CI metadata;
- atomic/contiguous stack merge semantics;
- merge-queue behavior for stacks;
- provider/API limitations such as unsupported ordinary auto-merge where applicable.

GitSkillPro SHOULD prefer smaller reviewable layers for large AI-generated changes when the repository supports stacks.

### 3.2 Stack design before implementation

For changes too large for one reviewable PR, GitSkillPro SHOULD plan the stack before generating code.

Each layer SHOULD:

- have a coherent independently reviewable intent;
- minimize upward coupling;
- define its own verification;
- identify downstream stack dependents;
- remain small enough for meaningful independent review.

---

## 4. Merge groups, speculative integration, and trunk protection

GitSkillPro MUST distinguish testing a PR head from testing the **candidate integrated state**.

When a merge queue is configured, GitSkillPro MUST understand merge-group semantics.

For GitHub Actions, recovery/audit MUST detect the class of failure where required workflows run for `pull_request` but do not run for `merge_group`, causing merge-queue checks to be absent.

A generic merge-queue adapter SHOULD model:

- queue position;
- candidate merge group SHA;
- queued stack/group membership;
- speculative validation result;
- ejection reason;
- revalidation after trunk movement;
- batching/parallel/speculative execution where supported.

GitSkillPro SHOULD prefer validation against the actual merge candidate when available rather than assuming PR-head success proves trunk compatibility.

---

## 5. Semantic conflict model

GitSkillPro MUST distinguish:

1. textual merge conflict;
2. structural/schema conflict;
3. dependency conflict;
4. CI/configuration conflict;
5. behavioral/semantic conflict;
6. deployment/resource conflict;
7. database compatibility conflict.

Two PRs may merge textually and still conflict semantically.

Semantic conflict evidence MAY include:

- overlapping dependency graph impact;
- failing integration/contract tests;
- incompatible generated schemas;
- migration collisions;
- ruleset/workflow changes affecting another PR;
- feature-flag/config collisions;
- deployment-resource version incompatibility.

Merge queues, affected graphs, integration tests, contract tests, and preview environments SHOULD be used to detect semantic conflicts before production.

---

## 6. Jujutsu (`jj`) adapter — EMERGING

GitSkillPro SHOULD support an optional Jujutsu adapter for repositories that explicitly use it.

It MUST NOT initialize or convert a Git repository to Jujutsu without explicit project authorization.

When detected, GitSkillPro SHOULD understand:

- Git-backed/colocated workspaces;
- change IDs vs commit IDs;
- working-copy commit semantics;
- bookmarks vs Git branches;
- operation log;
- undo/redo/operation restore;
- divergent operations;
- first-class conflict state;
- Git import/export behavior;
- compatibility hazards when interleaving mutating `git` and `jj` commands.

### 6.1 Operation-log inspiration

Regardless of VCS, GitSkillPro SHOULD maintain its own repository-operation event journal inspired by operation-log systems:

```text
RepositoryOperation
  operation_id
  actor
  intent
  started_at
  completed_at
  before_state_refs
  after_state_refs
  mutation_type
  evidence_refs
  recovery_refs
  parent_operation_ids
```

This GitSkillPro journal supplements Git reflog/provider audit logs; it does not replace them.

---

## 7. Alternative workspace/change managers

GitSkillPro MAY provide optional adapters/reference packs for systems such as GitButler that model parallel/virtual branches or multiple change lanes in one workspace.

Because these systems can redefine assumptions about HEAD, staging, and branch isolation, GitSkillPro MUST detect them before applying ordinary one-index/one-branch assumptions.

Default GitSkillPro multi-agent policy remains isolated worktrees unless the project's explicitly selected workspace manager provides proven equivalent isolation and concurrency semantics.

---

## 8. MCP 2026 protocol modernization

GitSkillPro's MCP implementation MUST target the current MCP protocol semantics rather than assuming older stateful transport behavior.

The adapter MUST be version-aware and support the current protocol's move toward:

- stateless requests;
- per-request protocol version/capability metadata;
- explicit server-minted handles for cross-call state;
- multi-round-trip input-required results;
- optional Tasks extension for long-running work;
- Skills-over-MCP discovery where supported;
- explicit extension negotiation.

Older MCP versions MAY be supported through compatibility adapters, but GitSkillPro MUST NOT silently downgrade in a way that loses required safety capabilities.

### 8.1 Long-running operations

Long-running GitSkillPro operations such as project recovery, CI archaeology, multi-repo audit, or deployment observation SHOULD expose durable task handles when the host supports the MCP Tasks extension.

The task handle SHOULD point to persisted GitSkillPro operation/evidence state rather than hiding critical state only in a transport session.

---

## 9. Agent-to-agent protocol adapter

GitSkillPro SHOULD support an optional A2A-compatible delegation adapter for independent remote agents.

Agent capability discovery SHOULD map to:

- agent identity;
- skills/capabilities;
- authentication requirements;
- supported task lifecycle;
- supported artifact types.

GitSkillPro MUST preserve the distinction between:

- **message** — coordination/status/input;
- **task** — stateful unit of work;
- **artifact** — durable work product/evidence.

Critical completion evidence MUST be carried as durable artifacts/commit packets or persisted tracker/repository evidence, not only transient chat/status messages.

---

## 10. Hermetic and reproducible execution environments

Environment detection MUST include existing reproducibility mechanisms, including where present:

- Dev Container specification (`devcontainer.json`);
- Nix / flakes / dev shells;
- Docker/Compose;
- Dagger;
- Bazel;
- language/runtime version managers and lockfiles;
- repository-local toolchain pinning.

GitSkillPro SHOULD prefer the repository's declared reproducible environment over an ad hoc host environment when practical.

A greenfield bootstrap SHOULD offer a reproducible environment contract appropriate to the stack rather than assuming globally installed tools.

GitSkillPro MUST distinguish:

- reproducible environment declaration;
- reproducible build;
- bit-for-bit reproducible artifact.

These are different guarantees.

---

## 11. Pipeline-as-code DAG engines

GitSkillPro SHOULD detect pipeline engines that express CI as a dependency DAG executable locally and remotely.

Dagger is an example provider/reference pack: pipeline logic can be run locally or in CI, cached, and traced while remaining less coupled to one CI vendor.

GitSkillPro SHOULD model CI as a task graph when available rather than treating the YAML workflow file as the entire pipeline truth.

A recovery audit SHOULD detect cases where provider YAML merely invokes a portable pipeline engine and inspect the actual pipeline definition before diagnosing root cause.

---

## 12. Affected-graph execution and test impact analysis

For monorepos or dependency-graph-aware repositories, GitSkillPro SHOULD detect project/task graphs and use **affected analysis**.

Capabilities MAY include:

- changed-file to project mapping;
- project dependency graph;
- task dependency graph;
- affected build/lint/test selection;
- transitive impact;
- cache-key input graph;
- changed API/schema impact.

Nx `affected`, Bazel query/action graphs, Turborepo graphs, and equivalent systems are examples.

### 12.1 Risk-aware affected execution

Affected-only CI is an optimization, not a safety bypass.

GitSkillPro MUST allow policy to require broader/full-suite verification for:

- build-system changes;
- shared foundation libraries;
- security/auth changes;
- schema/protocol changes;
- deployment/runtime configuration;
- high-risk R3/R4 changes;
- uncertain dependency graph coverage.

---

## 13. Remote cache and remote execution

GitSkillPro SHOULD detect remote build/test caches and remote execution systems.

It MUST distinguish:

- skipping unaffected work;
- cache hit for identical declared inputs;
- distributed execution of uncached work.

Cache evidence SHOULD record:

- task/input hash;
- cache source;
- trust boundary;
- restored artifacts;
- whether logs/results were restored or executed.

Untrusted-fork or lower-trust cache writes MUST NOT silently poison trusted/default-branch CI caches.

---

## 14. Policy as code

Repository/workflow governance SHOULD be expressible as machine-evaluable policy.

GitSkillPro SHOULD support a policy adapter capable of evaluating structured repository/change/deployment evidence against policies.

OPA/Rego and Conftest-style configuration validation are examples.

Potential policies include:

- allowed branch mutations;
- risk-tier review requirements;
- dependency/license rules;
- required evidence fields;
- deployment environment restrictions;
- database migration restrictions;
- artifact provenance requirements;
- auto-commit/auto-merge authority;
- provider-specific security rules.

GitSkillPro SHOULD emit a policy decision trace containing input evidence, evaluated policy version, result, and denied requirements.

Policy engines advise/enforce through configured integration points; they MUST NOT become an excuse to bypass higher-priority user/host governance.

---

## 15. Required workflows and repository-wide governance

GitSkillPro MUST distinguish ordinary status checks from repository/org-level **required workflow** governance where the SCM supports it.

Recovery/bootstrap audits SHOULD detect:

- required workflow references that no longer exist;
- rulesets requiring checks/workflows not emitted by the current CI configuration;
- overlapping organization and repository rules;
- bypass apps/users;
- code scanning/quality/coverage rules;
- push rules restricting dangerous file paths/types/sizes.

GitSkillPro SHOULD prefer centralized reusable/required workflows for organization-wide invariant checks when the project already uses that model.

---

## 16. Software supply-chain provenance

GitSkillPro MUST model **source commit provenance** and **built artifact provenance** separately.

For release/build artifacts, supported evidence MAY include:

- GitHub artifact attestations;
- SLSA provenance;
- Sigstore/Cosign signatures and attestations;
- SBOMs;
- build workflow identity;
- repository/environment/commit identity;
- immutable digest;
- verification result.

A release MAY be configured to require verifiable provenance before deployment/promotion.

### 16.1 SBOM formats

GitSkillPro SHOULD recognize established SBOM formats such as SPDX and CycloneDX.

SBOM generation MUST NOT be treated as vulnerability proof; it is inventory/provenance input to dependency and security analysis.

---

## 17. Dependency-change intelligence

Dependency updates MUST be treated as structured software changes, not generic version bumps.

GitSkillPro SHOULD detect and integrate with:

- Dependabot-style update PRs;
- Renovate-style dependency dashboards/package rules;
- lockfile-only updates;
- grouped dependency updates;
- ecosystem-specific vulnerability/advisory data;
- dependency review checks.

Policy MAY differentiate:

- patch/minor/major updates;
- runtime vs dev dependencies;
- trusted vs new publishers;
- transitive vs direct dependencies;
- security-fix urgency;
- auto-merge eligibility.

Dependency bot authorship MUST NOT bypass independent evidence/review policy.

---

## 18. Code scanning and security merge protection

GitSkillPro SHOULD detect code-scanning systems and rules that make security results merge requirements.

It MUST distinguish:

- scanning configured;
- scan completed for the current commit;
- scan result acceptable under policy;
- required scanner missing/not configured;
- stale scanning result.

CodeQL and other SARIF-compatible scanners are examples.

A recovery audit SHOULD detect the broken-governance case where a ruleset requires a scanner/result category that the repository no longer emits.

---

## 19. Deterministic semantic transformations

Before asking an LLM to hand-edit hundreds of mechanical changes, GitSkillPro SHOULD check whether a deterministic transformation engine/codemod exists.

Examples include:

- OpenRewrite lossless semantic-tree recipes;
- framework-specific codemods;
- compiler-assisted migrations;
- AST/tree-sitter transformations;
- Semgrep/autofix-style transformations where appropriate.

A transformation run SHOULD produce:

- transformation/recipe identity and version;
- configuration;
- before/after diff;
- affected paths;
- deterministic/idempotency check where practical;
- required post-transform validation.

Large automated refactors SHOULD be isolated into reviewable change stacks or bounded PRs rather than one opaque mega-commit.

---

## 20. Release intent and monorepo release graphs

GitSkillPro SHOULD detect repositories where code merge is not equivalent to package release.

Release-intent systems such as Changesets-style metadata can describe:

- which packages changed;
- semver impact;
- human-readable release summary;
- dependency-cascade version changes;
- publish readiness.

GitSkillPro MUST keep distinct states for:

```text
merged
built
attested
published
package-released
deployed
feature-released
```

---

## 21. Deploy is not release

GitSkillPro MUST explicitly model deployment and feature exposure as separate states.

```text
MERGE
 -> BUILD / ATTEST
 -> DEPLOY
 -> VERIFY DEPLOYMENT
 -> RELEASE / EXPOSE
 -> OBSERVE
 -> PROMOTE / ROLLBACK / DISABLE
```

A new version can be deployed but not yet exposed to users.

---

## 22. Feature-flag abstraction

GitSkillPro SHOULD detect feature-flag systems and MAY support OpenFeature-compatible abstraction/reference packs.

The model SHOULD capture:

- flag key/domain;
- provider;
- default/fallback behavior;
- targeting/evaluation context boundaries;
- rollout percentage/variant;
- environment;
- owner/work item;
- expiry/cleanup expectation;
- telemetry evidence.

Feature flags MUST NOT become permanent invisible architecture accidentally. Greenfield/review policy SHOULD support stale-flag detection and cleanup issues.

Sensitive user data MUST NOT be inserted into flag evaluation context without project privacy policy.

---

## 23. Progressive delivery

GitSkillPro SHOULD support progressive-delivery adapters for systems offering:

- canary;
- blue/green;
- traffic splitting;
- automated metric analysis;
- experimentation;
- pause/promote/abort;
- automated rollback.

Argo Rollouts is one example.

Promotion evidence SHOULD identify the metric/query/window/threshold used to decide whether to proceed.

A successful initial deployment MUST NOT be conflated with successful progressive promotion.

---

## 24. Ephemeral preview stacks

GitSkillPro SHOULD model an optional **preview stack** per PR/change stack:

```text
PR/change
  -> preview application deployment
  -> preview database branch/clone
  -> preview configuration/secrets scope
  -> migrations
  -> seed/test data
  -> integration/e2e verification
  -> destroy/archive on close/merge
```

Providers such as Vercel previews, Supabase branches, Neon branches, PlanetScale branches/deploy requests, and equivalent systems MAY implement parts of this model.

Preview environments MUST be explicitly classified as isolated or shared. GitSkillPro MUST NOT assume preview databases contain production data or production-equivalent scale.

---

## 25. Database branch/change-request model

When the database provider supports branch/deploy-request semantics, GitSkillPro SHOULD model schema change as its own reviewable change request linked to the code PR.

Database change evidence MAY include:

- schema diff;
- provider deployability analysis;
- lint/data-loss warnings;
- branch migration history;
- gated cutover state;
- revert/undo window;
- non-revertible operation indicator.

Database provider approval does not replace application-level compatibility testing.

---

## 26. Expand-contract and compatibility windows

For production schema changes, GitSkillPro SHOULD prefer **expand-and-contract** or another proven backwards-compatible rollout strategy when the change cannot be safely atomic.

The plan SHOULD model phases such as:

```text
EXPAND
  add compatible schema/API surface

DUAL-COMPATIBILITY WINDOW
  old and new application versions can operate safely

BACKFILL / MIGRATE DATA

CUT OVER READ/WRITE BEHAVIOR

CONTRACT
  remove obsolete schema only after old code can no longer run
```

Rollback analysis MUST identify which phases remain backward-compatible.

---

## 27. Developer portals, software catalogs, and golden paths

Greenfield bootstrap MUST check whether the organization already has a **golden path** or software-template/catalog system before inventing project structure.

Backstage-style software catalogs/templates/TechDocs are examples.

GitSkillPro SHOULD detect repository/service metadata and ownership mappings where present, such as catalog descriptors, and use them as evidence for:

- service identity;
- owner/team;
- system/domain membership;
- documentation location;
- dependencies/resources;
- approved project templates.

An organization-provided template SHOULD normally outrank GitSkillPro's generic greenfield template.

---

## 28. Repository maturity and scorecards

GitSkillPro SHOULD support a repository maturity/health scorecard that reports evidence without collapsing it into a misleading single score.

Dimensions MAY include:

- CI reliability;
- review/rules enforcement;
- dependency hygiene;
- supply-chain provenance;
- secret/security posture;
- reproducibility;
- test coverage/quality evidence;
- deployment rollback readiness;
- database recovery readiness;
- stale branches/PRs;
- tracker integrity;
- agent automation safety;
- context/token efficiency.

OpenSSF Scorecard-like checks MAY be used as one input for security posture.

---

## 29. OpenTelemetry delivery observability

GitSkillPro SHOULD emit or export standardized telemetry for repository and delivery operations.

OpenTelemetry CI/CD and VCS semantic conventions SHOULD be used where they map cleanly.

Trace relationships SHOULD make it possible to correlate:

```text
work item
 -> agent task
 -> repository operation
 -> PR/change
 -> CI pipeline/run/task
 -> merge group
 -> build artifact
 -> deployment
 -> database migration
 -> production verification
```

Logs, metrics, and traces are observability evidence, not canonical work/merge state.

---

## 30. Proof-carrying change manifest

GitSkillPro SHOULD produce a machine-readable **Change Manifest** for substantial PRs/change stacks.

This is a GitSkillPro synthesis of the evidence requirements across previous specifications.

```text
ChangeManifest
  logical_change_id
  work_items
  base/head/change_versions
  stack_dependencies
  risk
  affected_graph
  code_diff_refs
  generated_transform_refs
  dependency_changes
  schema/migration_changes
  flags/release_strategy
  CI evidence
  security evidence
  SBOM/provenance refs
  reviews
  deployment plan
  rollback/forward-fix plan
  context packet/hash
  unknowns
  merge recommendation
```

The manifest is **proof-carrying metadata**, not a substitute for source evidence.

A reviewer or merge policy can verify the referenced evidence instead of reloading the entire development conversation.

---

## 31. Change-manifest inheritance for stacks

For stacked changes, a layer SHOULD carry only its own delta plus inherited evidence references from lower layers.

This reduces review context and token usage while preserving the dependency chain.

If a lower layer changes, dependent manifests MUST be invalidated or refreshed.

---

## 32. Frontier cost controls

GitSkillPro SHOULD combine several efficiency systems rather than relying only on model token optimization:

- context packets + Context7 caching;
- stacked smaller reviews;
- affected-only task selection;
- remote build/test cache;
- reusable/portable pipelines;
- speculative/parallel merge validation;
- deterministic codemods for mechanical migrations;
- proof-carrying manifests instead of re-summarizing history;
- content-addressed evidence cache;
- model routing by risk/complexity.

A cost optimization MUST be disabled or widened when its assumptions are uncertain.

---

## 33. New CLI concepts

v0.6 SHOULD add or reserve:

```text
gsp change graph
gsp change stack plan
gsp change manifest
gsp stack inspect
gsp stack revalidate
gsp merge-group audit
gsp vcs inspect
gsp jj audit
gsp env reproduce
gsp affected
gsp cache audit
gsp policy evaluate
gsp provenance verify
gsp sbom inspect
gsp transform plan
gsp transform verify
gsp preview audit
gsp release audit
gsp flag audit
gsp rollout audit
gsp scorecard
gsp trace
```

Actual command availability is capability/provider dependent.

---

## 34. MCP/A2A tool-surface additions

GitSkillPro SHOULD expose structured capabilities equivalent to:

- `change.graph`;
- `change.manifest`;
- `stack.inspect`;
- `merge_group.audit`;
- `affected.compute`;
- `policy.evaluate`;
- `provenance.verify`;
- `transformation.plan`;
- `preview.audit`;
- `release.audit`;
- `rollout.audit`;
- `scorecard.inspect`.

Long-running operations SHOULD use the current MCP task extension when available.

Remote agent delegation MAY expose compatible A2A tasks/artifacts without changing GitSkillPro's internal evidence contract.

---

## 35. New adversarial fixtures/tests

GitSkillPro MUST add tests/fixtures for at least:

1. native stacked PR with stale lower layer requiring cascading rebase;
2. stack merge queue where one lower layer fails required checks;
3. GitHub merge queue enabled but workflow missing `merge_group` trigger;
4. two PRs textually merge but create a semantic dependency conflict;
5. Jujutsu colocated repository where mutating Git assumptions would be unsafe;
6. Jujutsu operation-log recovery mapping;
7. MCP 2026 stateless request with durable task handle;
8. A2A remote agent returns transient message but durable artifact is required;
9. devcontainer/Nix environment differs from host and reproducible environment wins;
10. Nx/Bazel-style affected graph avoids unrelated tests;
11. high-risk shared-library change forces broader suite despite affected optimization;
12. poisoned/untrusted remote-cache scenario;
13. OPA/policy denial with explainable evidence;
14. artifact attestation commit digest mismatch;
15. SBOM generated but vulnerability review still fails;
16. dependency bot PR blocked by policy despite bot authorship;
17. deterministic codemod beats LLM/manual bulk edit path;
18. non-idempotent codemod/generator is rejected;
19. deployment succeeds but feature remains intentionally disabled by flag;
20. canary deployment automatically aborts on failed analysis;
21. preview app succeeds but preview database migration fails;
22. expand phase succeeds while contract phase is correctly deferred;
23. database deploy request marked non-revertible and recovery plan changes;
24. organization golden-path template overrides generic bootstrap;
25. change manifest goes stale after dependent stack layer changes;
26. OTel trace links issue -> PR -> CI -> deployment without being treated as canonical state.

---

## 36. v0.6 acceptance criteria

GitSkillPro v0.6 design is satisfied only when the implementation architecture can:

1. represent a logical change independently from one physical commit SHA;
2. detect and reason about stacked changes/PRs;
3. validate merge-group state when queues are used;
4. support optional next-generation VCS/workspace adapters without corrupting Git repos;
5. target current stateless MCP semantics and durable task extensions;
6. represent remote agent output as durable artifacts, not only messages;
7. prefer repository-declared reproducible environments;
8. use dependency/task graphs for affected work when safe;
9. reason about remote cache trust and execution provenance;
10. evaluate policy-as-code against structured evidence;
11. verify artifact provenance and consume SBOM/security evidence;
12. use deterministic transformation engines when they are safer than bulk generative edits;
13. distinguish merge, publish, deploy, and feature release;
14. support progressive delivery and feature-flag state;
15. support preview app/database stacks;
16. plan backward-compatible database rollout windows;
17. discover organization golden paths/catalog metadata;
18. emit delivery telemetry using standard semantic conventions when possible;
19. generate a proof-carrying change manifest;
20. preserve safety and correctness while reducing CI/model/context cost.

---

## 37. Canonical rule

The implementation plan MUST read GitSkillPro specifications in version order through `SPEC-v0.6.md`. The newest requirement wins where specifications conflict.
