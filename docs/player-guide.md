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

Drag source-backed Species and Class Items from the compendiums whenever possible. The sheet reads those Items for point totals, species workflow summaries, class-level summaries, class-derived benefits, and validation warnings.

Use the Species Workflow to mark the applied Species. Use the Size Template workflow to mark the selected size template; applied size modifiers can update derived summaries such as Armour Class while leaving table-review notes visible.

For classes, set the Class Item level. The actor compares owned Class levels with actor level and warns when they do not match. Multiclass characters are supported for bookkeeping, but duplicate proficiencies, duplicate benefits, and point reallocations still need GM review.

## Attributes, Defects, And Dynamic Powers

Attributes and Defects work best as owned Items. Edit the Item rank and cost or point-return fields, then check Point Summary for the result.

Attributes, powers, spells, techniques, weapons, and other roll-capable Items can expose sheet action buttons:

- Use posts the Item summary to chat.
- Roll rolls the Item formula when present.
- Power Check rolls the configured power or spell check.
- Attack rolls the Item attack fields.
- Damage rolls the Item damage formula.

Dynamic Powers and flexible effects currently store helper fields and notes for GM adjudication. Enter Energy costs, repeated effects, activation limits, saves, attacks, and manual flexible-power notes on the Item so the action has enough context at the table.

## Combat And Rolls

On the Combat tab, enter common attacks with weapon name, attack modifier, attack type, range, d20 mode, target Armour Class, range penalty, damage type, and damage formula.

Useful controls:

- Ability buttons roll ability checks.
- Quick Rolls roll ability checks, proficient checks, or configured checks with DC and bonus.
- Saving throw buttons roll ability saves with optional proficiency.
- Initiative rolls the actor's initiative value.
- Combat Manoeuvres can post Core Rules manoeuvre reminders or roll a selected common attack with the manoeuvre's advantage/disadvantage guidance.
- Attack and Damage buttons roll common attack rows.
- Owned weapon, Attribute, power, spell, and technique actions roll from their Item fields.

The world settings control whether range penalties are applied automatically, whether Margin of Success is shown, and whether critical roll notes are added to attack rolls.

## Level-Up

1. Increase Character Level and Experience.
2. Use Level Up near the Class and Level panel when the character advances. If the character has one clear owned Class item, the sheet advances that Class level, actor level, XP threshold, and proficiency bonus together.
3. For multiclass characters, review or update each owned Class Item level so the owned Class Level total matches the actor level.
4. Review Class-Derived Benefits for new Bonus Points, proficiencies, hit dice summaries, and benefit notes.
5. Add new Attributes, powers, techniques, equipment, or other Items earned at the new level.
6. Update Engagement Bonus Points, other non-levelling awards, and advancement notes on the Folio.
7. Resolve Point Summary warnings before the next session.

## Minimum Character Check

Before play, a character should have:

- A level, experience value, Species or explicit Raceless choice, and at least one Class Item.
- Six ability scores, Hit Points, Energy Points, Armour Class, movement, and proficiency bonus.
- At least one common attack or roll-capable combat Item.
- Point Summary with no unexplained negative remaining points.
- Manual notes for every table ruling that changes point totals.
