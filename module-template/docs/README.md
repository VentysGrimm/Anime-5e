# Anime 5e Content Module Template

This template is a starting point for source-backed Anime 5e expansion modules.

Before publishing a derived module:

- Replace `anime5e-example-expansion`, labels, author data, and source tags in `module.json`.
- Keep the Anime 5e dependency under `relationships.systems`.
- Put source-backed content JSON under `data/sources/`.
- Keep generated Foundry pack databases under `packs/`.
- Run `node tools/validate-content-module.mjs <module-root>` from the base system repo.
