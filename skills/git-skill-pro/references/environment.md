# Environment and Capability Interpretation

Use capability facts, not environment labels, to decide what an agent may do.

## Important distinctions

- **Persistent local clone:** may support writable Git and worktrees, but prove persistence/writability instead of assuming it.
- **Linked worktree:** local Git state is isolated by path/branch, not by database/work-graph/provider state. Other shared systems may still collide.
- **CI runner / ephemeral sandbox:** filesystem writes may exist without durable persistence. Do not claim work will survive the session.
- **Container:** container presence says nothing by itself about persistence, credentials, or production identity.
- **VPS/remote machine:** do not infer production authority simply because the machine is long-lived.
- **Plugin/connector-only host:** remote provider state may be observable while local working tree/index/reflog/worktrees are completely unavailable.
- **Read-only environment:** inspection may be possible; mutation planning must report capability absence instead of inventing a workaround.

## Truthfulness rule

If a fact cannot be observed, represent it as unknown. Do not convert `unknown` into `false`, and do not treat a writable filesystem as proof that it is persistent.

## Concurrency rule

Even a clean snapshot is only a point-in-time observation. Before a material mutation, refresh the state relevant to that mutation (HEAD/ref, PR head/base, CI run, deployment revision, migration version, or work-graph claim).
