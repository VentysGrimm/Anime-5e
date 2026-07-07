# Anime 5e Player Guide

This guide walks a player through creating and maintaining a Character actor in the Anime 5e Foundry system.

## Create A Character

1. Open the Actors directory and create a new Actor with type `Character`.
2. Open the actor. The Character Folio opens on the Overview tab.
3. Enter the character name, player name, campaign identity, level, experience, species text, class text, and other identity fields.
4. In Creation Setup, set Starting Level and Starting XP. Use Apply Start to copy the starting values into the actor.
5. Use Set Budget to apply the recommended Discretionary Point budget for the starting level.
6. Enter the six ability scores. The sheet derives ability modifiers and adds the ability score total into the point summary.
7. Open the core compendiums and drag the character's Species, Size Template, Class, Attributes, Defects, powers, techniques, proficiencies, gear, weapons, armour, and shields onto the actor.
8. Review Point Summary. Fix any warning before play, or record the table ruling in Manual Adjustment Notes.
9. Fill in Hit Points, Energy Points, Armour Class, movement, initiative, and common attack rows on the Overview or Combat tab.
10. Save the actor, close it, reopen it, and confirm the totals persisted.

## Point Spending

The Folio tracks source-backed points from owned Items plus manual adjustments:

- Ability Scores: sum of the six entered ability scores.
- Species and Size Templates: `points` or `cost` from owned Species and Size Template Items.
- Classes: owned Class cost fields, class level fields, and class Bonus Points when structured progression data is present.
- Attributes, item Attributes, powers, techniques, and Weapon Attribute entries: rank multiplied by effective cost.
- Defects: rank multiplied by point return.
- Equipment: Items of Power and mecha point costs when those fields are present.
- Other Spent, Manual Refund, and Manual Adjustment Notes: table-specific overrides.

The remaining-point result is guidance, not a hidden lock. If a GM grants a special exception, put the reason in Manual Adjustment Notes so later validation can distinguish intentional overrides from data-entry mistakes.

## Species, Size, And Class

Drag source-backed Species, Size Template, and Class Items from the compendiums whenever possible. The sheet reads those Items for point totals, species workflow summaries, species trait sync, size modifiers, class-level summaries, class-derived benefits, managed class-grant sync, and validation warnings.

Use the Species Workflow to mark the applied Species. Applied Species ability modifiers contribute to effective ability scores, and Sync Traits creates managed species-paid Attribute and Defect Items from the source trait block. Raceless Character is the 0-point path for saving Race Points for discretionary choices; prebuilt Hybrid Species items use the same sync path.

Use the Size Template workflow to mark the selected size template. The Core Rules size templates use signed point modifiers and can apply AC, attack, range/speed, lift/carry, Strength, damage inflicted, and standard damage received modifiers where the sheet can calculate them.

For classes, set the Class Item level. The actor compares owned Class levels with actor level and warns when they do not match. Class-granted Attribute benefits sync to class-paid owned Attribute Items that do not spend discretionary points. Multiclass characters can advance one owned Class at a time; duplicate proficiencies, duplicate benefits, and point reallocations appear in the Class Benefit Sync and Reallocation Review panels for GM review.

## Attributes, Defects, And Dynamic Powers

Attributes and Defects work best as owned Items. Edit the Item rank and cost or point-return fields, then check Point Summary for the result.

On Attribute and Weapon item sheets, add source-backed Enhancements or Limiters by source ID or UUID in Attribute Customization. Assigned modifiers recalculate effective Rank, show mechanic rows for the incurred changes, and drive derived automation from effective Rank instead of raw Rank. Deplete Limiters require an Energy Cost entry for exact tracked spending; without one, the use card prompts manual Energy tracking.

Attributes, powers, spells, techniques, weapons, and other roll-capable Items can expose sheet action buttons:

- Use posts the Item summary to chat.
- Roll rolls the Item formula when present.
- Power Check rolls the configured power or spell check.
- Attack rolls the Item attack fields.
- Damage rolls the Item damage formula.

Dynamic Powers and flexible effects store helper fields and notes for GM adjudication. When a character owns Dynamic Powers or Dynamic Powers - Lesser, the Powers tab exposes an expression panel that records the chosen expression, effect Rank, approved Energy cost, check ability, roll mode, and notes. The Express action posts the source-backed expression to chat, spends Energy in tracked mode when an approved cost is entered, and appends the expression to the owned Item's tracking notes.

## Combat And Rolls

On the Combat tab, enter common attacks with weapon name, attack modifier, attack type, range, d20 mode, target Armour Class, cover, range penalty, damage type, and damage formula.

Useful controls:

- Ability buttons roll ability checks.
- Quick Rolls roll ability checks, proficient checks, or configured checks with DC and bonus. When a DC is entered, the chat card shows the target and margin.
- Saving throw buttons roll ability saves with optional proficiency.
- Initiative rolls the actor's initiative value.
- Combat Manoeuvres can post Core Rules manoeuvre reminders or roll a selected common attack with the manoeuvre's advantage/disadvantage guidance.
- Attack and Damage buttons roll common attack rows.
- Owned weapon, Attribute, power, spell, and technique actions roll from their Item fields.

Attack roll chat cards apply half cover and three-quarters cover to the target Armour Class before showing margin or critical guidance. Total cover leaves the target Armour Class unchanged and adds a reminder that the target usually cannot be attacked directly.

The world settings control whether range penalties are applied automatically, whether Margin of Success is shown, and whether attack rolls add critical guidance. When enabled, attack chat cards note margin-based double/triple-damage critical hits, margin-based critical failures, suggested Table 22 failure consequences, and optional natural 20/natural 1 alternatives.

## Level-Up

1. Increase Character Level and Experience.
2. Use Level Up near the Class and Level panel when the character advances. If the character has one clear owned Class item, the sheet advances that Class level, actor level, XP threshold, proficiency bonus, source Discretionary Point budget, and class-granted benefits together.
3. For multiclass characters, use the per-Class advance buttons so the owned Class Level total matches actor level.
4. Review Class-Derived Benefits, Class Benefit Sync, Class Choices, and Reallocation Review for new Bonus Points, class-paid Attributes, proficiencies, hit dice summaries, choice benefits, and duplicate-grant notes.
5. Add new Attributes, powers, techniques, equipment, or other Items earned at the new level.
6. Review the Journal tab's current source budget, level benchmark budget, and remaining points, then update Engagement Bonus Points, other non-levelling awards, and advancement notes on the Folio.
7. Resolve Point Summary warnings before the next session.

## Minimum Character Check

Before play, a character should have:

- A level, experience value, Species or explicit Raceless choice, and at least one Class Item.
- Six ability scores, Hit Points, Energy Points, Armour Class, movement, and proficiency bonus.
- At least one common attack or roll-capable combat Item.
- Point Summary with no unexplained negative remaining points.
- Manual notes for every table ruling that changes point totals.
