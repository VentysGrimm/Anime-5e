# Supplemental Source Conventions

Supplemental content must stay outside `data/sources/core/`. Use this layout:

```text
data/sources/supplements/<category>/<book-or-slice>.json
```

Use these generated packs unless a later slice deliberately creates a dedicated module:

| Source category | Pack |
| --- | --- |
| Species, classes, Attributes, Defects, backgrounds, lifepaths, proficiencies, powers, spells, techniques | `anime5e.supplemental-character-options` |
| Equipment, weapons, armour, shields, materials, vehicles, mecha, mounts, Items of Power | `anime5e.supplemental-items` |
| Monsters, NPCs, neomorphs, companions, threats | `anime5e.supplemental-creatures` |
| Settings, adventures, source guides, conversion notes, GM/player references | `anime5e.supplemental-journals` |

Every supplemental source entry must include:

- `system.source` or `flags.anime5e.source.book` using the exact source title.
- `sourcePage` or `flags.anime5e.source.page` using PDF viewer page numbers.
- `sourceAbbreviation` or `flags.anime5e.source.abbreviation`.
- `sourceModuleId` or `flags.anime5e.source.moduleId`.
- `sourceCategory` or `flags.anime5e.source.category`.
- `sourceId` and `importId` with identical values.
- `rank` and `cost` for Item documents.

Use this source ID shape:

```text
<supplement-key>.<category>.<slug>
```

Examples:

- `bonus-character-options.class.mindmancer`
- `hybrid-species.species.asrai-dawn-elf-hybrid`
- `folstavia.species.arbolan`
- `folstavia.class.martialist`
- `folstavia.journal.infinite-crossroads-overview`
- `beyonder-worlds.item.v-tab`
- `beyonder-worlds.mecha.marstar-armour`
- `beyonder-worlds.journal.science-fiction`
- `adventuring-accessories.item.arcane-lodestone`
- `mounts-and-monsters.mount.fae-war-corgi`
- `monstrum-libri-vol1.creature.adlet`
- `monstrum-libri-vol2.creature.axolotilte`

When a source belongs to a later standalone Foundry module, keep its JSON under `data/sources/supplements/` until that module has its own manifest/import path. Do not add local PDFs, extracted caches, art, maps, or sound files to release artifacts unless a later issue explicitly scopes them in.

Standalone module creation is documented in `docs/module-creation-workflow.md`; `module-template/` contains a reusable starting manifest, pack layout, source manifest, and example entry.
