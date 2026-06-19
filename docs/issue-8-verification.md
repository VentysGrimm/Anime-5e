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
- Source-backed compendium import from foldered JSON into declared Item packs.

## Partially Defined Or Deferred

- Dynamic Powers automation, including generated effects, Energy Point spending, and roll hooks.
- Combat Techniques automation beyond source-backed item documents.
- Damage application, critical hit margins, conditions, and recovery automation.
- Full equipment automation for weapons, armor, shields, vehicles, mecha, mounts, and Items of Power.
- Monster variant import and NPC stat-block parsing from the monster/adventure books.
- Reputation, faction/path restrictions, law/consequence tracking, and quest/task generation hooks. These are not part of the clearly defined core package pass yet.
- A visible GM compendium import workflow. The importer exists as `game.anime5e.importCoreCompendiumData()`, but a future pass should expose it without requiring console use.

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
- Characters can roll ability checks, proficient checks, saving throws, proficient saves, initiative, and attacks from the sheet.
- Source-backed starter content can be imported into compendiums by a GM through the runtime importer.

## Recommended Next Builds

1. Add a visible GM-facing compendium import dialog or settings action.
2. Add damage rolls and damage application to the combat panel.
3. Add item-specific roll/use actions for weapons, Attributes, Defects, powers, techniques, and spells.
4. Continue source-backed imports for equipment, powers, techniques, monsters, mounts, mecha, and spell conversions.
5. Add focused runtime smoke tests once a Foundry v14 test harness or manual launch target is available.

## Missing Files Required For Load

No required manifest, script, style, language, template, or data-model file is missing in the current package structure. The local `source-material/` tree is not required for Foundry to load the system and should remain unpublished.
