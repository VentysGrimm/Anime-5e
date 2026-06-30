# Supplemental Source Conventions

Supplemental content must stay outside `data/sources/core/`. Use this layout:

```text
data/sources/supplements/<category>/<book-or-slice>.json
```

Use these generated packs unless a later slice deliberately creates a dedicated module:

| Source category | Pack |
| --- | --- |
| Species, classes, backgrounds, lifepaths, proficiencies, powers, spells, techniques | `anime5e.supplemental-character-options` |
| Equipment, weapons, armour, shields, materials, vehicles, mecha, Items of Power | `anime5e.supplemental-items` |
| Monsters, NPCs, neomorphs, mounts, companions, threats | `anime5e.supplemental-creatures` |
| Settings, adventures, source guides, conversion notes, GM/player references | `anime5e.supplemental-journals` |

Every supplemental source entry must include:

- `system.source` or `flags.anime5e.source.book` using the exact source title.
- `sourcePage` or `flags.anime5e.source.page` using PDF viewer page numbers.
- `sourceId` and `importId` with identical values.

Use this source ID shape:

```text
<supplement-key>.<category>.<slug>
```

Examples:

- `bonus-character-options.class.mindmancer`
- `hybrid-species.species.asrai-dawn-elf-hybrid`
- `adventuring-accessories.item.arcane-lodestone`
- `mounts-and-monsters.creature.phase-griffon`
- `monstrum-libri-vol1.creature.bolegom`
- `folstavia.journal.infinite-crossroads`
- `beyonder-worlds.item.pulse-rifle`

When a source belongs to a later standalone Foundry module, keep its JSON under `data/sources/supplements/` until that module has its own manifest/import path. Do not add local PDFs, extracted caches, art, maps, or sound files to release artifacts unless a later issue explicitly scopes them in.
