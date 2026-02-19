# Codex Instructions

## CRITICAL RULE (BLOCKING)

`git push` is strictly forbidden.
If a push seems necessary, Codex must stop and ask first.

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

## Codex Worktree

Branch safety rules are defined in `doc/ai-agent-instructions.md` (section 5).

Codex isolated worktree path: `/tmp/tgc-codex-worktree`.

## Autonomy Trigger

If the user asks for "en autonomie" (or equivalent wording), Codex must:

1. Work only in `/tmp/tgc-codex-worktree`.
2. Use a dedicated Codex branch named `codex/<description>`.
3. Avoid any code modification in the user's main worktree.
