---
description: "Diagnosis loop for hard bugs and performance regressions. Use when the user says 'diagnose'/'debug this', or reports something broken/throwing/failing/slow."
---

Use the Agent Skill `diagnosing-bugs`.

Skill file: `.agents/skills/diagnosing-bugs/SKILL.md`. Load it via the `skill` tool and follow it exactly.

Provided arguments: $ARGUMENTS

If arguments are provided, treat them as the skill input (scope, target, or question). If empty, ask the user what input the skill needs before proceeding.
