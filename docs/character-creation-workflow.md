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
  - Available, total spent, total refunded, and remaining points
- Exposed helpers as `game.anime5e.points` for sheets, macros, importers, and future module packs.

## Current validation warnings

The point helper can warn when:

- point spending exceeds available points;
- no Species/Race item is attached;
- multiple Species/Race items are attached;
- no Class item with a level is attached;
- owned class item levels do not match actor level;
- ranked Attributes have no cost;
- ranked Defects have no point return.

## Next build step

Wire the sheet point summary directly to `game.anime5e.points.calculatePointSummary(...)`, then add drag/drop application behaviour for Species and Class items.
