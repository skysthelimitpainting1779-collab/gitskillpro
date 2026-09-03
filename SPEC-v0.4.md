# GitSkillPro — Canonical Specification v0.4

**Version:** 0.4-design

**Status:** Canonical context-economy extension and partial supersession of `SPEC.md`, `SPEC-v0.2.md`, and `SPEC-v0.3.md`

**Repository:** `skysthelimitpainting1779-collab/gitskillpro`

This specification adds a first-class **Context Economy Engine** to GitSkillPro. It governs how agents acquire, cache, compress, route, reuse, and invalidate context so the system can remain accurate while reducing unnecessary model input, output, reasoning, retrieval, and repeated-tool cost.

It also adds **Context7** as a first-class external library/framework documentation adapter.

Where this specification conflicts with an older GitSkillPro specification, v0.4 wins. Older requirements remain normative unless modified here.

---

## 1. Design objective

GitSkillPro MUST optimize for:

> **minimum sufficient context for a correct, evidence-backed decision**

not:

> maximum context that happens to fit in the model window.

Token reduction MUST NOT weaken safety, provenance, acceptance criteria, current-state correctness, recovery capability, or risk-gated review.

The system MUST prefer a smaller truthful context packet over a large context dump containing stale, duplicated, irrelevant, or unverifiable material.

---

## 2. Context is a governed resource

GitSkillPro MUST treat context as a budgeted execution resource with the same seriousness as runtime, API calls, CI minutes, and deployment mutations.

Every substantial agent run SHOULD have a **Context Plan** containing:

- task/work-item identity;
- execution mode;
- current repository/base/head identity;
- risk tier;
- required policy/instruction sources;
- required evidence sources;
- expected external documentation needs;
- context budget;
- retrieval plan;
- cache opportunities;
- invalidation keys;
- compaction/checkpoint plan for long-running tasks.

The Context Plan MAY evolve as new evidence appears.

---

## 3. Context authority hierarchy

Context sources MUST retain their source authority. Retrieval convenience does not make a source canonical.

A typical precedence model is:

1. user/host instructions and governance;
2. repository-native instructions (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, local policy/config);
3. current task/project/work-graph truth (Linear, Beads, GitHub Issues, configured tracker);
4. current Git/SCM state;
5. current CI/deployment/database/provider evidence;
6. repository code/config/docs at the relevant revision;
7. version-specific external library/provider documentation;
8. general external research;
9. model prior knowledge.

Higher placement does not mean "always load more." It means conflicts MUST be resolved with appropriate authority and freshness.

---

## 4. Context packet contract

Agents SHOULD operate from compact, explicit **Context Packets** rather than inherited conversational sprawl.

A context packet contains only fields needed for the current task, such as:

```text
ContextPacket
  identity
    project
    issue/bead
    repository
    base_sha
    head_sha
    worktree/branch
  mode
    normal | greenfield | recovery | incident
  risk
    R0-R4
  instructions
    compact policy references + required excerpts
  acceptance
    acceptance criteria
    definition of done
  current_state
    narrow repo/PR/CI/deploy/db facts
  code_context
    relevant paths/ranges/diffs only
  dependencies
    direct blockers/dependencies only
  docs_context
    version-pinned retrieved documentation only when needed
  unresolved
    ambiguities/blockers/unknowns
  verification
    required commands/checks
  provenance
    source IDs, SHAs, URLs/locators, timestamps/hashes
  budget
    input/output/reasoning/tool-output targets
```

A packet MUST NOT claim that omitted context is nonexistent. It describes the selected working context for the current operation.

---

## 5. Progressive disclosure

GitSkillPro MUST retrieve context progressively.

### Layer 0 — invariant operating policy

Load only the compact stable GitSkillPro instructions and host/repository safety rules needed across tasks.

Large reference packs MUST remain load-on-demand.

### Layer 1 — task identity

Load the active issue/bead/project, acceptance criteria, direct blockers, branch/PR identity, and current risk.

### Layer 2 — repository map

Load repository instructions, package/toolchain metadata, relevant config, and a narrow file/path map.

