---
description: "Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when user wants to prevent destructive git operations, add git safety ..."
---

Use the Agent Skill `git-guardrails-claude-code`.

Skill file: `.agents/skills/git-guardrails-claude-code/SKILL.md`. Load it via the `skill` tool and follow it exactly.

Provided arguments: $ARGUMENTS

If arguments are provided, treat them as the skill input (scope, target, or question). If empty, ask the user what input the skill needs before proceeding.
