# Actor Data Strategy

Issue: https://github.com/VentysGrimm/Anime-5e/issues/3

The character Folio sheet separates actor-owned facts from mechanical entries that should remain Items.

## Actor System Data

Actor data is reserved for values that belong to the actor even when no owned Item exists:

- Identity and campaign bookkeeping: alias, player name, race/species text, size template text, alignment, campaign title, GM, creation/retirement dates, and character role.
- Character progression summary: level, experience, and class summary rows for quick sheet editing.
- Point bookkeeping inputs and derived summary: starting Discretionary Points, Engagement Bonus Points, other non-levelling points, manual spent points, refunded points, Ability Score cost, total spent, available points, remaining points, and optional total points.
- Core ability/resource state: ability scores and modifiers, Hit Points, Energy Points, Armour Class, movement speed, proficiency bonus, initiative, and quick attack rows.
- Folio notes: overview, combat, attributes, defects, skills, powers, inventory, companions, biography, and journal notes.
- Rich text summaries: biography and linked stat block notes for non-character actors or companion-style records.

These fields live in `module/documents/actor-data.mjs` because they are actor state, not reusable source documents.

## Owned Items

Reusable mechanical entries should be owned Items whenever practical. The actor sheet groups owned Items both by exact item type and by Folio section.

Use Items for:

- Character options: species, class, background, size template, lifepath, features, and traits.
- Character mechanics: Attributes, Defects, Enhancements, Limiters, powers, spells, techniques, skills, proficiencies, tools, and languages.
- Equipment: weapons, armour, shields, equipment, loot, materials, Item Attributes, Items of Power, mounts, vehicles, and mecha.
- Future GM-facing data: monster variants, mount stat blocks, vehicle records, and other source-backed entries.

This keeps source-backed compendium entries reusable, draggable, and editable without duplicating the same mechanics directly onto every actor.

## Sheet Context

`Anime5eActorSheet._prepareContext()` exposes:

- `items`: every owned Item prepared for display and sheet controls.
- `itemGroups.byType`: exact groups for every declared Anime 5E item type.
- Folio groups such as `itemGroups.characterOptions`, `itemGroups.combat`, `itemGroups.attributes`, `itemGroups.inventory`, and `itemGroups.companions`.

The template can render exact type groups for future detailed sections while keeping broad Folio sections usable now.

The point summary also folds owned Items into the displayed totals:

- Attribute points are calculated from owned Attribute rank multiplied by per-rank cost.
- Defect refunds are calculated from owned Defect rank multiplied by per-rank points returned.
- Species points are calculated from owned Species point cost.
- Class points use optional owned Class cost/base/level point fields when present.
- These owned-item totals are displayed separately from manual point adjustments so later automation can replace or refine individual sources without changing the player-facing summary shape.

## Deferred Automation

Full application/removal automation is intentionally deferred for focused slices. Species traits, class progression, Attribute effects, Defect refunds, item construction, Dynamic Powers, and vehicle/mecha automation should use owned Item data as inputs and write only derived summaries or actor-owned state that must persist on the actor.
