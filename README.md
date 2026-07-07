# Anime 5e Foundry VTT System

This is a starter game system for Foundry Virtual Tabletop v14.

## Local Development

For Foundry to load this system during development, place or symlink this folder at:

```text
FoundryVTT/Data/systems/anime5e
```

Then create a world using the `Anime 5e` game system.

## Project Shape

- `system.json` is the Foundry package manifest.
- Actor and Item subtypes are declared in `system.json` under `documentTypes`; Foundry v14 does not use a root `template.json`.
- `scripts/anime5e.mjs` is the runtime entry point.
- `module/documents/` contains v14 `TypeDataModel` classes for Actor and Item subtypes.
- `module/data/compendiums.mjs` imports starter compendium data into declared packs.
- `module/sheets/` contains v14 sheet classes registered through `DocumentSheetConfig`.
- `data/sources/core/` contains foldered Core Rules source JSON for compendium seeding.
- `data/sources/supplements/` contains separated supplement source JSON for non-core books and import-test entries.
- `templates/` contains editable Handlebars sheets.
- `styles/anime5e.css` contains system sheet styles.
- `packs/` is a tracked shell for Foundry compendium databases created at runtime.
- `tools/validate-package.mjs` performs a lightweight local sanity check.
- `tools/validate-content-module.mjs` validates standalone Anime 5e content modules created from `module-template/`.
- `tools/validate-regression-fixtures.mjs` checks source-backed regression fixtures, pregenerated character stats, actor attacks, and standalone module source validity.
- `module-template/` contains a reusable Foundry module scaffold for source-backed Anime 5e expansions.
- `modules/` contains source-backed standalone expansion modules that can be installed separately from the base system.
- `docs/issue-8-verification.md` records the first-pass source review and playable-system verification scope.
- `docs/actor-data-strategy.md` records the Character Folio actor-vs-owned-Item data strategy.
- `docs/content-scope.md` defines base-system and supplemental-module content boundaries.
- `docs/module-creation-workflow.md` explains how to create and validate standalone content modules.
- `docs/foundry-v14-smoke-checklist.md` records the manual runtime checks needed before closing Foundry-load verification work.

## Guides

- `docs/player-guide.md` explains how to create and maintain a Character actor using the Character Folio, point summary, owned Items, combat rows, and level-up notes.
- `docs/gm-guide.md` covers world setup, actor types, monsters, encounter helpers, modules, compendiums, and table-facing settings.
- `docs/content-entry-guide.md` documents source metadata, naming, compendium organization, and module content-entry rules.
- `docs/release-checklist.md` lists the local validators, Foundry smoke checks, compendium checks, sample character validation, module compatibility checks, and release gates.

## Compendium Packs

The manifest declares Item compendium packs under `packs/`, but the LevelDB pack
directories are not committed beyond the tracked `packs/.gitkeep` shell. A GM
creates or updates those packs in Foundry via the **Anime 5e Core Compendiums**
settings menu, which imports the source-backed JSON from `data/sources/core/`
and `data/sources/supplements/`.

`tools/validate-package.mjs` checks every declared pack path. A missing physical
pack directory is accepted only when the pack has a matching source manifest in
`data/core-compendiums.json`; otherwise validation fails with the missing path.

Supplement source naming and folder conventions are documented in
`docs/supplemental-source-conventions.md`. Broader base-system and optional
module boundaries are documented in `docs/content-scope.md`.

New standalone expansion modules should start from `module-template/` and be
checked with `node tools\validate-content-module.mjs <module-root>`.

Current standalone module packages:

- `modules/anime5e-hybrid-species`
- `modules/anime5e-bonus-character-options`
- `modules/anime5e-adventuring-accessories`
- `modules/anime5e-game-screen-adventure`
- `modules/anime5e-mounts-and-monsters`
- `modules/anime5e-monstrum-libri-vol1`
- `modules/anime5e-monstrum-libri-vol2`
- `modules/anime5e-folstavia`
- `modules/anime5e-beyonder-worlds`

