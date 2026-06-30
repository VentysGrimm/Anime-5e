# Character Creation Workflow

This milestone starts the Anime 5e character creation build path.

## Implemented in this pass

- Added `module/rules/points.mjs` as the shared point-accounting helper.
- Added actor creation state under `system.creation`.
- Expanded actor point ledgers under `system.points`.
- Derived point totals now include:
  - Ability score cost
  - Species and size-template cost
  - Class cost
  - Attribute/power/technique cost
  - Item of Power / mecha point cost
  - Defect point return
  - Manual spent/refunded adjustments
  - Manual adjustment notes for point overrides
  - Available, total spent, total refunded, and remaining points
- Exposed helpers as `game.anime5e.points` for sheets, macros, importers, and future module packs.
- Connected the Character Folio point summary to the shared point helper used by actor derived data and creation hooks.
- Added Folio creation controls for starting level, starting XP, ability point mode, source budget, XP benchmark, and validation status.
- Added Folio actions to apply source-backed starting level/XP and the Core Rules starting Discretionary Point budget.
- Added Core Rules Table 01 character benchmark data and Folio warnings for ability scores, Attribute ranks, proficiency bonus, and Armour Class.
- Added level progress helpers for current XP, next level threshold, XP needed, and progress within the current level band.
- Added a Folio class level summary derived from owned Class items without applying class benefits.
- Added structured Class item progression data and an item-sheet progression table, seeded first with the Core Rules Adventurer 1-20 unrestricted Bonus Point progression.
- Expanded structured progression data to all 14 Core Rules classes.
- Added Folio multiclass review warnings for missing levels, actor-level mismatches, duplicate class-granted benefits, and manual reallocation notes.
- Limited class-derived Bonus Point automation to a single levelled Class item until advanced multiclass support is implemented.
- Added structured trait data for all 14 Core Rules Anime 5E species, including ability bonuses, Attributes, Defects, languages, movement, and subrace notes.
- Added `Raceless Character` as a 0-point source-backed Species item for characters that save Race Points for discretionary Attributes.
- Added Species Workflow special-path visibility for Raceless and Hybrid Species. Hybrid Species remains a placeholder/use-prebuilt path until a full constructor is implemented.
- Size Template application now tracks applied template modifiers and applies Armour Class modifiers to the actor while displaying other size modifiers for manual review.
- Added Journal-tab advancement bookkeeping for level/XP progress, Engagement Bonus Points, other non-levelling point awards, remaining points, and advancement notes.

## Current validation warnings

The point helper can warn when:

- point spending exceeds available points;
- manual point adjustments are present without adjustment notes;
- remaining/unspent points are negative in the advancement bookkeeping panel;
- no Species/Race item is attached;
- multiple Species/Race items are attached;
- no Class item is attached;
- no Class item with a level is attached;
- attached Class items have incomplete levels;
- owned class item levels do not match actor level;
- multiple Class items require manual duplicate-benefit and reallocation review;
- ranked Attributes have no cost;
- ranked Defects have no point return.
- a character exceeds the optional Table 01 benchmark limits for their level band.
- multiple Class items are attached before advanced multiclass automation is available.
- multiple Species/Race items are attached before hybrid construction is fully automated.

## Next build step

Add preview-before-apply behaviour for Species and Class items, then expand class-derived HP, hit dice, proficiency automation, and full Hybrid Species construction.
