# Anime 5e GM Guide

This guide covers the table-facing tools for running Anime 5e in Foundry v14.

## Start A World

1. Install or symlink this repository as `FoundryVTT/Data/systems/anime5e`.
2. Create a world using the `Anime 5e` system.
3. Open Settings and use Anime 5e Source Compendiums to import or update the source-backed packs.
4. Open representative packs from the Compendium sidebar to confirm Items, Actors, and Journals are available.
5. Keep the browser console open during the first world load and record any package-load errors in the relevant issue.

## Actor Types

Use `Character` for player characters. The Character Folio has point accounting, creation controls, species and size workflows, class summaries, advancement notes, and detailed owned-Item groupings.

Use the basic actor sheet for:

- `NPC`: named allies, rivals, pregenerated characters, and adventure NPCs.
- `Monster`: hostile or neutral creature stat blocks.
- `Companion`: pets, summons, cohorts, and helper creatures.
- `Item Construct`: built or animated objects with actor-like statistics.
- `Vehicle`: vehicles that need actor state, crew, cargo, linked actors, or combat values.
- `Mecha`: mecha with actor state, pilots, build points, cargo, and combat values.

Basic actors expose ability checks, quick rolls, saves, combat resources, movement modes, common attacks, damage rolls, source metadata, challenge summaries, and point summaries where relevant.

## Monsters And Encounters

For source-backed monsters, import the creature compendiums first and drag entries into the world when they need local edits. Core monsters, neomorphs, Mounts & Monsters, Monstrum Libri, Folstavia, and Beyonder Worlds entries carry source IDs and page references so the GM can jump back to the book for full text.

When creating a monster manually:

1. Create an Actor with type `Monster`.
2. Enter level, Challenge Rating, XP, total points, source book, source page, source abbreviation, and source category.
3. Fill ability scores, Armour Class, Hit Points, Energy, movement modes, proficiency, initiative, defense summary, offense summary, and common attacks.
4. Use attack and damage buttons to verify the combat rows before the session.
5. Put long source text in the book, not the actor. Use short original summaries and page references in Foundry.

The GM-only Anime 5e Encounter Threat settings menu opens a manual Challenge Rating and threat comparison tool. Enter party size, party level, creature CR, creature count, and any threat or XP overrides, then use the result as encounter guidance.

## Optional Rules And World Settings

Anime 5e registers these world settings:

- Energy Usage Mode: `Tracked`, `Manual`, or `Disabled`.
- Apply Range Penalties: subtract configured range penalties from common attack rolls.
- Apply Wound Pressure Penalties: apply disadvantage to d20 rolls when an actor is at one-quarter maximum HP or lower.
- Show Margin of Success: show the difference between attack totals and target Armour Class.
- Show Critical Roll Notes: annotate attack rolls that keep natural 20 or natural 1 results.
- Show Critical Roll Notes also checks attack margins against the Core Rules critical hit/failure thresholds. Extreme success doubles final damage, outrageous success triples it, extreme failure suggests one Table 22 consequence, and outrageous failure suggests two. Treat the Table 22 rolls as prompts; the Core Rules still allow the GM to choose a better-fitting consequence.

Common attack rows include a cover selector. Half cover adds +2 to the target Armour Class, three-quarters cover adds +5, and total cover adds a chat-card reminder that most direct attacks cannot target the creature.

Use Tracked Energy when the table wants the sheet to spend and restore Energy directly. Use Manual when Energy is a chat note or table decision. Use Disabled when the campaign does not use Energy bookkeeping.

The Rest & Recovery panel automates the Core Rules recovery loop: short rests can spend available Hit Dice for HP, roll 1d8 Energy recovery when Energy is enabled, and post the result to chat; long rests restore HP, restore Energy when enabled, and regain spent Hit Dice up to half the actor's total. The wound-pressure status line shows the one-quarter-HP threshold even when the optional penalty setting is off.

The Dynamic Power Expression panel appears when an actor owns Dynamic Powers or Dynamic Powers - Lesser. Select the owned power, choose the relevant ability, enter the approved effect Rank and Energy cost, then roll the check or post the expression to chat. In Tracked Energy mode, the posted expression spends the entered Energy and records the expression on the owned Item for repeat-effect review.

The Combat Manoeuvres controls on actor sheets cover the Core Rules optional manoeuvres from the action chapter. They can post the manoeuvre reference to chat or roll a selected common attack with the manoeuvre's advantage/disadvantage guidance. Apply DM-facing rulings such as target AC changes, knock-out saves, Weak Point size, and damage adjustment before final damage is resolved.

## Modules

Standalone Anime 5e expansion modules live under `modules/` in this repository and can be installed separately as Foundry modules. Current modules cover Hybrid Species, Bonus Character Options, Adventuring Accessories, Game Screen Adventure, Mounts & Monsters, Monstrum Libri Vol. 1, Monstrum Libri Vol. 2, Folstavia, and Beyonder Worlds.

For each enabled module:

1. Confirm the module depends on the Anime 5e system.
2. Enable only the modules needed for the campaign.
3. Open the module-owned packs and confirm they match the source title.
4. Import or open a representative Species/Class, Item, Actor, and Journal entry.
5. Disable the module in a test world, reload, and confirm the base system still loads without missing-pack or missing-document console errors.

## Compendium Maintenance

The system keeps source JSON under `data/sources/` and imports it into Foundry packs through the settings menu. Do not hand-edit generated LevelDB pack contents as the source of truth. Update the JSON source entry, run validators, then import/update in Foundry.

Core content belongs in core packs. Optional book content belongs in supplemental packs or standalone modules. Keep source IDs stable so actors and compendium entries can be refreshed without breaking references.

## Session Prep Checklist

- Import or refresh compendiums after pulling new source changes.
- Open every pack you expect to use that session.
- Confirm PCs have no unresolved point warnings unless the ruling is documented.
- Roll one PC attack, one monster attack, one ability check, one save, and one Item action.
- Confirm Energy mode, wound-pressure handling, rest recovery, and combat roll settings match the campaign.
- Record any console errors, broken source references, or missing pack entries before updating release issues.
