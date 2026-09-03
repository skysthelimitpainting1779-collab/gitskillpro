# Frontier Change System

Use this reference when a repository uses stacked PRs, merge queues/groups, rebasing-heavy workflows, Jujutsu/alternative VCS semantics, artifact attestations/SBOMs, policy-as-code, feature flags/progressive delivery, or when autonomous review needs a compact proof object for a change.

## Logical Change identity

A **logical Change** is the intended unit of work. A Git commit SHA is one physical version of that logical Change.

Do not use the current commit SHA as the only identity when a change may be rebased, amended, salvaged, restacked, or represented by multiple physical commits over time. Preserve:

- logical Change ID;
- physical version/commit SHA;
- base SHA;
- work-item identity;
- dependencies/stack position;
- supersession;
- conflict state.

Git remains canonical physical repository history. The Change layer adds identity/relationships; it does not rewrite Git truth.

For Jujutsu or another alternative VCS, normalize its stable change identity separately from the physical Git-compatible commit ID. A VCS that can preserve conflicted state does **not** mean the conflict is resolved or safe to integrate.

## Stacked changes / PRs

An upper stack layer depends on the exact validated identities of lower layers. If a lower logical Change gets a new physical head, dependent upper evidence is stale until the upper layer is restacked/revalidated.

Do not infer stack freshness because the upper PR head itself did not move.

## Merge groups / merge queues

PR-head CI and merge-group CI are different evidence identities.

If repository policy requires a merge group/queue:

1. obtain the exact merge-group SHA;
2. require the configured checks on that SHA;
3. do not reuse successful PR-head checks as merge-group proof;
4. invalidate the merge recommendation when the merge-group SHA changes.

## Proof-Carrying Change Manifest

For material autonomous changes, carry a compact manifest that references evidence rather than duplicating it.

Typical fields:

- work item IDs;
- logical Change ID + version;
- head/base SHA;
- dependency Change IDs + exact dependency heads;
- affected/dependency-graph refs;
- diff refs;
- risk tier;
- CI/check refs;
- security refs;
- migration/database identity;
- deployment revision;
- feature flag/release refs;
- provenance / SBOM refs;
- independent-review refs;
- recovery refs;
- context-packet hash;
- explicit unknowns.

Manifest fingerprinting is deterministic over evidence identity. Any material identity drift—head, base, lower dependency, migration version, deployment revision, context packet, or other required source—makes affected proof stale and requires revalidation.

## Provenance and policy

Keep separate:

- source commit verification;
- artifact attestation;
- artifact signature;
- SBOM;
- policy evaluation;
- deployment/runtime health.

One does not prove the others.

Policy-as-code evidence should identify the policy ID/version, evaluation input hash, allow/deny/unknown result, reasons, and source reference. Treat the evaluation as evidence, not a prose approval substitute.

## Deployment vs release

Deployment means a revision exists in an environment. Release/exposure means users are actually routed to or enabled for the change.

For progressive delivery:

`DEPLOY → VERIFY DEPLOYMENT → EXPOSE/PROMOTE → OBSERVE RELEASE METRICS → PROMOTE AGAIN / COMPLETE / PAUSE / ROLLBACK`

A healthy deployment at 0%, 10%, or 50% exposure is not a fully released feature when target exposure is higher.

Feature flags/rollout identities are evidence inputs; do not assume a provider-specific flag system unless detected/proven.

## Maturity rule

Frontier capabilities are feature-detected enhancements. Never force stacked PRs, Jujutsu, merge queues, attestations, feature flags, or a specific policy engine into repositories that do not use them. The universal safety model must remain valid without them.