Do not load the full repository.

### Layer 3 — implementation evidence

Load exact diffs, files, functions, migrations, workflow jobs, logs, or provider state required to answer the current question.

### Layer 4 — external documentation

Retrieve only version-specific external docs needed for the active implementation or diagnosis.

### Layer 5 — archaeology expansion

In recovery mode, start with metadata and graph summaries, then expand only suspicious/uncertain clusters into full PRs, logs, branches, or historical artifacts.

The system SHOULD stop expansion when the question is adequately answered with evidence.

---

## 6. Context7 — first-class documentation adapter

GitSkillPro MUST support Context7 through host-native connector/plugin, MCP, CLI, or API capabilities where available.

Context7 is used for **external library/framework/API documentation**, not as a substitute for repository state, provider-account state, current CI evidence, or production truth.

### 6.1 When to use Context7

Use Context7 when the task depends on current/version-specific knowledge of:

- package APIs;
- framework conventions;
- SDK setup/configuration;
- migration/version changes;
- library-specific examples;
- external integration syntax;
- provider/client library behavior.

Do NOT call Context7 merely because code is involved.

Examples where Context7 is unnecessary:

- inspecting a repository-local function;
- reading a Git diff;
- determining whether CI is red;
- checking a Vercel deployment through a connected Vercel adapter;
- inspecting a Supabase project through an authorized Supabase connector;
- determining Beads state from the local project.

### 6.2 Context7 resolution protocol

When the exact Context7 library ID is unknown:

1. identify the library/package from repo evidence;
2. identify the installed/declared version when possible;
3. resolve the library ID once;
4. choose the strongest relevant match based on identity, source reputation, coverage, quality, and requested version;
5. cache the resolution keyed by package identity/version;
6. query documentation by **one specific concept at a time**.

When the exact library ID is already known and valid, skip library resolution.

### 6.3 Version pinning

GitSkillPro SHOULD derive the documentation version from authoritative repo evidence such as:

- lockfile;
- package manifest;
- language dependency lock;
- runtime/tool configuration;
- provider SDK version;
- framework metadata.

Do not retrieve latest-version docs for a pinned older dependency unless the task explicitly concerns upgrading.

### 6.4 Query minimization

Context7 queries SHOULD be narrow and task-specific.

Good:

```text
Next.js 16 App Router: how middleware/proxy authentication redirects are configured for this version
```

Bad:

```text
Next.js auth routing caching deployment database
```

Multiple unrelated documentation questions MUST be split when necessary.

### 6.5 Context7 cache

Documentation responses SHOULD be cached because documentation changes less frequently than agent tasks.

A cache key SHOULD include:

- Context7 library ID;
- version;
- normalized concept/query hash;
- retrieval policy version.

Cache invalidation SHOULD occur when:

- the dependency version changes;
- the library ID changes;
- the task requests latest/current docs and freshness policy expires;
- retrieved evidence reports a newer relevant version;
- the user explicitly requests refresh.

### 6.6 Privacy

Context7 queries MUST NOT contain:

- API keys;
- passwords;
- credentials;
- personal data;
- proprietary source-code dumps;
- confidential issue/customer content not necessary to formulate a generic documentation question.

The agent SHOULD formulate a minimal documentation question rather than forwarding the user's full prompt or code.

---

## 7. External documentation routing

GitSkillPro SHOULD use a documentation capability broker.

Preferred path when appropriate:

```text
repo-local docs/instructions
    ↓
exact Context7 library/version already known
    ↓
Context7 resolution + focused query
    ↓
provider-native documentation connector
    ↓
official provider/library documentation retrieval
    ↓
broader web research only when needed
```

The order MAY vary when a provider-native connector has stronger/current account-specific evidence.

External docs MUST NOT be confused with runtime evidence.

---

## 8. Token Budget Manager

GitSkillPro MUST implement a Token Budget Manager independent of any one model provider.

Budgets MAY be specified for:

- entire task;
- task phase;
- agent/subagent;
- retrieval source;
- input context;
- output;
- reasoning/effort where provider supports it;
- tool-result payload.

