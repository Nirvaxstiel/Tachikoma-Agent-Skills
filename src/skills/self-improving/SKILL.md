---
name: self-improving
description: Self-improvement skill — save completed procedures as reusable skills for future sessions
keywords: [skill, save, learn, procedure, reusable]
triggers: [save as skill, remember this, learn from this]
---

# Self-Improving Skills

Tachikoma learns from completed tasks by saving procedures as reusable skills.

## Trigger
After completing any complex, non-trivial task.

## Offer Template
"Done! This was a [description]. Want me to save this as a skill for future sessions?"

## Skill File Structure
Save to `src/skills/<name>/SKILL.md`:
- name: slug-style identifier
- description: one-line summary  
- keywords: for skill discovery
- triggers: when to invoke
- When to Use: context
- Steps: numbered procedure
- Tips: gotchas and notes

## Skill Discovery
Skills in `src/skills/` are auto-discovered. Use relevant keywords and triggers for the agent to find them at the right time.
