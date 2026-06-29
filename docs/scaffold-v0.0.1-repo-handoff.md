# Scaffold v0.0.1 Repository Handoff

The Anime 5e Foundry VTT system work is now being handled in the repository instead of as a downloadable ZIP artifact.

## Repository target

- Repository: `VentysGrimm/Anime-5e`
- Default branch: `main`
- Foundry system manifest: `system.json`
- Runtime entry point: `scripts/anime5e.mjs`

## Current direction

The repository is the source of truth for continued development. Future work should be committed directly to the repo rather than packaged as a ZIP unless an installable release artifact is explicitly requested.

## Next implementation area

Continue with the character creation workflow:

1. Starting level and XP thresholds
2. Discretionary point budgets
3. Ability score point tracking
4. Species/Race attachment and point application
5. Class level attachment and derived values
6. Attribute/Defect point validation
7. Final character summary and validation warnings
