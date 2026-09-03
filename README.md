# GitSkillPro

GitSkillPro is a universal software-workflow and repository-operations system for coding agents. It combines an Agent Skill, shared policy/decision engine, CLI, MCP/plugin architecture, and capability-aware adapters for work graphs, Git/SCM, CI, autonomous PR review, deployment, infrastructure, databases, project recovery, and context/token efficiency.

The core rule is: **use the safest capability that is actually proven, keep each system's truth separate, and require evidence for every material postcondition.**

## Working implementation

The current stacked implementation includes:

- environment/capability discovery, R0-R4 policy and provenance-safe evidence;
- read-only local Git inspection/audit and guarded R1 worktree delegation;
- Linear/Beads/GitHub authority maps, Definition of Ready/Done, lifecycle and independent-review gates;
- greenfield workflow bootstrap planning;
- takeover/recovery archaeology for broken default-branch CI, failed/stale/superseded PRs, tracker drift and selective salvage;
- provider config discovery and host-evidence normalization;
- CI causality audit and autonomous PR merge-readiness audit;
- Vercel, Cloudflare and Hostinger deployment normalization/audit;
- database engine/provider/migration-framework discovery, SQL risk classification, expand/contract planning and DB preflight/rollback audits;
- **Context Economy**: minimum-sufficient context plans, progressive retrieval, content-addressed cache/freshness, evidence-safe checkpoints, bounded subagent packets, host-native Context7 request planning, and token/quality telemetry.

Provider writes and production mutations remain separately authority-gated. The current provider/context surfaces are inspection, normalization, audit, or planning unless explicitly documented otherwise.

## Development

```bash
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

## CLI

```text
gsp doctor [--json]
gsp inspect [--json]
gsp detect providers [--json]

gsp audit git [--json]
gsp audit beads [--json]
gsp audit ci <snapshot.json> [--json]
gsp audit pr <snapshot.json> [--json]
gsp audit deploy <snapshot.json> [--json]
gsp audit db <snapshot.json> [--json]

gsp bootstrap plan [--json]
gsp delegate plan <issue-id> <title> [--json]
gsp recover project <snapshot.json> [--json]
gsp recover ci <snapshot.json> [--json]

gsp context plan <snapshot.json> [--json]
gsp context checkpoint <snapshot.json> [--json]
gsp docs plan <snapshot.json> [--json]
gsp cost report <snapshot.json> [--json]

gsp plan <intent> [--json]
```

Snapshot commands consume JSON as data only. They do not execute snapshot-provided scripts or silently mutate GitHub, Linear, Beads, providers, deployments, or databases.

## Authority model

A common layered configuration is:

```text
Linear              -> project outcome / human-visible intent
Beads               -> executable dependency graph / blockers / claims
GitHub               -> branches / commits / PRs / reviews / checks / merge
CI                   -> CI execution evidence
Deployment provider  -> deployment/revision/runtime evidence
Database provider    -> schema/data/recovery evidence
Context7             -> external version-specific documentation evidence
```

Mirrors are projections unless explicitly made canonical. Similar names alone never establish identity.

## Context Economy

GitSkillPro does not equate a large context window with better reasoning. It plans the minimum sufficient packet and expands only when uncertainty survives narrower evidence.

```text
TASK / POLICY
  -> CURRENT IDENTITIES + ACCEPTANCE CRITERIA
  -> NARROW ARTIFACT / DIFF / FAILED STEP
  -> DIRECTLY RELATED EVIDENCE
  -> WIDER HISTORY ONLY IF STILL UNRESOLVED
  -> CHECKPOINT + REFERENCES
```

Context caches are keyed to the evidence identity that controls freshness: Git SHA/blob, PR head, CI run/attempt, deployment ID, migration version, tracker revision, or Context7 library/version/query.

Context7 is modeled as a host-native adapter boundary. GitSkillPro plans `resolve-library-id` then `query-docs` when needed; it does not embed Context7 credentials or send raw private code/secrets to documentation retrieval.

Token savings count as successful only when task success, evidence completeness and quality are preserved.

## Recovery model

For an inherited unhealthy project:

```text
INVENTORY
  -> EVIDENCE GRAPH
  -> DEFAULT-BRANCH CI BASELINE
  -> CLASSIFY PRs / WORK ITEMS
  -> DUPLICATE / SUPERSESSION GRAPH
  -> SELECTIVE SALVAGE PLAN
  -> TRACKER / CODE / RUNTIME RECONCILIATION
  -> RECOVERY LANES
  -> ONE CLEAN END-TO-END PROVING ISSUE
```

## Canonical specifications

The design is cumulative; newer specifications win where they conflict:

- [`SPEC.md`](./SPEC.md) — core Git/CI/deployment/database contract.
- [`SPEC-v0.2.md`](./SPEC-v0.2.md) — Linear/issues/projects, agent comments/reviews, greenfield workflow and repository governance.
- [`SPEC-v0.3.md`](./SPEC-v0.3.md) — Beads/work graphs and takeover/recovery archaeology.
- [`SPEC-v0.4.md`](./SPEC-v0.4.md) — Context7 and Context Economy Engine.
- [`SPEC-v0.5.md`](./SPEC-v0.5.md) — auto-commit/repository automation actors and separate automation authorities.
- [`SPEC-v0.6.md`](./SPEC-v0.6.md) — change graphs, stacked PRs, merge groups, alternative VCS, MCP/A2A, reproducible environments, policy-as-code, supply-chain provenance, progressive delivery, preview databases, deterministic codemods and proof-carrying change manifests.

## Operating modes

- **Normal** — healthy issue-to-production execution.
- **Greenfield bootstrap** — establish a reliable workflow before feature work.
- **Takeover / recovery** — reconstruct and repair inherited messy projects before broad mutation.
- **Incident** — prioritize service restoration and evidence preservation.

## Remaining stack layers

1. **Repository automation** — auto-stage/commit/push/PR/merge/deploy actors, hooks/watchers/bots, ownership, idempotency and loop prevention.
2. **Frontier change system** — logical Change Graph, stacked PR/merge-group semantics, proof-carrying change manifests, provenance/policy/progressive delivery abstractions.
3. **MCP + plugin packaging** — actual MCP transport and OpenAI-compatible plugin packaging over the proven core.
