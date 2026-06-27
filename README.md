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
- `data/sources/core/` contains foldered source JSON for compendium seeding.
- `templates/` contains editable Handlebars sheets.
- `styles/anime5e.css` contains system sheet styles.
- `tools/validate-package.mjs` performs a lightweight local sanity check.
- `docs/issue-8-verification.md` records the first-pass source review and playable-system verification scope.

## Compendium Packs

The manifest declares Item compendium packs under `packs/`, but the LevelDB pack
directories are not committed. A GM creates or updates those packs in Foundry via
the **Anime 5e Core Compendiums** settings menu, which imports the source-backed
JSON from `data/sources/core/`.

`tools/validate-package.mjs` checks every declared pack path. A missing physical
pack directory is accepted only when the pack has a matching source manifest in
`data/core-compendiums.json`; otherwise validation fails with the missing path.

