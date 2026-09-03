# GitSkillPro

GitSkillPro is a universal software-workflow and repository-operations system for coding agents. It combines an Agent Skill, shared policy/decision engine, CLI, MCP/plugin architecture, and capability-aware adapters for project/work-graph management, Git/SCM, CI, deployment, infrastructure, databases, repository automation, recovery, and context/token efficiency.

The core rule is simple: **use the safest capability that is actually proven, keep each system's truth separate, and require evidence for every material postcondition.**

## Working implementation

The current stacked implementation contains two proven layers.

### Foundation

- environment and capability discovery;
- R0-R4 risk vocabulary and policy gates;
- provenance-safe evidence packets;
- read-only local Git inspection and Git safety audit;
- publishable TypeScript package and `gsp` CLI;
- deterministic, least-privilege GitHub Actions verification.

### Workflow + work graphs

- explicit authority maps across Linear, Beads, GitHub and other systems;
- dynamic provider-status mapping;
- Definition of Ready and Definition of Done checks;
- workflow lifecycle gates;
- host-provided Linear issue normalization without duplicate auth logic;
- version/capability-aware Beads discovery and concurrency assessment;
- material agent comments separated from code-review decisions;
- independent-review requirements by risk tier;
- capability-aware delegation planning;
- guarded R1 local Git worktree creation that does not stash/reset/clean supervisor work;
- work-graph duplicate/supersession/blocker audit;
- greenfield workflow bootstrap planning;
- workflow/Beads load-on-demand Agent Skill references.

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
gsp plan <intent> [--json]
```

The CLI's workflow commands are read/audit/plan surfaces. Provider writes, Linear mutations, Beads claims, remote PR mutations, deploys, and database mutations remain separate permission- and policy-gated capabilities.

## Authority model

GitSkillPro does not assume one tracker owns every form of truth. A common layered configuration is:

```text
Linear
  canonical: project outcome, human-visible issue intent, milestones

Beads
  canonical: executable dependency graph, blockers, claims, discovered work

GitHub
  canonical: branches, commits, PRs, reviews, checks, merge state

CI / Deployment / Database providers
  canonical: their own execution and runtime evidence
```

Mirrors are links/projections unless explicitly configured as canonical. Similar names alone never establish cross-system identity.

## Delegation model

When a persistent local Git worktree capability is proven **and** the active work-graph backend is safe for concurrent writers:

```text
one task -> one branch -> one worktree -> one agent -> one evidence packet
```

Otherwise GitSkillPro plans remote branch/session isolation and records the limitation. Multiple Git worktrees do not make an embedded, single-writer, or unknown Beads store safe for simultaneous writers.

## Review model

A comment is not a code review. A code review is not automatically merge authorization. Merge recommendation, merge authorization, and merge execution remain distinct.

R3/R4 work requires an independent reviewer; the implementing agent cannot satisfy that gate by approving its own change.

## Greenfield mode

A new project is bootstrapped in this order: repository baseline and instructions, tracker authority, issue conventions, branch/worktree isolation, trusted CI baseline, PR/review policy, repository-rule audit, deployment/database discovery, Definition of Ready/Done, context policy, then one representative proving issue through the full declared lifecycle.

GitSkillPro does not invent licenses, maintainers, security contacts, credentials, deployment accounts, or database ownership.

## Canonical specifications

The design is cumulative; newer specifications win where they conflict:

- [`SPEC.md`](./SPEC.md) — core Git/CI/deployment/database contract.
- [`SPEC-v0.2.md`](./SPEC-v0.2.md) — Linear/issues/projects, agent comments/reviews, greenfield bootstrap, issue-to-PR workflow, repository governance.
- [`SPEC-v0.3.md`](./SPEC-v0.3.md) — Beads/work graphs and takeover/recovery archaeology.
- [`SPEC-v0.4.md`](./SPEC-v0.4.md) — Context7 and Context Economy Engine.
- [`SPEC-v0.5.md`](./SPEC-v0.5.md) — auto-commit/repository automation actors and separate automation authorities.
- [`SPEC-v0.6.md`](./SPEC-v0.6.md) — change graphs, stacked PRs, merge groups, alternative VCS, MCP/A2A, reproducible environments, policy-as-code, supply-chain provenance, progressive delivery, preview databases, deterministic codemods and proof-carrying change manifests.

## Operating modes

- **Normal** — healthy issue-to-production execution.
- **Greenfield bootstrap** — establish a reliable delivery system before feature work.
- **Takeover / recovery** — reconstruct and repair inherited messy repositories before broad mutation.
- **Incident** — prioritize service restoration and evidence preservation under incident policy.

## Next stack layers

1. **Recovery** — project evidence graph, default-branch CI baseline diagnosis, failed/stale/superseded PR classification, selective salvage and tracker reconciliation.
2. **Providers + databases** — GitHub remote operations, Vercel, Cloudflare, Hostinger, Supabase/database adapters and deployment/migration gates.
3. **Context economy** — Context7, progressive retrieval, content-addressed cache/checkpoints and token/cost telemetry.
4. **Automation + frontier** — auto-commit actors, Change Graph/stacked PRs, merge groups, provenance/SBOM, policy-as-code, progressive release and preview databases.
5. **MCP + plugin packaging** — actual MCP transport and OpenAI-compatible plugin packaging over the proven core.
