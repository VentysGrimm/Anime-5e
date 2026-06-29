# Creation Workflow Hooks

This pass adds owned-item hooks for the character creation workflow.

## Added

- `module/rules/creation-workflow.mjs`
- Registration from `scripts/anime5e.mjs`

## Behaviour

When an item is created on an actor:

- Species items update the actor race field and store the applied item UUID.
- Size template items update the actor size template field.
- Class items update the first empty class slot with name, level, and hit die.

The workflow also refreshes the point ledger and validation notes after owned item create, update, and delete events.

## Next

Add explicit sheet controls for starting level, starting XP, recommended discretionary points, and preview-before-apply for Species and Class items.
