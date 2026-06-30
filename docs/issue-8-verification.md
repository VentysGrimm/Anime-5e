# Issue #8 Verification Summary

Issue: https://github.com/VentysGrimm/Anime-5e/issues/8

## Sources Reviewed

- `source-material/.cache/text/anime-5e-fifth-edition-core-rules.txt`
  - Core d20 resolution, ability checks, skill checks, saving throws, initiative, attack rolls, hit points, Energy Points, level advancement, species, classes, Attributes, Defects, equipment, and combat structure.
- `source-material/.cache/text/anime-5e-character-folio.txt`
  - Character Folio layout expectations for abilities, resources, Attributes, Defects, skills, powers, inventory, companions, biography, and journal pages.
- `source-material/.cache/text/anime-5e-bonus-character-options-digital-expansion.txt`
- `source-material/.cache/text/anime5e-beyonder-worlds-v1-0.txt`
- `source-material/.cache/text/anime5e-folstavia-v1-0.txt`
- `source-material/.cache/text/dys-anime5e-hybrid-species-v1-0-1.txt`
  - Additional source-backed class and species options already represented in `data/sources/core/character-options/`.
- `data/sources/core/attributes/index.json`
- `data/sources/core/defects/index.json`
- `data/sources/core/character-options/*.json`
  - Current source-backed compendium payloads.
- `system.json`, `scripts/anime5e.mjs`, `module/documents/*.mjs`, `module/sheets/*.mjs`, `templates/*.hbs`, and `styles/anime5e.css`
  - Current Foundry VTT v14 runtime shape.

The source-material directory is intentionally ignored for GitHub publishing; the committed system references source metadata in generated JSON without publishing the local PDFs or text cache.

## Clearly Defined Enough To Build

- Foundry VTT v14 package manifest and runtime entry point.
- Actor types: character, companion, mecha, monster, npc, and vehicle.
- Item types for Anime 5E character options, Attributes, Defects, powers, techniques, equipment, spells, weapons, armor, shields, species, classes, and related source-backed documents.
- Character Folio actor sheet sections for identity, abilities, resources, classes, combat, Attributes, Defects, skills, powers, inventory, companions, biography, and notes.
- Basic non-character actor sheet registration through the Anime 5e basic actor sheet.
- Core d20 roll formulas:
  - Ability check: d20 plus relevant ability modifier.
  - Skill/proficient check: d20 plus relevant ability modifier plus proficiency bonus.
  - Saving throw: d20 plus relevant ability modifier, with a proficient save option that adds proficiency bonus.
  - Initiative: d20 plus initiative modifier.
  - Attack roll: d20 plus the configured attack modifier, with quick-roll options for proficient and non-proficient ability-based attacks.
- Source-backed Core Rules skill and proficiency items:
  - Table 13 skills are imported with their associated abilities.
  - Saving throw, armour, weapon, tool, and language proficiency records are carried as character-option Items.
- Source-backed compendium import from foldered JSON into declared Item packs.

## Partially Defined Or Deferred

- Dynamic Powers automation, including generated effects, Energy Point spending, and roll hooks.
- Combat Techniques automation beyond source-backed item documents.
- Critical hit margins, conditions, and recovery automation.
- Full equipment automation for weapons, armor, shields, vehicles, mecha, mounts, and Items of Power.
- Monster variant import and NPC stat-block parsing from the monster/adventure books.
- Reputation, faction/path restrictions, law/consequence tracking, and quest/task generation hooks. These are not part of the clearly defined core package pass yet.
- Dynamic Powers automation, Combat Techniques automation, conditions, recovery automation, and deeper item-specific automation remain the next mechanical gaps after the first item use/roll pass.

## Foundry VTT v14 Compatibility Notes

- `system.json` declares `compatibility.minimum` and `compatibility.verified` as Foundry v14.
- Actor and Item subtypes are declared under `documentTypes`; this project does not use a root `template.json`.
- Actor and Item data models use `foundry.abstract.TypeDataModel`.
- Sheets use Foundry v14 application classes and are registered through `DocumentSheetConfig`.
- The system entry point is listed in `esmodules`.
- The package currently validates locally with `tools/validate-package.mjs` plus module syntax checks. A manual Foundry v14 launch remains the final runtime smoke test when the app is available.

## First-Pass Playability Status