A budget is a control target, not permission to omit mandatory safety evidence.

### 8.1 Protected context

The following MUST NOT be removed merely to meet a token target when relevant:

- current user/host authority;
- destructive-action restrictions;
- task acceptance criteria;
- Definition of Done;
- current repository/ref identity;
- unexplained concurrent changes;
- active blockers;
- current risk classification;
- required recovery/rollback constraints;
- unresolved material ambiguities;
- exact evidence required for a high-risk decision.

### 8.2 Drop order under pressure

When reducing context, GitSkillPro SHOULD remove or compress in approximately this order:

1. duplicated instructions;
2. stale tool output superseded by fresher evidence;
3. irrelevant conversation history;
4. unrelated files/logs/issues;
5. verbose narrative that can be represented by structured facts;
6. previously retrieved external docs whose relevant claims are already preserved with provenance;
7. historical details outside the current dependency/supersession neighborhood;
8. large raw evidence only after a compact evidence index/locator exists.

Mandatory safety/current-state facts remain protected.

---

## 9. Retrieval-first, not dump-first

GitSkillPro MUST favor targeted retrieval primitives before full reads.

Examples:

### Repository/code

```text
repo map → search/symbol → exact file/range → neighboring dependency → full file only if needed
```

### Pull request

```text
PR metadata → changed filenames → relevant patches → full diff only when needed
```

### CI

```text
run summary → failed job → failed step → errors-only/tail logs → wider logs only if causality remains unclear
```

### Issues/Beads

```text
active item → direct blockers/dependencies → relevant supersession/duplicate neighborhood → full backlog only for recovery/portfolio questions
```

### Deployment

```text
current deployment → revision/status/errors → relevant build/runtime logs → historical deployment set only if diagnosis requires it
```

### Database

```text
migration metadata → pending migration diff → affected schema/index/table evidence → wider database inspection only if required
```

Recovery mode MUST still start with compact inventory metadata before expanding clusters.

---

## 10. Diff and delta preference

When a previous state is known, GitSkillPro SHOULD retrieve and transmit **deltas** rather than complete snapshots.

Examples:

- base..head diff instead of both source trees;
- changed workflow hunk instead of entire `.github/` directory;
- issue changes since last checkpoint instead of full thread replay;
- new comments since previous review;
- CI attempt delta;
- deployment transition since last evidence packet;
- migration set since known schema version;
- Beads graph changes since the last snapshot.

Full snapshots remain appropriate when establishing an initial baseline or when delta ancestry is uncertain.

---

## 11. Content-addressed context cache

GitSkillPro SHOULD maintain a context/evidence cache keyed by the identity that proves freshness.

Examples:

- repository content → commit SHA / blob SHA;
- file → blob/content hash;
- PR → head SHA + base SHA + update state;
- CI → run ID + attempt + job/step IDs;
- issue → issue ID + updated-at/revision;
- Beads → database/project revision or provider-supported update identity;
- deployment → deployment ID/revision;
- database → migration/schema revision;
- docs → library ID + version + query hash;
- provider resource → resource version/ETag/revision where available.

A cache hit MUST NOT be used after its invalidation key changes.

---

## 12. Prompt/model cache awareness

GitSkillPro MUST support provider-specific prompt/context caching through adapters without putting provider-specific semantics in core policy.

The system SHOULD structure reusable model input as:

```text
stable invariant prefix
  GitSkillPro policy
  repository policy
  stable schemas/tool descriptions

then

dynamic task suffix
  issue/PR/current state
  current diffs
  fresh tool evidence
  user-specific request
```

This structure SHOULD be used when supported because several model providers cache repeated prompt prefixes or reusable context.

### 12.1 OpenAI

The OpenAI adapter SHOULD support current implicit/explicit prompt caching capabilities when available, track cache-read/write metrics, and avoid unnecessary cache writes when the economics do not justify them.

### 12.2 Anthropic

The Anthropic adapter SHOULD support current prompt-cache/breakpoint semantics when available and preserve stable prefixes across repeated agent iterations.

