# Anime 5e Content Scope

This repository is the Anime 5E base system for Foundry VTT v14. Content must stay source-tagged and separated so the Core Rules remain usable without requiring optional setting or supplement books.

## Base System Scope

The base system owns:

- Foundry package metadata in `system.json`.
- Runtime registration, document data models, sheet classes, and import helpers under `scripts/` and `module/`.
- Shared templates, styles, localization, validation tools, and contributor docs.
- Core Rules compendium source data under `data/sources/core/`.
- Character Folio sheet structure and character-creation support that belongs to the system itself rather than to a specific supplement.

Core Rules entries should import only into core packs such as `anime5e.character-options`, `anime5e.attributes`, `anime5e.defects`, `anime5e.enhancements`, `anime5e.limiters`, `anime5e.equipment`, `anime5e.monsters`, `anime5e.npcs`, `anime5e.neomorphs`, and `anime5e.rules-reference`.

## Supplemental Module Scope

Optional books and setting lines should not be mixed into the core source tree. Until standalone Foundry modules exist, their source JSON lives under `data/sources/supplements/` and imports only into supplemental packs.

| Source | Intended module scope |
| --- | --- |
| Folstavia | Setting lore, Folstavia species, classes, Attributes, equipment, vehicles, monsters, allies, enemies, NPCs, factions, and regions. |
| Hybrid Species | Hybrid-species rules guidance and example hybrid Species entries. |
| Bonus Character Options | Bonus Species, Classes, Attributes, Defects, powers, proficiencies, or related character options. |
| Adventuring Accessories | Artefacts, magical accessories, Items of Power, mecha, vehicles, and related construction notes. |
| Mounts & Monsters | Mounts, companion-style creatures, monsters, attacks, movement modes, CR, and XP entries. |
| Game Screen Adventure | Carry on Wayward Son adventure journals, pregenerated characters, NPCs, encounters, and permitted scenes or maps. |
| Monstrum Libri Vol. 1 | Woodland and mountain creatures plus any creature-specific traits needed to run them. |
| Monstrum Libri Vol. 2 | Aquatic and desertic creatures plus any aquatic, desert, movement, or hazard traits needed to run them. |
| Beyonder Worlds | Genre support for science fiction, mecha fantasy, urban fantasy, cyberpunk, and modern Earth, including equipment, vehicles, mecha, threats, and genre notes. |

When a standalone module is created, move its source data out of `data/sources/supplements/` into that module's own source manifest and keep the same source IDs where possible.

## Source Tagging

Every source-backed entry must identify:

- Source book or product title.
- PDF viewer page number when available.
- Module or source abbreviation.
- Module id when the content lives in or is staged for a standalone Foundry module.
- Content category such as species, class, attribute, defect, item, creature, journal, adventure, or setting.
- Stable source ID and import ID.

Use the source-ID pattern documented in `docs/supplemental-source-conventions.md`:

```text
<supplement-key>.<category>.<slug>
```

Core entries use the same principle but stay under the Core Rules source manifests.

Standalone module setup and validation are documented in `docs/module-creation-workflow.md`.

## Text Policy

Foundry entries may include mechanics summaries, structured rules data, page references, and short table-facing notes needed to identify or run the entry. Do not copy long copyrighted descriptive passages from source books into JSON, Journals, or docs unless a later issue explicitly establishes permission and scope.

Prefer:

- Structured mechanics, costs, ranks, dice, tags, and references.
- Short summaries in original wording.
- Page citations that point the GM to the full source text.

Avoid:

- Full reproduced lore sections.
- Long verbatim item, monster, spell, or adventure descriptions.
- Bulk text copied from PDFs or extracted caches.

## Boundary Rules

Expansion content may exist in this repository as staged source data while module infrastructure is still being built, but it must remain separate from `data/sources/core/` and core pack IDs. Base-system code can support all content types; base-system compendiums should remain Core Rules focused.