- Foundry can discover the system from `system.json`.
- A world can be created with the Anime 5e system once the folder is installed at `Data/systems/anime5e`.
- Character actors can be created and opened with the Character Folio sheet.
- Companion, mecha, monster, NPC, and vehicle actors can be created and opened with the basic Anime 5e actor sheet.
- Items can be created and opened with the generic Anime 5e item sheet.
- Core character data is visible and editable.
- Characters can roll ability checks, proficient checks, saving throws, proficient saves, initiative, attacks, and attack damage from the sheet.
- Characters can apply damage or healing to their own Hit Points from the combat panel.
- Temporary Hit Points are tracked separately and absorb incoming damage before current Hit Points are reduced.
- Combat movement now tracks ground, fly, water/swim, climb, burrow, and custom movement entries alongside derived Attribute movement summaries.
- Common attack rows track attack type, range, d20 mode, target Armour Class, optional range penalty, damage type, and damage formula.
- Optional combat settings control range-penalty application, Margin of Success display, and critical roll annotations.
- Characters can use/share embedded items to chat, roll item formulas when present, make item attack rolls, and roll item damage for weapons or other items with damage formulas.
- Item sheets expose the same use, formula roll, attack, and damage actions for weapons, Attributes, Defects, powers, techniques, spells, and other item documents.
- Source-backed starter content can be imported into compendiums by a GM through the Configure Settings menu or the runtime importer.

## Recommended Next Builds

1. Continue source-backed imports for equipment, powers, techniques, monsters, mounts, mecha, and spell conversions.
2. Expand item automation for Dynamic Powers, Techniques, spells, equipment, and Items of Power as their source-backed fields are modeled.
3. Add focused runtime smoke tests once a Foundry v14 test harness or manual launch target is available.

## Implemented Follow-Ups

- A GM-only **Anime 5e Core Compendiums** settings menu opens a Foundry v14 `DialogV2` for importing or updating source-backed starter content without using the console.
- The package validator now asserts Slice 16 Core Rules compendium coverage: required core categories are present in source-backed packs, and Core Rules entries carry source book/page metadata through item/actor system data or Anime 5e source flags.
- Standalone module packages now exist for Hybrid Species and Bonus Character Options under `modules/`, using the base system data model, module-owned source manifests, and source-tagged compendium documents.
- The combat panel can roll entered attack damage formulas and apply damage or healing to the actor's current Hit Points, including negative HP tracking down to the mortal-wound threshold.
- Actor item rows and item sheets now expose item use/share, formula roll, attack roll, and damage roll actions. This gives weapons, Attributes, Defects, powers, techniques, spells, and other source-backed item documents a direct play action while preserving later deeper automation work.
- Core equipment documents now include weapons, armour, shields, item-only Attributes, named adventuring gear, daily devices, Items of Power, protective devices, and armaments. Weapons, armour, and shields support an equipped state; the character combat tab computes an effective AC summary from equipped armour/shields and exposes equipped weapons for attack and damage rolls.
- Weapon item sheets now expose proficiency requirement, range rank, ammo, charges, Enhancements, Limiters, equipped state, attack, and damage fields. Armour and shield sheets expose proficiency requirements and equipped AC fields.
- Items of Power now expose contained Attribute/Defect bookkeeping fields and a calculated construction point summary.
- Monster, NPC, and companion basic actor sheets now expose source-backed challenge, XP, movement, combat, and point summaries; they can roll ability checks, quick checks, contests, saving throws, skill items, common attacks, and damage. The Encounter Threat settings dialog now compares party and encounter threat with manual threat and XP budget overrides.
- Energy now supports tracked, manual, and disabled world modes. Actor sheets expose Energy mode/status and controls where applicable; Attribute use honours the mode. Dynamic Powers and Spell items now carry helper fields for ability checks, Energy costs, repeated effects, activation limits, spell casting metadata, saves, attacks, psionics notes, and manual flexible-power tracking.
- Companion, Minions, mount, vehicle, mecha, and monster-variant workflows now support persistent linked actor UUIDs. Character sheets display linked actor summaries, can open linked actors, and can create linked companion/vehicle/mecha actors from owned Attributes or Items while preserving pilot, owner, occupant, source, and point metadata.

## Missing Files Required For Load

No required manifest, script, style, language, template, or data-model file is missing in the current package structure. The local `source-material/` tree is not required for Foundry to load the system and should remain unpublished.
