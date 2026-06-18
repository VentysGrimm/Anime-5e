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
- `module/sheets/` contains v14 sheet classes registered through `DocumentSheetConfig`.
- `templates/` contains editable Handlebars sheets.
- `styles/anime5e.css` contains system sheet styles.
- `tools/validate-package.mjs` performs a lightweight local sanity check.

## Validation

Run this with Node:

```bash
node tools/validate-package.mjs
node --check scripts/anime5e.mjs
```
