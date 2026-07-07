# Anime 5e Release Checklist

Use this checklist before tagging or publishing a release.

## Scope

- Confirm the target version and release notes scope.
- Confirm `system.json` version, compatibility, manifest URL, and download URL.
- Confirm standalone module versions and manifests when module packages are included in the release.
- Confirm local-only paths such as `source-material/`, `.cache/`, `tmp/`, `temp/`, and extraction helpers are not included in release artifacts.

## Local Validation

Run these from the repository root:

```powershell
node tools\validate-package.mjs
node tools\validate-regression-fixtures.mjs
```

For each standalone module:

```powershell
node tools\validate-content-module.mjs modules\<module-id>
```

Run a syntax sweep for JavaScript and MJS files:

```powershell
$ErrorActionPreference='Continue'
$files = rg --files -g '*.js' -g '*.mjs' | Sort-Object
$failures = @()
foreach ($file in $files) {
  node --check $file *> $null
  if ($LASTEXITCODE -ne 0) { $failures += $file }
}
[pscustomobject]@{ Checked=$files.Count; Failures=$failures.Count; FailedFiles=($failures -join ', ') } | Format-List
```

Run whitespace checks:

```powershell
git diff --check
```

## Foundry Load Test

Use `docs/foundry-v14-smoke-checklist.md` for the detailed runtime pass.

Minimum release gate:

- Foundry v14 launches with the repository installed as `Data/systems/anime5e`.
- A new world can be created with the Anime 5e system.
- The browser console has no package-load, missing-template, missing-script, registration, or pack errors on world entry.
- One Character, one NPC, one Monster, one Companion, one Vehicle, and one Mecha actor can be created and opened.
- Representative Item types can be created, opened, edited, closed, and reopened.

## Compendium Test

- Run Anime 5e Source Compendiums from Configure Settings.
- Confirm every pack declared in `system.json` appears in the Compendium sidebar.
- Open one core Item pack, one core Actor pack, one supplemental Item pack, one supplemental Actor pack, and one Journal pack.
- Drag a representative Item to a Character actor and confirm no console error appears.
- Open source-backed core monsters, Mounts & Monsters actors, Monstrum Libri actors, Game Screen pregens, Folstavia entries, and Beyonder Worlds entries when those packs are in scope for the release.

## Sample Character Validation

- Run `node tools\validate-regression-fixtures.mjs`.
- In Foundry, create the scratch 1st-level character described by `data/validation-regression-fixtures.json`.
- Confirm HP, Armour Class, Energy, proficiency bonus, movement, point totals, and attack rows match the fixture.
- Import the Game Screen Adventure pregenerated characters and compare their HP, AC, Energy, proficiency, movement, attacks, and total points against the fixture.
- Roll one ability check, one saving throw, one common attack, one common damage roll, one Item attack, and one Item damage roll.

## Module Compatibility

For every standalone module in `modules/`:

- Validate the module source manifest.
- Enable the module in a test world.
- Confirm module packs appear and can be opened.
- Open or import a representative Species/Class, Item, Actor, and Journal from the module.
- Disable the module, reload the world, and confirm the base Anime 5e system still loads without missing-document console errors.

## Changelog And GitHub

- Update release notes or changelog text with completed issue numbers and user-facing changes.
- Make sure completed narrow slice issues are commented and closed.
- Keep umbrella issues open when later runtime smoke, content expansion, or automation work remains.
- Confirm `main` is pushed.
- Tag the intended release commit only after validation and smoke notes are recorded.

## Final Gate

Do not publish the release until:

- Local validators pass.
- Foundry v14 smoke results are recorded.
- Module enable/disable smoke results are recorded for included modules.
- Sample character and pregen checks are recorded.
- Manifest/download URLs point at the intended release path.
- The release artifact excludes local-only source and cache material.
