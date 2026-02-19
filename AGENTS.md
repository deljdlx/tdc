# Codex Instructions

## ⚠️ BEFORE EVERY TASK (Mandatory)

**YOU MUST read these files FIRST at the start of every task:**

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`
3. Reference `doc/prompts/` and `doc/stack.md` as needed

These are the **source of truth** for:

- code style
- naming conventions
- contribution quality bar
- validation and completion checks
- anti-patterns to avoid

## Mandatory Shared Instruction Set

Read and apply, in this order:

1. `doc/ai-agent-instructions.md`
2. `doc/ai-code-style.md`

These files are the source of truth for:

- code style
- contribution quality bar
- validation and completion checks

## Project References

1. `doc/prompts/` for engine/domain conventions.
2. `doc/stack.md` for stack and scripts.

## Codex Branch Safety (Mandatory)

These rules apply specifically to Codex.

1. Codex must not change the user's active branch for merge/rebase/cherry-pick operations.
2. Codex must not run `git checkout <other-branch>` in the user's active working tree to perform merges.
3. For any merge into `main` (or other integration branch), Codex must use a separate git worktree or separate clone.
4. If a safe isolated worktree is not available, Codex must ask before proceeding.
