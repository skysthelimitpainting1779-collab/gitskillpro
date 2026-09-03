# Context Economy

Use this reference when a task could expand into large repository history, PR diffs, CI logs, recovery evidence, external documentation, or repeated subagent handoffs.

## Governing rule

Use the **minimum sufficient context for a correct, evidence-backed decision**. Token reduction is an optimization constraint, never permission to omit current state, acceptance criteria, safety evidence, recovery evidence, or unresolved unknowns.

## Progressive retrieval

Start narrow and expand only when uncertainty remains:

- **CI:** workflow run → failed job → failed step/error excerpt → wider job logs only if still unresolved.
- **PR:** PR metadata/current head → changed filenames → changed patches → directly related source → wider repository only if still unresolved.
- **Recovery:** inventory metadata → problematic clusters → exact history/evidence for unresolved clusters.
- **Docs:** repository dependency/version evidence → exact Context7 library resolution → one focused concept query.

Do not dump an entire repository, transcript, CI log archive, or PR history into a model when a bounded artifact can answer the decision.

## Context packets

Required context includes task scope, acceptance criteria, applicable policy/risk, current expected-state evidence, direct blockers, and unresolved safety-relevant unknowns. Optional material is ranked and deferred when it does not fit the budget.

R3/R4 required evidence may exceed a nominal token budget. Increase the context budget rather than dropping required evidence.

## Checkpoints and subagents

Checkpoint accepted facts, evidence references, decisions, unresolved unknowns, and the next action. Never compact an unresolved unknown into an accepted fact.

Subagents receive a **bounded task packet** built from the current checkpoint plus their task/acceptance criteria and relevant evidence references. Do not inherit the supervisor's entire conversation merely for convenience.

## Content-addressed cache

Cache by the identity that makes evidence current:

- Git SHA/blob hash;
- PR number + current head SHA;
- CI run + attempt + revision;
- tracker item + revision;
- deployment ID/revision;
- migration version;
- Context7 library ID + version + focused query.

A changed identity is a cache miss. Expired evidence is a cache miss. Cache reuse never changes source authority.

## Context7

Prefer the host-native Context7 integration for current/version-specific library/framework/API documentation when available.

1. Determine the dependency/product version from repository evidence.
2. If an exact Context7 library ID is already proven, query it directly.
3. Otherwise resolve the official library name with one focused concept.
4. Query one concept at a time and cache the result by library/version/query.
5. Never send secrets, credentials, private keys, proprietary source, or broad internal transcripts. Send a privacy-safe technical question.
6. If the requested repository version is not among returned Context7 versions, preserve that mismatch as unknown; do not invent a resolved version.

## Cost telemetry

Track input, output, retrieved, cached and avoided token estimates separately. Token savings count as successful only when task success is preserved and measured quality/evidence completeness do not regress.

A cheaper wrong or incomplete answer is a failed optimization.
