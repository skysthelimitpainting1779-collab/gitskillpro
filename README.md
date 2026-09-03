# GitSkillPro

GitSkillPro is a universal software-workflow and repository-operations system for coding agents. It combines an Agent Skill, shared policy/decision engine, CLI, MCP/plugin architecture, and capability-aware adapters for project/work-graph management, Git/SCM, CI, deployment, infrastructure, databases, repository automation, recovery, and context/token efficiency.

The core rule is: **use the safest capability that is actually proven, keep each system's truth separate, and require evidence for every material postcondition.**

## Working implementation

### Foundation

- environment/capability discovery;
- R0-R4 risk and authority gates;
- evidence packets;
- read-only local Git inspection/audit;
- publishable TypeScript package and deterministic least-privilege CI.

### Workflow + work graphs

- explicit authority maps across Linear, Beads, GitHub and other systems;
- dynamic provider statuses, Definition of Ready/Done, lifecycle gates;
- host-provided Linear normalization;
- version-aware Beads discovery/concurrency assessment;
- agent comments separated from independent code review;
- guarded R1 local worktree delegation + remote delegation planning;
- work-graph duplicate/supersession/blocker audit;
- greenfield bootstrap planning.

### Recovery / archaeology

- evidence graph across issue/work item → branch/worktree → commits → PR → review → CI → merge → deployment/database evidence;
- default-branch CI baseline diagnosis before blaming failed PRs;
- multi-label PR/work classification with `unknown` preserved as a valid state;
- evidence-backed duplicate/supersession reasoning—newer timestamp/title alone is never enough;
- selective salvage planning: rerun after shared CI repair, fresh-branch cherry-pick/patch, current-spec reimplementation, hold unknown, or no salvage;
- tracker/code/runtime reconciliation proposals without writes;
- six-lane project recovery plans ending in one clean proving issue;
- snapshot-driven `gsp recover` CLI that is read/classify/plan only.

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
gsp audit git [--json]
gsp audit beads [--json]
gsp bootstrap plan [--json]
gsp delegate plan <issue-id> <title> [--json]
gsp recover project <snapshot.json> [--json]
gsp recover ci <snapshot.json> [--json]
gsp plan <intent> [--json]
```

Recovery snapshot commands consume JSON as data only. They do not execute snapshot-provided scripts, close PRs, delete branches, mutate Linear/Beads/GitHub, change repository rules, deploy, or migrate databases.

## Authority model

A common layered configuration is:

```text
Linear              -> project outcome / human-visible intent
Beads               -> executable dependency graph / blockers / claims
GitHub               -> branches / commits / PRs / reviews / checks / merge
CI / Deploy / DB     -> their own execution and runtime evidence
```

Mirrors are projections unless explicitly made canonical. Similar names alone never establish identity.

## Recovery model

For an inherited unhealthy project, GitSkillPro performs archaeology before cleanup:

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

The standard recovery lanes are work-graph reconciliation, default-branch CI repair, governance repair, PR salvage/cleanup, deployment/database reconciliation, then the proving issue.

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

## Next stack layers

1. **Providers + databases** — GitHub remote operations, Vercel, Cloudflare, Hostinger, Supabase/database adapters and deployment/migration gates.
2. **Context economy** — Context7, progressive retrieval, content-addressed cache/checkpoints and token/cost telemetry.
3. **Automation + frontier** — auto-commit actors, Change Graph/stacked PRs, merge groups, provenance/SBOM, policy-as-code, progressive release and preview databases.
4. **MCP + plugin packaging** — actual MCP transport and OpenAI-compatible plugin packaging over the proven core.
