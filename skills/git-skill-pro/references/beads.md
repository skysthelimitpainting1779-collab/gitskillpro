# Beads Work-Graph Safety

Load this reference when `.beads/`, the `bd` CLI, Beads issue IDs, or Beads-backed agent execution is present.

## Detect, do not initialize blindly

Before using Beads, inspect:

- whether `bd` is installed and its version;
- command surface from the installed tool;
- whether the current directory belongs to a Beads project;
- observed storage/server mode;
- remote/synchronization configuration where safely observable;
- whether the current topology is actually safe for concurrent writers.

Beads changes quickly. Feature-detect commands rather than assuming a fixed release.

## Semantic work graph

When supported by the installed version, understand concepts equivalent to:

- ready/blocker-aware executable work;
- atomic claim/ownership transition;
- dependency edges;
- duplicate relationships;
- supersession relationships;
- discovered-from provenance;
- close/reopen/update flows;
- Dolt-backed history/synchronization.

Prefer explicit duplicate/supersession relationships over deleting old work.

## Multi-agent caution

Multiple Git worktrees do **not** prove that Beads accepts safe simultaneous writers.

- embedded/single-writer mode: treat concurrent writes as unsafe;
- server/shared-server mode: require explicit healthy-server evidence;
- unknown mode: treat concurrent writes as unsafe until proven otherwise.

## Recovery caution

The Beads store itself can be the broken layer. Distinguish Git/CI failure from Beads project identity, server, remote, synchronization, version, or database problems.

Preserve recoverable `.beads` state before destructive repair. Do not delete `.beads`, reset its database, or import an old export merely because a doctor/bootstrap command failed.

The currently implemented GitSkillPro Beads adapter is observational: version/help and project/config discovery. Claims/updates remain separately permission- and policy-gated.
