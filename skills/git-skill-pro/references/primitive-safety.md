# Foundation Git Primitive Safety Reference

This is a load-on-demand baseline, not the complete future primitive registry.

| Primitive / intent | Default risk | Shared impact | Foundation execution | Required preflight | Recovery posture |
| --- | --- | --- | --- | --- | --- |
| `status`, `diff`, `show`, `log`, `rev-parse` | R0 | none | allowed | repository observable | none |
| `worktree list`, `remote -v`, config reads | R0 | none | allowed | Git capability proven | none |
| stage/add/restore paths | R1 | local | plan only | work ownership proven; expected HEAD/state current | preserve patch/reference |
| local commit on isolated task branch | R1 | local history | plan only | scope + branch/worktree ownership | backup/ref/reflog awareness |
| branch/worktree creation | R1 | local refs/worktree | plan only | persistent writable Git + isolation | remove only after accepted integration |
| stash | R1 | local hidden state | plan only | ownership known; reason recorded | list/apply/pop carefully; not delegation isolation |
| push task branch | R2 | remote shared | plan only | remote authority + expected remote ref | non-destructive follow-up preferred |
| PR/comment/review mutation | R2 | remote collaboration | plan only | correct repo/PR/head identity | amend/correct with explicit history |
| rebase published branch | R3 | shared history | plan only | branch ownership + downstream impact | backup ref + range-diff + force-with-lease policy |
| `push --force-with-lease` | R3 | remote history rewrite | plan only | private/authorized branch + verified lease | backup ref and explicit rollback reference |
| plain `push --force` | R4 default deny | remote destructive | denied | explicit exceptional governance | recovery not guaranteed |
| merge protected/default branch | R3 | integration | plan only | independent review + fresh checks + merge policy | revert/forward-fix plan |
| `reset --hard`, `clean -fd` with unexplained work | R4 | destructive local data | denied | ownership and recovery proof required | preserve work first |

A command's flags and context can raise risk. The table is a starting classification, not permission to execute.
