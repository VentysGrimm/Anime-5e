# Foundry v14 Smoke Checklist

Use this checklist when a local Foundry v14 runtime is available. It records the runtime checks that cannot be proven by the repository validator alone.

## Install Target

Place or symlink this repository at:

```text
FoundryVTT/Data/systems/anime5e
```

The folder name must match the package id in `system.json`: `anime5e`.

## Initial Load

1. Launch Foundry VTT v14.
2. Confirm `Anime 5e` appears in the game-system list.
3. Create a temporary world using the `Anime 5e` system.
4. Open the browser developer console before entering the world.
5. Enter the world and confirm the console has no package-load, missing-template, missing-script, or registration errors.

## Basic Document Smoke

1. Create one Actor for each declared Actor subtype: Character, NPC, Monster, Companion, Vehicle, and Mecha.
2. Create one Item for representative core subtypes: Attribute, Defect, Enhancement, Limiter, Species, Size Template, Class, Weapon, Armour, Shield, Gear, Item of Power, Skill, Tool, Language, Feature, Power, Spell, Technique, Mount, Monster Variant, and Mecha.
3. Open and close each created sheet.
4. Edit a simple text or numeric field on each representative sheet, close it, reopen it, and confirm the value persists.

## Compendium Smoke

1. Open the **Configure Settings** menu.
2. Run the **Anime 5e Core Compendiums** import action.
3. Confirm each declared pack appears in the Compendium sidebar.
4. Open at least one core Item pack, one core Actor pack, one supplemental Item pack, one supplemental Actor pack, and one Journal pack.
5. Drag a representative Item entry to a Character actor and confirm no console error appears.

## Recording Results

Record the Foundry version, browser, world name, validation date, and any console errors in the relevant GitHub issue before closing runtime-verification tickets.
