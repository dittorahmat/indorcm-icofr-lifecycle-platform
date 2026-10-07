---
description: "Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-p..."
---

Use the Agent Skill `wizard`.

Skill file: `.agents/skills/wizard/SKILL.md`. Load it via the `skill` tool and follow it exactly.

Provided arguments: $ARGUMENTS

If arguments are provided, treat them as the skill input (scope, target, or question). If empty, ask the user what input the skill needs before proceeding.
