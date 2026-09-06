# CLAUDE.md

Read `AGENTS.md` (root) first, then the `AGENTS.md` of the package you are editing.

Plan docs live in the private repo `EshMis/ai-ops`, checked out at
`~/Developer/ai-ops/desk/leona/plans/`. Cite that absolute path — the `plans` symlink at
this repo's root is untracked and gitignored, so it exists only in the primary checkout and
a bare `plans/...` reference dangles in every worktree.

- `~/Developer/ai-ops/desk/leona/plans/roadmap/00-INDEX.md` — stage map
- `~/Developer/ai-ops/desk/leona/plans/rebuild/05-security.md` — security gate
- `~/Developer/ai-ops/desk/leona/plans/leona-block-repository-roadmap.md` — block-repository direction
- `docs/adr/` — architecture decisions, in this repo

The security gate is **not** `plans/security-baseline.md` — that path does not exist and the
file it names is superseded, in `.../plans/attic/`, describing a Supabase/Firebase stack this
project never built.

Current phase: `~/Developer/leona/memory/NEXT.md`. The owner's queue is
`~/Developer/ai-ops/desk/DESK.md`.

Both resolve into `~/Developer` and are readable from every session type. The
`~/Documents/Projects/Majorana/...` form this line used to name is a TCC-protected compat
symlink — an SSH-launched or sandboxed session can `stat` it but not read it, which surfaces
as `Operation not permitted` and looks like a missing file. Do not rewrite either path back.

`dev` is production — see AGENTS.md § Branching before merging anything.