### 12.3 Gemini

The Gemini adapter SHOULD use current implicit/explicit context caching where supported and structure shared prompt material to maximize safe reuse.

### 12.4 Cache correctness

Cache savings MUST NOT cause reuse of stale repository, issue, CI, deployment, database, or documentation state.

---

## 13. Lean instruction architecture

GitSkillPro MUST avoid one enormous always-loaded `SKILL.md` or system prompt.

Use:

- a compact core operating policy;
- small domain triggers;
- load-on-demand reference packs;
- schemas/validators for mechanical constraints;
- provider-specific references only when that provider is detected;
- recovery references only in recovery mode;
- database references only when stateful changes are relevant.

Instructions SHOULD be stated once at the narrowest durable authority level.

If the same instruction exists in host policy, root `AGENTS.md`, nested `AGENTS.md`, GitSkillPro config, and a skill reference, the context builder SHOULD resolve effective policy without blindly repeating all copies.

---

## 14. Tool-surface minimization

Agents SHOULD receive only tools relevant to the active task when the harness supports dynamic tool exposure.

Examples:

- local refactor task does not need production database mutation tools;
- documentation question does not need deployment mutation tools;
- PR review can be read-only;
- CI diagnosis can begin without source-write tools;
- recovery inventory begins read-only before cleanup mutation tools are exposed.

Tool descriptions SHOULD be concise, precise, and carry side-effect/retry semantics without repeating large global policies.

---

## 15. Model routing and reasoning economy

GitSkillPro MAY use different models/effort tiers for different phases when the harness permits it.

Model routing MUST be risk-aware.

Examples:

### Lower-cost/mechanical candidates

- metadata extraction;
- deterministic classification with schema validation;
- formatting evidence packets;
- indexing file/path maps;
- simple log clustering;
- duplicate candidate generation;
- summarizing already-verified facts.

### Higher-capability candidates

- ambiguous architecture decisions;
- R3/R4 review;
- supersession reasoning with conflicting evidence;
- CI root-cause analysis across multiple systems;
- unsafe migration/rollback decisions;
- incident/recovery planning;
- independent adversarial PR review.

A lower-cost model MUST NOT be used merely to save tokens when the task requires a stronger minimum capability under project policy.

---

## 16. Agent delegation packets

Subagents MUST receive task-specific packets rather than the supervisor's complete conversation/context.

A delegation packet SHOULD contain:

- task identity;
- exact branch/worktree;
- base SHA;
- allowed scope;
- acceptance criteria;
- direct dependencies;
- relevant files/ranges;
- required docs snippets/IDs;
- validation commands;
- forbidden mutations;
- completion/evidence contract.

The worker MAY request more context if blocked.

This request/response model is preferred to preloading speculative context.

---

## 17. Context compaction and long-running work

For tasks spanning multiple context windows or agent sessions, GitSkillPro MUST support durable **Context Checkpoints**.

A checkpoint MUST be structured and provenance-preserving rather than a freeform lossy summary alone.

It SHOULD contain:

```text
checkpoint_id
source_state_keys
current project/issue/branch/PR identities
completed actions
accepted decisions
current evidence
current blockers/unknowns
open review findings
verification state
next planned action
cache references
invalidations to re-check
```

On resume, GitSkillPro SHOULD validate freshness keys before trusting checkpoint state.

---

## 18. Summarization rules

Summaries are derived context, not canonical evidence.

A summary MUST retain source references sufficient to rehydrate the underlying evidence.

Summaries MUST NOT silently convert:

- an agent opinion into a fact;
- an old CI result into current health;
- an inferred supersession into an explicit tracker relationship;
- a deployment summary into proof of the running revision;
- an external doc snippet into proof of repository behavior.

When an important claim is disputed or high-risk, retrieve the source evidence rather than relying only on a prior summary.

---

## 19. Output-token economy

GitSkillPro SHOULD avoid wasting output tokens on information already represented structurally.

Prefer:

- schemas/structured outputs;
- status codes/enums;
- concise evidence references;
- deltas;
- actionable findings;
- one explanation per unique root cause.

