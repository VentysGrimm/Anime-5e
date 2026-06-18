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
- `scripts/anime5e.mjs` is the runtime entry point.
- `module/documents/` contains v14 `TypeDataModel` classes for Actor and Item subtypes.
- `module/data/compendiums.mjs` imports starter compendium data into declared packs.
- `module/sheets/` contains v14 sheet classes registered through `DocumentSheetConfig`.
- `data/sources/core/` contains foldered source JSON for compendium seeding.
- `templates/` contains editable Handlebars sheets.
- `styles/anime5e.css` contains system sheet styles.
- `tools/validate-package.mjs` performs a lightweight local sanity check.

## Core Compendium Import

After launching a world as GM, run this in the Foundry console:

```js
await game.anime5e.importCoreCompendiumData();
```

The importer uses Foundry's v14 document APIs to create compendium folders and write documents into the declared packs.

## Validation

Run this with Node:

```bash
node tools/validate-package.mjs
node --check scripts/anime5e.mjs
```
