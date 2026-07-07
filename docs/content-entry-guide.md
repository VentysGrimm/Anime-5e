# Anime 5e Content Entry Guide

Use this guide when adding source-backed Anime 5e content to the base system or an expansion module.

## Source Of Truth

Source JSON is the editable truth. Foundry packs are generated or updated from source JSON and should not be treated as the canonical data store.

Use these locations:

- Core Rules content: `data/sources/core/`.
- Staged supplement content: `data/sources/supplements/<category>/`.
- Standalone module content: `modules/<module-id>/data/sources/`.
- Standalone module source manifest: `modules/<module-id>/data/source-manifest.json`.

Use PDF viewer page numbers when page numbers are required. If printed page numbers differ from the viewer, record the viewer page.

## Naming

Use the source's display name for the Foundry document name unless duplicate names would be confusing. When duplicates exist across books, add the source or variant in parentheses, for example `Gnome (Folstavia)` or `Dragon Warrior (Beyonder Worlds)`.

Use lowercase, dot-separated source IDs:

```text
<source-key>.<category>.<slug>
```

Examples:

- `core.attribute.ac-bonus`
- `core.class.adventurer`
- `folstavia.species.arbolan`
- `beyonder-worlds.item.v-tab`
- `mounts-and-monsters.mount.fae-war-corgi`
- `monstrum-libri-vol1.creature.adlet`

Set `importId` to the same value as `sourceId` unless a migration explicitly documents why it differs.

## Item Metadata

Every Item source entry needs enough metadata for validation and later refreshes:

```json
{
  "name": "Example Attribute",
  "type": "attribute",
  "system": {
    "source": "Anime 5E Example Source",
    "sourcePage": 12,
    "sourceAbbreviation": "EX",
    "sourceModuleId": "anime5e-example",
    "sourceCategory": "attribute",
    "sourceId": "example.attribute.example-attribute",
    "importId": "example.attribute.example-attribute",
    "rank": 1,
    "cost": 1
  }
}
```

Use the most specific Item type declared in `system.json`. For point-bearing Items, fill `rank`, `cost`, `points`, or `pointsReturned` as appropriate for that type. For weapons, armour, shields, powers, spells, techniques, and item Attributes, enter action fields such as attack, damage, Energy cost, range, save, effect, or repeated-effect notes when the source provides them.

## Actor Metadata

Actor entries should carry source metadata under `system.source` and stable IDs under source flags when available. At minimum, include book, page, abbreviation, module ID, category, source ID, and import ID.

For combat-ready actors, fill:

- Ability scores.
- Armour Class, Hit Points, Energy, movement modes, proficiency, and initiative.
- Challenge Rating, XP, total points, defense summary, and offense summary.
- Common attack rows with modifier, type, range, damage type, and damage formula.
- Short original summaries plus page references, not long reproduced source text.

Use actor types consistently: `monster` for creatures, `npc` for named people and pregens, `companion` for companion-style creatures, `vehicle` for vehicles, and `mecha` for mecha.

## Journal Metadata

Use Journal entries for setting summaries, adventures, GM/player reference material, and source guides. Journal entries should carry `flags.anime5e.source` with book, page, abbreviation, module ID, category, source ID, and import ID.

Keep Journal text concise. Prefer original summaries, structured bullets, table-facing reminders, and page references. Do not paste long book passages into source JSON.

## Compendium Organization

Base-system packs are declared in `system.json`:

- Character options: Species, size templates, classes, backgrounds, lifepaths, traits, proficiencies, skills, tools, languages, and features.
- Attributes, Defects, Enhancements, Limiters, Powers, Techniques, and Equipment each have their own core packs where applicable.
- Creatures are split across monsters, NPCs, and neomorphs.
- Rules reference Journals live in the rules-reference pack.
- Optional content imports into supplemental character options, supplemental items, supplemental creatures, and supplemental journals unless it has moved into a standalone module.

Standalone modules should use module-owned packs such as:

```text
<module-id>.character-options
<module-id>.items
<module-id>.creatures
<module-id>.journals
```

## Module Workflow

1. Start from `module-template/` or an existing module with the same shape.
2. Update `module.json`, language labels, source manifest, source JSON files, and module script.
3. Keep the Anime 5e system dependency in `relationships.systems`.
4. Keep local source PDFs, extraction caches, scratch files, and temporary helper output out of release artifacts unless explicitly scoped.
5. Validate the module from the base repo:

```powershell
node tools\validate-content-module.mjs modules\<module-id>
```

6. Run the base package validator after changing shared source data:

```powershell
node tools\validate-package.mjs
```

7. Run regression fixtures when actors, pregens, modules, attacks, or validation rules change:

```powershell
node tools\validate-regression-fixtures.mjs
```

## Review Before Commit

- Source IDs are stable, unique, lowercase, and category-aware.
- `sourceId` and `importId` match.
- Source book names and abbreviations are consistent within the file.
- PDF viewer page numbers are filled where available.
- Item rank/cost/point fields are present for point-bearing entries.
- Actor attack rows can roll when the entry is intended to be combat-ready.
- Journals and descriptions summarize rather than reproduce long source text.
- The relevant validator passes.