Avoid:

- echoing whole input documents;
- repeating the same finding in several sections;
- narrating every successful tool call;
- reproducing long logs/diffs when exact locators exist;
- generating verbose prose for deterministic machine-to-machine handoffs.

Human-facing reports MAY be more explanatory when requested.

---

## 20. Token-aware recovery mode

Project Recovery Mode can easily become the highest-cost workflow. v0.4 therefore requires staged archaeology.

### Phase A — metadata inventory

Use compact metadata for all issues, Beads, PRs, branches, checks, deployments, and migrations.

### Phase B — clustering

Group candidates by issue identity, changed paths, ancestry, dependency graph, failure signature, and supersession evidence.

### Phase C — selective expansion

Load full diffs/logs/comments only for clusters requiring a decision.

### Phase D — salvage packet

Pass each recovery lane only the evidence required for that lane.

### Phase E — checkpoint

Persist structured reconciliation decisions so later agents do not re-read the entire archaeology corpus.

The system SHOULD measure tokens/cost per recovered artifact and per accepted recovery issue.

---

## 21. Context economics metrics

GitSkillPro SHOULD collect provider-neutral metrics and provider-specific usage when available.

Metrics SHOULD include:

- input tokens;
- cached input tokens;
- cache-write tokens/cost when applicable;
- output tokens;
- reasoning tokens/effort where exposed;
- tool-result bytes/characters/tokens where measurable;
- number of retrieval calls;
- repeated retrieval count;
- cache hit/miss rate;
- context packet size;
- context growth by phase;
- percentage of context from raw logs/diffs/docs;
- cost per completed issue;
- cost per accepted PR;
- cost per review;
- cost per CI diagnosis;
- cost per recovery artifact/project;
- quality/success rate alongside cost.

Cost MUST be evaluated against task success. Lower token count with worse decisions is not an optimization.

---

## 22. Context efficiency evaluation

GitSkillPro MUST include eval fixtures comparing:

```text
baseline broad-context strategy
vs
GitSkillPro progressive context strategy
```

The evaluation MUST measure:

- task success;
- evidence completeness;
- safety violations;
- incorrect/stale claims;
- input tokens;
- output tokens;
- retrieval/tool volume;
- cache utilization;
- latency when measurable;
- monetary cost when provider pricing is available.

The implementation MUST demonstrate meaningful context/cost reduction on representative fixtures without unacceptable quality or safety regression.

No universal percentage target is mandated because provider pricing, models, repositories, and workloads differ.

---

## 23. New CLI surface

v0.4 adds:

```text
gsp context plan
gsp context inspect
gsp context budget
gsp context packet
gsp context compact
gsp context checkpoint
gsp context trace
gsp context cache
gsp docs resolve
gsp docs query
gsp docs cache
gsp cost report
gsp cost compare
```

`gsp context trace` SHOULD explain why each major context source was loaded.

`gsp cost compare` SHOULD support comparing alternative context/model/retrieval strategies on the same fixture/task.

---

## 24. New MCP surface

v0.4 SHOULD expose structured tools equivalent to:

- `context.plan`;
- `context.packet`;
- `context.retrieve`;
- `context.compact`;
- `context.checkpoint`;
- `context.trace`;
- `context.cache.inspect`;
- `docs.resolve`;
- `docs.query`;
- `docs.cache.inspect`;
- `cost.report`;
- `cost.compare`.

These tools MUST preserve source/provenance references and MUST NOT expose secrets through documentation queries or cache records.

---

## 25. Configuration additions

`.gitskillpro.yml` SHOULD support a context section similar in semantics to:

```yaml
context:
  strategy: progressive
  docs:
    context7: auto
    version_from_lockfile: true
    cache: true
  budgets:
    task_input: auto
    task_output: auto
    tool_result: auto
  cache:
    enabled: true
    content_addressed: true
  compaction:
    enabled: true
    preserve_provenance: true
  routing:
    risk_aware_models: true
  recovery:
    metadata_first: true
    cluster_before_expand: true
```

