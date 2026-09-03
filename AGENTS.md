# AGENTS.md

Scope: entire repository unless a deeper `AGENTS.md` narrows a subtree.

## Required reading

Before changing GitSkillPro behavior, read in order:

1. `SPEC.md`
2. `SPEC-v0.2.md`
3. `SPEC-v0.3.md`
4. `SPEC-v0.4.md`
5. `SPEC-v0.5.md`
6. `SPEC-v0.6.md`
7. the relevant implementation plan under `docs/superpowers/plans/`

The newest spec wins where requirements conflict.

## Safety contract

- Prefer truthful partial knowledge over invented completeness.
- Assume other agents or humans may mutate the same repository or infrastructure concurrently.
- Never discard unexplained work.
- Do not claim persistence, CI health, deployment health, database health, or production health without evidence from the layer that can prove it.
- Keep observation, recommendation, attempted mutation, and proven persistence separate.
- This foundation phase is read/audit/plan only: no automatic merge, deployment, database mutation, provider mutation, branch-protection change, or destructive Git action.
- New executable primitives default to mutation-denied until risk metadata exists.

## Development

Use test-first behavior for behavioral changes. Before calling work complete, run typecheck, tests, build, package/CLI smoke checks, and verify that read-only Git commands caused no repository mutation.
