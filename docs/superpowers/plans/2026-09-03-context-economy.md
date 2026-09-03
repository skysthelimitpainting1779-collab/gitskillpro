# GitSkillPro Context Economy + Context7 Implementation Plan

**Base:** verified provider/database SHA `1c51ce738a47a96b443d8fb9bd1844501dba804f`

**Goal:** implement SPEC-v0.4 as a measurable context-planning layer that minimizes token/context use without weakening evidence, safety, freshness, or task success.

## Guardrails

- Minimum sufficient context, not maximum available context.
- Progressive disclosure: task/policy → map/metadata → exact artifact/diff/log → wider context only when uncertainty remains.
- Context savings never suppress R3/R4 evidence, current-state verification, acceptance criteria, rollback evidence, or unresolved unknowns.
- Context7 is host-native. GitSkillPro models resolve/query requests and normalizes host responses; it does not embed credentials or a duplicate Context7 network client.
- Queries to external documentation must be privacy-safe and contain no secrets or proprietary source.
- Cache keys are content/version/query addressed. A cache hit never changes source authority or freshness rules.
- Subagents receive bounded task packets, not inherited supervisor conversation history.

## Task 1 — Context packet contract + budget planner

Create `src/context/types.ts`, `src/context/planner.ts`, `tests/context-planner.test.ts`.

Prove:
- required scope, acceptance criteria, risk, expected-state evidence and unresolved blockers are retained;
- optional material is ranked/deferred when a token budget is exceeded;
- R3/R4 required evidence cannot be dropped merely to meet budget;
- packet output records included/deferred items and reasons.

## Task 2 — Delta-first retrieval planner

Create `src/context/retrieval.ts`, `tests/context-retrieval.test.ts`.

Prove task-specific strategies:
- CI: run → failed job → failed step/log excerpt → wider logs only if unresolved;
- PR: metadata → changed filenames → patches → related source → wider repo only if needed;
- recovery: inventory metadata → problematic clusters → exact history/evidence;
- docs: dependency/version evidence → exact Context7 library resolution → one-concept query.

## Task 3 — Content-addressed cache + freshness

Create `src/context/cache.ts`, `tests/context-cache.test.ts`.

Keys support Git blob/SHA, PR head SHA, CI run+attempt, issue revision, deployment ID, migration version, and Context7 library/version/query. Cache entries include source, observedAt, freshness policy and content hash. Stale/changed identities miss rather than silently reuse old evidence.

## Task 4 — Checkpoints / compaction / bounded handoff

Create `src/context/checkpoint.ts`, `tests/context-checkpoint.test.ts`.

Checkpoint contains scope, accepted facts, evidence references, decisions, unresolved unknowns, next action, and delta since previous checkpoint. Never compact an unresolved uncertainty into a fact. Build bounded subagent packets from checkpoint + current task rather than full transcript inheritance.

## Task 5 — Context7 host adapter boundary

Create `src/adapters/context7.ts`, `tests/context7.test.ts`.

Model the actual connected host surface:
1. resolve library ID from official library name + one focused query unless exact `/org/project[/version]` is already known;
2. query docs by exact Context7 library ID and one concept;
3. normalize resolution/query evidence and cache key inputs;
4. reject queries that appear to contain secrets/credentials and require caller-supplied privacy-safe summaries rather than proprietary code.

No embedded HTTP client or Context7 credential handling.

## Task 6 — Cost telemetry / CLI / Skill / acceptance

Create `src/context/cost.ts`, `tests/context-cost.test.ts`, `tests/context-acceptance.test.ts`, `skills/git-skill-pro/references/context-economy.md`; update `src/index.ts`, `src/cli/index.ts`, `skills/git-skill-pro/SKILL.md`, README and CI.

CLI:
- `gsp context plan <snapshot.json> [--json]`
- `gsp context checkpoint <snapshot.json> [--json]`
- `gsp docs plan <snapshot.json> [--json]`
- `gsp cost report <snapshot.json> [--json]`

Cost report distinguishes input, output, cached, retrieved and avoided-token estimates when supplied. It must never report lower token count as success without quality/evidence metrics.

Final verification: `npm ci --ignore-scripts`, typecheck, full test suite, build, pack dry-run, old CLI smoke, new context CLI smoke, tracked-state cleanliness.