Exact numeric budgets SHOULD be project/harness/model specific rather than hard-coded globally.

---

## 26. Repository structure additions

v0.4 adds or requires equivalents of:

```text
src/
  context/
    planner.ts
    packet.ts
    budget.ts
    retriever.ts
    cache.ts
    compactor.ts
    checkpoint.ts
    metrics.ts
    routing.ts
  adapters/
    context7.ts
    model-cache.ts

docs/
  context-economy.md
  providers/
    context7.md

schemas/
  context-packet.schema.json
  context-checkpoint.schema.json
  context-trace.schema.json
  cost-report.schema.json

tests/
  context-planner.test.ts
  context-budget.test.ts
  context-cache.test.ts
  context-compaction.test.ts
  context7-adapter.test.ts
  context-recovery.test.ts
  token-economy-eval.test.ts
```

---

## 27. Required tests

v0.4 tests MUST prove at minimum:

1. a small issue does not load the whole repository;
2. PR review starts from metadata/changed files/patches rather than full repo history;
3. CI diagnosis loads failed job/step evidence before broad logs;
4. recovery mode inventories metadata before expanding stale PR clusters;
5. direct blockers are loaded without loading an entire Beads/Linear backlog;
6. Context7 is invoked only when external library documentation is actually needed;
7. exact known Context7 IDs skip redundant resolution;
8. lockfile/package version changes invalidate version-specific docs cache;
9. Context7 queries redact/omit secrets and proprietary code;
10. repeated unchanged documentation queries hit cache rather than re-fetching;
11. content-addressed repo context invalidates when blob/SHA changes;
12. compaction preserves acceptance criteria, authority, risk, current SHA, blockers, unresolved material ambiguity, and provenance;
13. summaries cannot satisfy high-risk evidence requirements when source evidence is required;
14. subagents receive bounded task packets rather than supervisor history;
15. tool exposure can be reduced by task domain without hiding mandatory capabilities;
16. stable prefix/dynamic suffix prompt construction is available to provider cache adapters;
17. cost optimization never lowers the configured minimum model/risk tier;
18. output does not echo raw logs/diffs unnecessarily;
19. token-economy evals compare quality and safety, not token count alone;
20. cached context cannot be reused after its freshness/invalidation key changes.

---

## 28. v0.4 acceptance criteria

GitSkillPro v0.4 is acceptable only when it can:

1. create a traceable context plan for an issue/PR/recovery task;
2. build a minimal context packet from heterogeneous sources;
3. progressively expand context only when needed;
4. use Context7 for current/version-specific external docs with focused queries;
5. cache and invalidate library documentation correctly;
6. cache repository/CI/tracker/provider evidence by reliable freshness keys;
7. compact long-running context into provenance-preserving checkpoints;
8. provide narrow delegation context to subagents;
9. route model/effort tiers according to risk and task complexity where supported;
10. take advantage of provider prompt/context caching without making stale-state errors;
11. emit token/cost/evidence metrics where the harness exposes them;
12. prove through evals that the context strategy reduces cost/context volume without unacceptable task-quality or safety regression.

---

## 29. Research basis

The implementation plan SHOULD re-check current official documentation before implementing provider-specific cache APIs.

Initial research references:

- Context7 API guide: `https://context7.com/docs/api-guide`
- Context7 best practices: `https://context7.com/docs/tips`
- Context7 privacy: `https://context7.com/docs/security/data-privacy`
- Context7 CLI: `https://context7.com/docs/clients/cli`
- OpenAI current model/prompt-cache guidance: `https://developers.openai.com/api/docs/guides/latest-model`
- Anthropic current prompt/context caching documentation under `https://docs.anthropic.com/`
- Gemini context caching: `https://ai.google.dev/gemini-api/docs/caching`

Provider cache semantics MUST remain adapter-specific because they change independently.

---

## 30. Canonical rule

The implementation plan MUST read specifications in order:

1. `SPEC.md`;
2. `SPEC-v0.2.md`;
3. `SPEC-v0.3.md`;
4. `SPEC-v0.4.md`.

The newest specification wins where requirements conflict.
