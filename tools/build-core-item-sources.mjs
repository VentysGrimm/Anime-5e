import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SYSTEM_ID = "anime5e";
const SOURCE_BOOK = "Anime 5E Fifth Edition Core Rules";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function writeJson(relativePath, data) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replaceAll("&", "and")
    .replaceAll("'", "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sourceId(prefix, name) {
  return `${prefix}.${slugify(name)}`;
}

function sourceDescription(page, details, summary) {
  const lines = [`<p><strong>Source:</strong> ${escapeHtml(SOURCE_BOOK)}, p. ${escapeHtml(page)}.</p>`];
  if (details.length) lines.push(`<p>${details.map(([label, value]) => `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}.`).join(" ")}</p>`);
  if (summary) lines.push(`<p><strong>Rules Summary:</strong> ${escapeHtml(summary)}</p>`);
  return lines.join("");
}

function flags(id, page) {
  return {
    [SYSTEM_ID]: {
      sourceId: id,
      source: {
        book: SOURCE_BOOK,
        page,
        importId: id
      }
    }
  };
}

function makeDocument({
  name,
  type,
  folder,
  img = "icons/svg/book.svg",
  sourcePage,
  rank = 1,
  cost = 0,
  sourceId: explicitSourceId,
  sourceIdPrefix = `core.${type}`,
  details = [],
  summary = "",
  system = {}
}) {
  const id = explicitSourceId ?? sourceId(sourceIdPrefix, name);
  return {
    name,
    type,
    folder,
    img,
    system: {
      description: sourceDescription(sourcePage, details, summary),
      rank,
      cost,
      source: SOURCE_BOOK,
      sourceId: id,
      sourcePage,
      importId: id,
      ...system
    },
    flags: flags(id, sourcePage)
  };
}

function buildSourceId(prefix, name) {
  return `${prefix}.${slugify(name)}`;
}

function formatAttributeCost(entry) {
  if (entry.costLabel) return entry.costLabel;
  if (Number.isFinite(entry.cost)) return `${entry.cost} Point${entry.cost === 1 ? "" : "s"}/Rank`;
  return "";
}

function buildEntryDescription(source, entry, system) {
  if (entry.description) return entry.description;

  const details = [];
  const type = entry.type ?? source.documentTemplate?.type;
  if (type === "attribute") {
    const cost = formatAttributeCost(entry);
    if (cost) details.push(["Attribute Cost", cost]);
    if (entry.ability) details.push(["Relevant Ability", entry.ability]);
    if (entry.scope) details.push(["Scope", entry.scope]);
    if (entry.progression) details.push(["Progression", entry.progression]);
  } else if (type === "defect") {
    if (entry.category) details.push(["Category", entry.category]);
    if (entry.points) details.push(["Points", entry.points]);
    if (entry.progression) details.push(["Progression", entry.progression]);
  }

  return sourceDescription(system.sourcePage, details, entry.summary);
}

function buildDocumentFromEntry(source, entry) {
  const template = source.documentTemplate ?? {};
  const type = entry.type ?? template.type;
  const id = entry.sourceId ?? buildSourceId(source.sourceIdPrefix, entry.name);
  const system = {
    ...(template.system ?? {}),
    ...(entry.system ?? {})
  };

  system.description = buildEntryDescription(source, entry, {
    ...system,
    sourcePage: entry.sourcePage ?? system.sourcePage ?? null
  });
  system.rank = entry.rank ?? system.rank ?? 1;
  system.cost = entry.cost ?? system.cost ?? 0;
  system.source = entry.source ?? source.sourceBook ?? system.source ?? "";
  system.sourceId = id;
  system.sourcePage = entry.sourcePage ?? system.sourcePage ?? null;
  system.importId = entry.importId ?? id;

  if (type === "attribute") {
    system.category = entry.category ?? system.category ?? "";
    system.progression = entry.progression ?? system.progression ?? "";
  }

  if (type === "defect") {
    system.pointsReturned = entry.pointsReturned ?? system.pointsReturned ?? 0;
  }

  return {
    ...template,
    name: entry.name,
    type,
    folder: entry.folder ?? template.folder,
    img: entry.img ?? template.img,
    system,
    flags: flags(id, system.sourcePage)
  };
}

function existingDocuments(source, type) {
  if (source.entries?.length) return source.entries.map((entry) => buildDocumentFromEntry(source, entry));
  return (source.documents ?? []).filter((document) => document.type === type);
}

const generalEnhancements = [
  ["Area", 143, "Expands an Attribute into a radius of effect, with larger areas requiring more assignments.", "Attribute Enhancement", "Attribute", "0-6 assignments"],
  ["Duration", 143, "Extends how long an Attribute's effect remains active after use, from minutes up to permanent effects with DM approval.", "Attribute Enhancement", "Attribute", "0-10 assignments"],
  ["Potent", 143, "Lets a Rank 1 Attribute keep a lower effective Rank after Limiters would otherwise raise its effect too far.", "Attribute Enhancement", "Attribute", "0-3 assignments"],
  ["Range", 143, "Lets an Attribute originate away from the character, from touch range to city-scale distances.", "Attribute Enhancement", "Attribute", "0-6 assignments"],
  ["Targets", 143, "Allows an Attribute to affect multiple people or objects at the same time.", "Attribute Enhancement", "Attribute", "0-6 assignments"]
];

const generalLimiters = [
  ["Activation", 145, "Requires preparation before the Attribute can be used, ranging from one round to one hour."],
  ["Assisted", 145, "Requires one or more special assistants to be present for the Attribute to activate or continue."],
  ["Backlash", 145, "Creates a harmful side effect when the Attribute fails or misses by the specified margin."],
  ["Charges", 145, "Limits the Attribute to a small number of uses each day or session."],
  ["Concentration", 146, "Requires ongoing focus to keep a non-instant Attribute active."],
  ["Consumable", 146, "Consumes a special focus, reagent, or offering whenever the Attribute is used."],
  ["Dependent", 146, "Prevents the Attribute from taking effect until one or more other Attributes are active."],
  ["Deplete", 146, "Spends Energy to activate or maintain the Attribute when optional Energy rules are used."],
  ["Detectable", 146, "Makes the Attribute's use noticeable or traceable by specified detection methods."],
  ["Emotional", 146, "Restricts use to moments of significant, strong, or extreme emotional investment."],
  ["Environmental", 147, "Limits the Attribute to a specific setting, condition, or situational trigger."],
  ["Equipment", 147, "Requires tools, furnishings, materials, or accessories that aid the Attribute without embodying it."],
  ["Imbue", 147, "Lets the character grant the Attribute's use to others for a dramatic scene, usually with Charges."],
  ["Irreversible", 147, "Makes transformation-style Attributes difficult or slow to undo."],
  ["Maximum", 148, "Forces the Attribute to function at maximum effective strength instead of allowing lower output."],
  ["Object", 148, "Limits an Item-contained Attribute so it benefits the object more than its user."],
  ["Permanent", 148, "Keeps the Attribute always active when that constancy is inconvenient."],
  ["Recovery", 148, "Requires a rest period after using an ongoing Attribute before it can function again."],
  ["Semi-Permanent", 148, "Keeps the Attribute normally active but allows temporary suppression by spending Energy."],
  ["Unique Limiter", 148, "Covers custom restrictions not otherwise listed, with severity set by player and DM agreement."],
  ["Unpredictable", 148, "Requires an Ability check or creates unreliable results when the Attribute is used."]
];

const weaponEnhancements = [
  ["Accurate", 125, "Grants advantage on attack rolls with the Weapon.", "1"],
  ["Area", 125, "Turns the Weapon into an area attack with larger radii at higher assignments.", "1-4"],
  ["Aura", 125, "Automatically affects creatures that touch the user rather than requiring a normal attack action.", "1"],
  ["Blight", 125, "Can greatly increase or reduce damage based on a Constitution save.", "1-3"],
  ["Contact", 125, "Lets the Weapon deliver its effect through skin contact.", "1-2"],
  ["Contagious", 126, "Passes the Weapon's damage or effects to others who touch the affected target unless resisted.", "1-3"],
  ["Continuing", 126, "Adds lingering damage over rounds, hours, or days after the initial successful attack.", "1+"],
  ["Drain", 126, "Reduces a specified Ability Score in addition to any damage.", "1-3"],
  ["Enervation", 126, "Drains Energy from the target in addition to any damage.", "1+"],
  ["Flare", 127, "Overloads a sense, such as sight or hearing, unless the target resists.", "1-3"],
  ["Flexible", 127, "Allows a whip-like or extendible attack to trip or disarm instead of dealing damage.", "1"],
  ["Homing", 127, "Lets a narrowly missed projectile or burst return for one more attempt next round.", "1"],
  ["Incapacitating", 127, "Can immobilise a target with effects such as sleep, paralysis, or petrification.", "2 or 4"],
  ["Inconspicuous", 127, "Hides the attack's visible origin and may enable surprise.", "3"],
  ["Incurable", 127, "Makes wounds harder or impossible to heal until special conditions are met.", "1-3"],
  ["Indirect", 127, "Allows ranged attacks to arc over cover when the target's location is known.", "1"],
  ["Irritant", 127, "Distracts or partially blinds the target, imposing disadvantage if they fail to resist.", "1-3"],
  ["Linked", 127, "Attaches this Weapon to a master Weapon so it hits automatically when the master attack succeeds.", "1"],
  ["Multidimensional", 127, "Allows the Weapon to affect targets across dimensional or incorporeal boundaries.", "1"],
  ["Penetrating", 128, "Reduces the Armour Class benefit of physical armour or hide.", "1-2"],
  ["Quake", 128, "Creates a linear ground fissure or shock wave under a target.", "1-3"],
  ["Range", 128, "Extends a Weapon beyond melee reach, from 10 feet to 1,000 feet.", "1-4"],
  ["Reach", 128, "Extends melee reach and can let the wielder strike first against shorter melee weapons.", "1"],
  ["Selective", 128, "Lets an Area, Aura, or Spreading Weapon choose who is affected.", "1"],
  ["Spreading", 128, "Lets the attack spread to additional nearby targets in a line, cone, or spray.", "1+"],
  ["Tangle", 128, "Restrains targets in physical entanglements that must be damaged or broken.", "1+"],
  ["Targetted", 128, "Doubles damage and selected effects against a chosen individual, group, or common category.", "1-3"],
  ["Trap", 128, "Places the Weapon as a waiting trap that triggers later.", "1-3"],
  ["Unique", 129, "Covers a custom Weapon benefit approved and priced by the DM.", "1+"],
  ["Vampiric", 129, "Transfers lost Hit Points, Energy, or Ability values to the attacker for a short time.", "2 or 4"]
];

const weaponLimiters = [
  ["Ammo", 129, "Limits the Weapon to a small amount of carried ammunition before it must be replenished.", "1-3"],
  ["Exclusive", 130, "Restricts the Weapon to a specified category, group, or individual target.", "1-3"],
  ["Hands", 130, "Requires two appropriately sized hands or appendages to use the Weapon properly.", "1"],
  ["Inaccurate", 130, "Imposes disadvantage on attack rolls with the Weapon.", "1"],
  ["Ingest", 130, "Requires the Weapon's substance to be swallowed before it affects the target.", "1"],
  ["Non-Penetrating", 130, "Makes the Weapon poor against armour or heavy clothing, increasing the defender's AC.", "1"],
  ["Save", 130, "Replaces the attack roll with a target Constitution or Dexterity save.", "2 or 4"],
  ["Toxic", 130, "Only damages living targets and can sometimes be countered by simple precautions.", "1"],
  ["Unique", 130, "Covers a custom Weapon restriction approved and priced by the DM.", "1+"],
  ["Unreliable", 130, "Makes the Weapon fail or malfunction on a natural 1 until a condition is met.", "1"]
];

const techniques = [
  ["Blackout", "Removes the normal disadvantage when attempting a knockout called shot.", 94, 1],
  ["Blind Fighting", "Allows hand-to-hand fighting in poor light, darkness, or against invisible foes without disadvantage.", 94, 1],
  ["Blind Shooting", "Allows ranged attacks in poor light, darkness, or against invisible foes without disadvantage.", 94, 1],
  ["Concealment", "Lets the character hide hand-held objects on their person unless physically searched.", 94, 1],
  ["Critical Strike", "Reduces the margin threshold needed to score critical hits with attacks.", 94, 1],
  ["Extended Range", "Doubles distances when using ranged weapons.", 94, 1],
  ["Far Shot", "Removes disadvantage for attacks beyond a weapon's effective range, though remote-range damage limits still apply.", 94, 1],
  ["Flanking Defence", "Prevents flanking attackers from gaining their normal attack-roll advantage.", 94, 1],
  ["Judge Opponent", "Lets the character estimate an opponent's combat ability and remaining durability from observation.", 94, 1],
  ["Lightning Reflexes", "Grants a +2 bonus on Initiative rolls.", 94, 1],
  ["Multiple Targets", "Allows a single attack roll to strike additional adjacent targets; counts as two Combat Techniques.", 94, 2],
  ["Precise Aim", "Removes disadvantage on pinpoint attacks, most called shots, and trick shots; counts as two Combat Techniques.", 94, 2],
  ["Steady Hand", "Removes disadvantage for attacks while dashing, mounted, or performing complex movement stunts.", 95, 1],
  ["Tournament Encyclopaedia", "Recalls vital statistics and notable quirks about opponents from a chosen tournament type.", 95, 1],
  ["Two Weapons", "Removes the normal disadvantage when fighting with two one-handed weapons; counts as two Combat Techniques.", 95, 2]
];

const powers = [
  ["Dynamic Powers", "Broad story-driven control over a major concept, natural force, or sphere of influence, with Energy costs by effect Rank.", 99, 10, "Dynamic Powers"],
  ["Dynamic Powers - Lesser", "Focused control over a narrower concept, classical element, minor aspect, or limited sphere of influence.", 99, 5, "Dynamic Powers"]
];

const itemAttributes = [
  ["Capacity", 199, "Lets a vehicle or location carry additional people or cargo beyond its normal single occupant.", "Item-only Attribute", "Items, vehicles, and locations", "Rank 1 carries +1 person; Rank 6 carries +50 people or 10 tons."],
  ["Ground Speed", 199, "Gives land vehicles a movement speed when they do not have a natural base speed.", "Item-only Attribute", "Land vehicles", "Rank 1 is 30 feet/round; Rank 6 reaches 1,000 mph."]
];

const weapons = [
  ["Caltrops (Bag)", "Simple Melee Weapons", "1d4", "Piercing", 1, 1, "Area 1, Trap 1", "Save 2", 1, 196],
  ["Club", "Simple Melee Weapons", "1d4", "Bludgeoning", 1, null, "", "", 0, 196],
  ["Dagger or Knife", "Simple Melee Weapons", "1d4", "Piercing", 1, null, "", "", 1, 196],
  ["Greatclub", "Simple Melee Weapons", "1d8", "Bludgeoning", 1, 2, "", "Hands", 2, 196],
  ["Handaxe", "Simple Melee Weapons", "1d6", "Slashing", 2, null, "", "", 2, 196],
  ["Light Hammer", "Simple Melee Weapons", "1d4", "Bludgeoning", 1, null, "", "", 1, 196],
  ["Mace", "Simple Melee Weapons", "1d6", "Bludgeoning", 2, null, "", "", 2, 196],
  ["Quarterstaff", "Simple Melee Weapons", "1d6", "Bludgeoning", 1, 2, "", "Hands", 1, 196],
  ["Sap", "Simple Melee Weapons", "1d2", "Bludgeoning", 1, null, "", "", 1, 196],
  ["Scythe", "Simple Melee Weapons", "1d6", "Slashing", 1, 2, "", "Hands", 1, 196],
  ["Spear or Javelin (Melee)", "Simple Melee Weapons", "1d6", "Piercing", 2, null, "", "", 2, 196],
  ["Unarmed Punch or Kick", "Simple Melee Weapons", "1", "Bludgeoning", 0, null, "", "", 0, 196],
  ["Spiked Gauntlet", "Simple Melee Weapons", "1d4", "Piercing", 1, null, "", "", 1, 196],
  ["Wooden Stake", "Simple Melee Weapons", "1d4", "Piercing", 1, null, "", "", 1, 196],
  ["Battleaxe", "Martial Melee Weapons", "1d8", "Slashing", 2, null, "", "", 2, 196],
  ["Bastard Sword (One-Hand)", "Martial Melee Weapons", "1d10", "Slashing", 3, null, "", "", 3, 196],
  ["Bastard Sword (Two-Hands)", "Martial Melee Weapons", "1d10", "Slashing", 3, null, "Accurate", "Hands", 3, 196],
  ["Bokken (Wooden Sword)", "Martial Melee Weapons", "1d6", "Bludgeoning", 2, null, "", "", 2, 196],
  ["Garrotte Wire", "Martial Melee Weapons", "2d6", "Slashing", 1, 3, "", "Hands, Non-Penetrating", 1, 196],
  ["Greataxe", "Martial Melee Weapons", "1d12", "Slashing", 2, 3, "", "Hands", 2, 196],
  ["Greatsword", "Martial Melee Weapons", "2d6", "Slashing", 2, 3, "", "Hands", 2, 196],
  ["Katana", "Martial Melee Weapons", "2d4", "Slashing", 2, null, "", "", 2, 196],
  ["Lance, Tournament", "Martial Melee Weapons", "1d8", "Bludgeoning", 1, 2, "Reach", "Non-Penetrating, Unreliable", 1, 196],
  ["Lance, War", "Martial Melee Weapons", "1d12", "Piercing", 4, 3, "Reach", "", 4, 196],
  ["Longsword", "Martial Melee Weapons", "1d8", "Slashing", 2, null, "", "", 2, 196],
  ["Maul", "Martial Melee Weapons", "2d6", "Bludgeoning", 2, 3, "", "Hands", 2, 196],
  ["Morningstar Flail", "Martial Melee Weapons", "1d8", "Piercing", 2, null, "", "", 2, 196],
  ["Nunchaku", "Martial Melee Weapons", "1d6", "Bludgeoning", 2, null, "", "", 2, 196],
  ["Polearm", "Martial Melee Weapons", "1d10", "Piercing", 3, null, "Reach", "Hands", 3, 196],
  ["Rapier", "Martial Melee Weapons", "1d8", "Piercing", 2, null, "", "", 2, 196],
  ["Scimitar", "Martial Melee Weapons", "1d6", "Slashing", 2, null, "", "", 2, 196],
  ["Shield (Bash)", "Martial Melee Weapons", "2d4", "Bludgeoning", 1, 2, "", "Inaccurate", 1, 196],
  ["Shortsword", "Martial Melee Weapons", "1d6", "Piercing", 2, null, "", "", 2, 196],
  ["Trident", "Martial Melee Weapons", "1d6", "Piercing", 2, null, "", "", 2, 196],
  ["Wakizashi", "Martial Melee Weapons", "1d6", "Slashing", 2, null, "", "", 2, 196],
  ["War Pick", "Martial Melee Weapons", "1d8", "Piercing", 2, null, "", "", 2, 196],
  ["Warhammer", "Martial Melee Weapons", "1d8", "Bludgeoning", 2, null, "", "", 2, 196],
  ["Weighted Chain", "Martial Melee Weapons", "1d6", "Bludgeoning", 1, 2, "Flexible", "Backlash, Inaccurate", 1, 196],
  ["Whip", "Martial Melee Weapons", "1d4", "Slashing", 2, 1, "Flexible, Range 1", "Non-Penetrating", 2, 196],
  ["Crossbow, Light", "Simple Ranged Weapons", "1d8", "Piercing", 4, 2, "Penetrating, Range 3", "Activation 1, Hands", 4, 197],
  ["Lasso", "Simple Ranged Weapons", "0d4", "", 1, 0, "Range 2, Tangle", "Inaccurate 2", 1, 197],
  ["Rock or Object, Huge", "Simple Ranged Weapons", "10d4", "Bludgeoning", 11, 10, "Range 2", "Inaccurate", 11, 197],
  ["Rock or Object, Large", "Simple Ranged Weapons", "6d4", "Bludgeoning", 7, 6, "Range 2", "Inaccurate", 7, 197],
  ["Rock or Object, Medium", "Simple Ranged Weapons", "4d4", "Bludgeoning", 5, 4, "Range 2", "Inaccurate", 5, 197],
  ["Rock or Object, Small", "Simple Ranged Weapons", "2d4", "Bludgeoning", 3, 2, "Range 2", "Inaccurate", 3, 197],
  ["Rock or Object, Tiny", "Simple Ranged Weapons", "1d4", "Bludgeoning", 2, 1, "Range 2", "Inaccurate", 2, 197],
  ["Shortbow", "Simple Ranged Weapons", "1d6", "Piercing", 4, 2, "Range 3", "Hands", 4, 197],
  ["Shuriken or Dart", "Simple Ranged Weapons", "1d4", "Piercing", 2, 1, "Range 2", "Non-Penetrating", 2, 197],
  ["Sling", "Simple Ranged Weapons", "1d4", "Bludgeoning", 1, null, "Range 2", "Inaccurate, Non-Penetrating", 1, 197],
  ["Spear or Javelin (Thrown)", "Simple Ranged Weapons", "1d6", "Piercing", 2, null, "Accurate, Range 2", "Ammo 3", 2, 197],
  ["Blowgun", "Martial Ranged Weapons", "1", "Piercing", 1, 0, "Range 2", "Non-Penetrating", 1, 197],
  ["Bolas", "Martial Ranged Weapons", "0d4", "", 1, 0, "Accurate, Potent, Range 2, Tangle", "Ammo 3, Non-Penetrating", 1, 197],
  ["Crossbow, Hand", "Martial Ranged Weapons", "1d6", "Piercing", 4, 2, "Range 2", "", 4, 197],
  ["Crossbow, Heavy", "Martial Ranged Weapons", "1d10", "Piercing", 5, 3, "Penetrating, Range 3", "Activation 1, Hands", 5, 197],
  ["Longbow", "Martial Ranged Weapons", "1d8", "Piercing", 5, 2, "Range 4", "Hands", 5, 197],
  ["Net", "Martial Ranged Weapons", "0d4", "", 1, 0, "Potent 3, Range 1, Tangle", "Ammo 3, Hands", 1, 197],
  ["Net, Fighting", "Martial Ranged Weapons", "1d4", "Piercing", 1, null, "Potent 3, Range 1, Tangle", "Ammo 3, Hands, Non-Penetrating", 1, 197],
  ["Acid (Flask)", "Splash Weapons", "1d8", "Acid", 6, 2, "Area 1, Contact 2, Continuing 3, Range 2", "Ammo 3, Inaccurate", 6, 197],
  ["Boiling Oil (Barrel)", "Splash Weapons", "2d10", "Fire", 6, 5, "Area 2, Contact 2, Continuing 5", "Activation 2, Ammo 3, Assisted 1, Inaccurate, Hands", 6, 197],
  ["Molotov Cocktail", "Splash Weapons", "2d8", "Fire", 6, 4, "Area 2, Continuing 3, Range 2", "Activation 1, Ammo 3, Inaccurate", 6, 197],
  ["Ballista, Large", "Siege Weapons", "4d6", "Bludgeoning", 6, null, "Range 4", "Activation 2, Hands, Inaccurate", 6, 197],
  ["Ballista, Medium", "Siege Weapons", "3d6", "Bludgeoning", 3, 4, "Range 3", "Activation 2, Hands, Inaccurate", 3, 197],
  ["Ballista, Small", "Siege Weapons", "2d6", "Bludgeoning", 3, null, "Range 3", "Activation 2, Hands", 3, 197],
  ["Catapult, Large", "Siege Weapons", "5d8", "Bludgeoning", 11, 10, "Area 2, Indirect, Range 4", "Activation 2, Assisted 2, Hands, Inaccurate", 11, 197],
  ["Catapult, Medium", "Siege Weapons", "4d8", "Bludgeoning", 7, 8, "Area 1, Indirect, Range 3", "Activation 2, Assisted 2, Hands, Inaccurate", 7, 197],
  ["Catapult, Small", "Siege Weapons", "3d8", "Bludgeoning", 4, 6, "Indirect, Range 3", "Activation 2, Assisted 2, Hands, Inaccurate", 4, 197],
  ["Ram, Large", "Siege Weapons", "10d4", "Bludgeoning", 5, 10, "", "Activation 1, Assisted 3, Hands", 5, 197],
  ["Ram, Medium", "Siege Weapons", "6d4", "Bludgeoning", 3, 6, "Potent 2", "Activation 1, Assisted 3, Hands", 3, 197],
  ["Ram, Small", "Siege Weapons", "4d4", "Bludgeoning", 2, 4, "", "Assisted 1, Hands", 2, 197]
];

const armour = [
  ["Padded", "Armour", "Light Armour", 11, "5 gp", "11 + Dexterity modifier", "-", "Disadvantage", "8 lb"],
  ["Leather", "Armour", "Light Armour", 11, "10 gp", "11 + Dexterity modifier", "-", "-", "10 lb"],
  ["Studded Leather", "Armour", "Light Armour", 12, "45 gp", "12 + Dexterity modifier", "-", "-", "13 lb"],
  ["Hide", "Armour", "Medium Armour", 12, "10 gp", "12 + Dexterity modifier (max +2)", "-", "-", "12 lb"],
  ["Chain Shirt", "Armour", "Medium Armour", 13, "50 gp", "13 + Dexterity modifier (max +2)", "-", "-", "20 lb"],
  ["Scale Mail", "Armour", "Medium Armour", 14, "50 gp", "14 + Dexterity modifier (max +2)", "-", "Disadvantage", "45 lb"],
  ["Breastplate", "Armour", "Medium Armour", 14, "400 gp", "14 + Dexterity modifier (max +2)", "-", "-", "20 lb"],
  ["Half Plate", "Armour", "Medium Armour", 15, "750 gp", "15 + Dexterity modifier (max +2)", "-", "Disadvantage", "40 lb"],
  ["Ring Mail", "Armour", "Heavy Armour", 14, "30 gp", "14", "-", "Disadvantage", "40 lb"],
  ["Chain Mail", "Armour", "Heavy Armour", 16, "75 gp", "16", "13", "Disadvantage", "55 lb"],
  ["Splint", "Armour", "Heavy Armour", 17, "200 gp", "17", "15", "Disadvantage", "60 lb"],
  ["Plate", "Armour", "Heavy Armour", 18, "1,500 gp", "18", "15", "Disadvantage", "65 lb"]
];

const shields = [
  ["Buckler", 1, "3 gp", "2 (Disadvantage)", "-", "4 lb"],
  ["Small Shield", 2, "10 gp", "1", "-", "6 lb"],
  ["Large Shield", 3, "20 gp", "1", "Disadvantage", "10 lb"]
];

const namedItems = [
  ["3D Manoeuvring Gear", "Adventuring Gear", 200, 1, 4, "Harness that grants exceptional three-axis movement through grappling hooks, jets, and stunt mobility.", "Combat Technique 2; Fast 2; Special Movement 4; Special Requirement 1."],
  ["Animal Control Flute", "Adventuring Gear", 200, 2, 8, "Musical item that exerts limited mind control over nearby woodland animals that can hear it.", "Mind Control - Lesser 10 (2), Area 100 ft, Targets 100, Detectable hearing."],
  ["Bag of Holding", "Adventuring Gear", 201, 1, 4, "Satchel connected to a large pocket dimension that stores many objects and helps retrieve the desired item.", "Pocket Dimension 4; Sixth Sense 1."],
  ["Belt of Giant Strength", "Adventuring Gear", 201, 2, 8, "Worn item that greatly augments the user's Strength.", "Augmented 10."],
  ["Dimensional Story Book", "Adventuring Gear", 201, 2, 8, "Story book that functions as a two-way portal to the dimension described in its narrative.", "Portal 2."],
  ["Distance Quills", "Adventuring Gear", 201, 2, 8, "Linked writing quills that transcribe messages across enormous distances.", "Unique Attribute 10 (1), Range 1,000 miles, Targets 5, Equipment linked quills."],
  ["Divining Rod", "Adventuring Gear", 201, 1, 4, "Y-shaped rod that points the holder toward nearby sources of water.", "Sixth Sense 5 (1), Area 1,000 ft."],
  ["Love Potion", "Adventuring Gear", 201, 3, 12, "Potion that pushes the drinker toward romantic fixation on the first person they encounter.", "Mind Control 5, Duration 1 week, Ingest, Unique Limiter."],
  ["Magical Cloth", "Adventuring Gear", 202, 1, 4, "Self-healing cloth that hides wrapped people or objects from magical and spiritual detection.", "Regeneration 1 (2); Undetectable 2."],
  ["Map Moth", "Adventuring Gear", 202, 2, 8, "Created moth that slowly locates a desired nearby object, person, or concept.", "Dynamic Powers 1, Detection, Potent, Detectable sight."],
  ["Master Key", "Adventuring Gear", 202, 3, 12, "Key that can open physical and metaphysical locks, including planar barriers and unusual passwords.", "Dynamic Powers - Lesser 3, Keys."],
  ["Menagerie Ball", "Adventuring Gear", 202, 4, 16, "Ball that stores creatures in a forested pocket dimension and recalls selected captives on command.", "Pocket Dimension 10 (6), 10-mile pocket, Duration 1 week."],
  ["Portable Hole", "Adventuring Gear", 203, 2, 8, "Foldable hole that creates a short passage through barriers for a small group.", "Teleport 3 (1), Targets 10, wall-only Unique Limiter; Unique Attribute 1."],
  ["Scrying Mirror", "Adventuring Gear", 203, 5, 20, "Mirror or pool that reveals glimpses of desired people, objects, past events, or possible futures.", "Cognition 5 (6); Cognition 2 (4); Dynamic Powers 1; Sixth Sense 1."],
  ["Terradigger", "Adventuring Gear", 203, 3, 12, "Armoured drill vehicle that moves, tunnels, resists pressure, and carries a crossbow weapon.", "AC Bonus 6; Ground Speed 1 (2); Tunnelling 3 (4); Weapon 5 (3)."],
  ["True-Sight Glasses", "Adventuring Gear", 203, 4, 16, "Glasses that reveal the truth behind illusions, projections, and obscuring effects.", "Dynamic Powers - Lesser 4, Visual Truths."],
  ["Winged Boots", "Adventuring Gear", 203, 5, 20, "Boots that provide fast flight and protection against high-altitude cold and thin air.", "Flight 5; Immunity 3; Resilient 1."],
  ["Cleaning Drones", "Daily Devices", 204, 1, 4, "Small magical flying devices that autonomously clean and tidy spaces.", "Flight 1; Unique Attribute 2."],
  ["Grub Carriage", "Daily Devices", 204, 1, 4, "Luxury carriage moved by large grubs that also provides mental protection and Energy recovery.", "Capacity 3; Ground Speed 1 (3); Mind Shield 2; Regeneration 2; Special Requirement 1."],
  ["Skill Pills", "Daily Devices", 204, 1, 4, "Consumable pills that grant practical experience with a selected Skill for one day.", "Edge 1; Skill Proficiency 4 (1)."],
  ["Universal Translator", "Daily Devices", 204, 2, 8, "Device that translates spoken language into the user's native tongue.", "Dynamic Powers - Lesser 2, Languages."],
  ["Water Shoes", "Daily Devices", 204, 1, 4, "Footwear that allows walking across liquid surfaces and swift swimming.", "Special Movement 2; Water Speed 3."],
  ["Binding Contract", "Items of Power", 205, 3, 12, "Magical agreement that remembers its terms perfectly and enforces them on signatories.", "Features 1; Mind Control - Lesser 14 (4)."],
  ["Energy Well", "Items of Power", 205, 2, 8, "Fixed mystical nexus that grants Energy, healing, perception, mental defence, and luck while present.", "Energised 5; Healing 3; Mind Shield 2; Mulligan 1; Skill Proficiency 1; Unique Defect 1."],
  ["Liquid Suit", "Items of Power", 205, 1, 4, "Form-fitting suit that changes the wearer into liquid and improves movement through fluids.", "Change State 1; Water Speed 2 (3)."],
  ["Memory Neutraliser", "Items of Power", 205, 3, 12, "Device that erases very recent memories from a small group in a nearby area.", "Mind Control 5, Area 10 ft, Targets 5, memory-only Unique Limiter."],
  ["Perception Enhancer", "Items of Power", 205, 1, 4, "Helmet that slows the user's perception of time to grant extra actions at an Energy cost.", "Extra Actions 1 (3); Mulligan 1."],
  ["Pixie Glove", "Items of Power", 206, 2, 8, "Sparkling glove that shrinks a Medium user to Diminutive size and grants flight.", "Flight 2; Size Change - Lesser 1 (3)."],
  ["Plasma Gel", "Items of Power", 206, 12, 48, "Mystical gel that creates localised gravity control and micro singularity effects at high Energy cost.", "Dynamic Powers 6, Gravity, Area 10 ft, Range 30 ft, Deplete 30 Energy/use."],
  ["Ring of Power", "Items of Power", 206, 5, 20, "Ancient dominion ring that grants infernal command, protection, inspiration, perception, invisibility, and dangerous curses.", "Connected 8; Immunity 4 (7); Inspire - Greater 4; Skill Proficiency 1; Sixth Sense 1; Undetectable 2; Cursed 3; Hounded 3; Unique Defect 1."],
  ["Summoning Keys", "Items of Power", 206, 6, 24, "Linked keys that summon contracted extraplanar Companions.", "Dynamic Powers 3 (8), Dimensional Companions, Deplete, contract Unique Limiter."],
  ["Teleportation Network", "Items of Power", 208, 5, 20, "Network of linked pods that translocates a small group to fixed destinations across great distances or dimensions.", "Teleport 8 (7), Targets 5, dimensional Unique Enhancement, fixed-pod Equipment."],
  ["Vengeance Gem", "Items of Power", 208, 7, 28, "Forehead gem that augments Constitution, reveals near-future danger, and unlocks psionic combat benefits.", "AC Bonus 5 (6); Augmented 4; Cognition 1 (2); Combat Mastery 4 (5); Dynamic Powers 2."],
  ["World Gate", "Items of Power", 208, 10, 40, "Permanent two-way gate between worlds through an Anime Multiverse wayline.", "Portal 10 (2), Duration Permanent, Activation 1 minute."],
  ["Animal Multisuit", "Protective Devices", 209, 3, 12, "Enchanted bodysuit that grants armour, animal sensory features, claws, movement, and survival traits.", "AC Bonus 2; Features 11; Jumping 2."],
  ["Cloak of Displacement", "Protective Devices", 209, 1, 4, "Durable cloak that shifts the wearer's image and hinders incoming attacks.", "AC Bonus 1; Forced Disadvantage 1."],
  ["Lucky Rabbit's Foot", "Protective Devices", 209, 1, 4, "Charm that improves Wisdom and grants several session rerolls.", "Augmented 2; Mulligan 3."],
  ["Sacred Chalice", "Protective Devices", 209, 5, 20, "Healing chalice that grants longevity, strong healing, and resurrection through water from the cup.", "Features 10 (1); Healing 7 (8); Spell-Like Ability 8."],
  ["Shaed Cloak", "Protective Devices", 209, 2, 8, "Cloak that gives alternate identities, healing, and distance-based invisibility.", "Alternate Identity 6; Healing 2; Undetectable 1 (2)."],
  ["Tin Helm", "Protective Devices", 209, 1, 4, "Folded helm that protects a true believer from mind and body intrusion.", "Immutable 2 (4); Mind Shield 3 (5)."],
  ["Beastly Spear", "Armaments", 210, 5, 20, "Bonded spear that grants Energy, flight, anti-demon stealth, and a powerful targeted multidimensional attack.", "Energised 1; Flight 2 (4); Weapon 15 (5); Undetectable 1; Unique Attribute 2."],
  ["Book of Death", "Armaments", 210, 6, 24, "Book that damages a named target at extreme range through a hidden psychic death attack.", "Weapon 30 (18), Death's Caress."],
  ["Fireball Collar", "Armaments", 210, 4, 16, "Explosive restraint that detonates when removed or remotely triggered.", "Weapon 20, Fireball Explosion."],
  ["Leaching Wand", "Armaments", 210, 2, 8, "Wand that bypasses armour, prevents easy healing, and transfers stolen vitality to the attacker.", "Weapon 10 (2), Invading Pulse."],
  ["Mindeater", "Armaments", 210, 1, 4, "Golden circlet that launches a psychic infection draining Intelligence and spreading by touch.", "Weapon 5 (0), Infection."],
  ["Mobius Blade", "Armaments", 211, 5, 20, "Legendary blade that augments Dexterity, controls cold and humidity, changes size, and attacks with dimensional wind.", "Augmented 4; Control Environment 2; Size Change - Lesser 2; Weapon 11 (5)."],
  ["Pain Doll", "Armaments", 212, 2, 8, "Effigy weapon that harms the represented target from anywhere in the world or a nearby dimensional plane.", "Weapon 10 (2), Pain."],
  ["Sword of Detection", "Armaments", 212, 1, 4, "Sword imprinted on a race or enemy that detects nearby targets and grants their language.", "Language 1; Sixth Sense 1; Weapon 3."],
  ["Thunder Mace", "Armaments", 212, 7, 28, "Bonded mace that controls darkness and storms, flies back to its owner, and offers smash and lightning attacks.", "Control Environment 2; Flight 2 (5); Weapon 12 (6); Weapon 13 (4); Unique Attribute 2."]
];

function enhancementDocument([name, page, summary, category, appliesTo, assignments]) {
  return makeDocument({
    name,
    type: "enhancement",
    folder: category,
    img: "icons/svg/upgrade.svg",
    sourcePage: page,
    sourceIdPrefix: category === "Weapon Enhancement" ? "core.weapon-enhancement" : "core.enhancement",
    details: [
      ["Category", category],
      ["Applies To", appliesTo],
      ["Assignments", assignments]
    ],
    summary,
    system: {
      appliesTo,
      category
    }
  });
}

function limiterDocument([name, page, summary, assignments = "1-3"], category = "Attribute Limiter", appliesTo = "Attribute") {
  return makeDocument({
    name,
    type: "limiter",
    folder: category,
    img: "icons/svg/downgrade.svg",
    sourcePage: page,
    sourceIdPrefix: category === "Weapon Limiter" ? "core.weapon-limiter" : "core.limiter",
    details: [
      ["Category", category],
      ["Applies To", appliesTo],
      ["Assignments", assignments]
    ],
    summary,
    system: {
      appliesTo,
      category
    }
  });
}

function buildAttributes() {
  const source = readJson("data/sources/core/attributes/index.json");
  const baseDocuments = existingDocuments(source, "attribute");
  const documents = [
    ...baseDocuments,
    ...generalEnhancements.map(enhancementDocument),
    ...generalLimiters.map((entry) => limiterDocument([...entry, "1-3"])),
    ...weaponEnhancements.map(([name, page, summary, assignments]) => enhancementDocument([name, page, summary, "Weapon Enhancement", "Weapon", assignments])),
    ...weaponLimiters.map((entry) => limiterDocument(entry, "Weapon Limiter", "Weapon"))
  ];

  writeJson("data/sources/core/attributes/index.json", {
    pack: "anime5e.attributes",
    documentType: "Item",
    sourceBook: SOURCE_BOOK,
    folders: [
      { name: "Attributes", color: "#7c8fa8" },
      { name: "Attribute Enhancement", color: "#6f9a7f" },
      { name: "Attribute Limiter", color: "#9a7f6f" },
      { name: "Weapon Enhancement", color: "#8c6fa0" },
      { name: "Weapon Limiter", color: "#a06f6f" }
    ],
    documents
  });
}

function buildDefects() {
  const source = readJson("data/sources/core/defects/index.json");
  writeJson("data/sources/core/defects/index.json", {
    pack: "anime5e.defects",
    documentType: "Item",
    sourceBook: SOURCE_BOOK,
    folders: [
      { name: "Defects", color: "#a05f5f" }
    ],
    documents: existingDocuments(source, "defect")
  });
}

function buildTechniques() {
  const documents = techniques.map(([name, summary, page, cost]) => makeDocument({
    name,
    type: "technique",
    folder: "Combat Techniques",
    img: name === "Lightning Reflexes" ? "icons/svg/lightning.svg" : "icons/svg/sword.svg",
    sourcePage: page,
    cost,
    details: [
      ["Category", "Combat Technique"],
      ["Technique Cost", `${cost} Combat Technique Rank${cost === 1 ? "" : "s"}`]
    ],
    summary,
    system: {
      category: "Combat Technique"
    }
  }));

  writeJson("data/sources/core/techniques/index.json", {
    pack: "anime5e.techniques",
    documentType: "Item",
    folders: [
      { name: "Combat Techniques", color: "#8f765b" }
    ],
    documents
  });
}

function buildPowers() {
  const documents = powers.map(([name, summary, page, cost, category]) => makeDocument({
    name,
    type: "power",
    folder: "Powers",
    img: "icons/svg/aura.svg",
    sourcePage: page,
    cost,
    sourceId: name === "Dynamic Powers - Lesser" ? "core.power.dynamic-power-lesser" : undefined,
    details: [
      ["Category", category],
      ["Cost", `${cost} Points/Rank`]
    ],
    summary,
    system: {
      category
    }
  }));

  writeJson("data/sources/core/powers/index.json", {
    pack: "anime5e.powers",
    documentType: "Item",
    folders: [
      { name: "Powers", color: "#7b6fa7" }
    ],
    documents
  });
}

function weaponDocument([name, category, damage, damageType, rank, effectiveRank, enhancements, limiters, points, page]) {
  const range = /\bRange\s+\d+/i.exec(enhancements)?.[0] ?? "";
  const sourceTable = "Core Rules Weapon Attribute Table";
  const properties = [
    `Category: ${category}`,
    range ? `Range: ${range}` : null,
    effectiveRank === null ? null : `Effective Rank: ${effectiveRank}`,
    enhancements ? `Enhancements: ${enhancements}` : null,
    limiters ? `Limiters: ${limiters}` : null,
    `Table Points: ${points || 0}`
  ].filter(Boolean).join("; ");

  return makeDocument({
    name,
    type: "weapon",
    folder: "Weapons",
    img: "icons/svg/sword.svg",
    sourcePage: page,
    rank,
    cost: points || 0,
    sourceIdPrefix: "core.weapon",
    details: [
      ["Category", category],
      ["Proficiency Group", category],
      ["Damage", damageType ? `${damage} ${damageType}` : damage],
      ["Range", range || "Melee or special"],
      ["Rank", effectiveRank === null ? String(rank) : `${rank} (${effectiveRank})`],
      ["Enhancements", enhancements || "None"],
      ["Limiters", limiters || "None"],
      ["Source Table", sourceTable]
    ],
    summary: `${name} is a Core Rules ${category.toLowerCase()} option built from the Weapon Attribute table.`,
    system: {
      equipped: false,
      category,
      proficiencyGroup: category,
      range,
      value: "",
      weight: "",
      sourceTable,
      effectiveRank,
      enhancements,
      limiters,
      damage,
      damageType,
      properties
    }
  });
}

function armourDocument([name, folder, category, armourClass, value, acFormula, strength, stealth, weight]) {
  const sourceTable = "Core Rules Armour Table";
  return makeDocument({
    name,
    type: "armor",
    folder,
    img: "icons/svg/shield.svg",
    sourcePage: 198,
    sourceIdPrefix: "core.armor",
    details: [
      ["Category", category],
      ["Value", value],
      ["Armour Class", acFormula],
      ["Strength", strength],
      ["Stealth", stealth],
      ["Weight", weight],
      ["Source Table", sourceTable]
    ],
    summary: `${name} is a Core Rules ${category.toLowerCase()} option from the armour table.`,
    system: {
      equipped: false,
      category,
      armourClass,
      dexterityRule: acFormula,
      strengthRequirement: strength,
      stealth,
      value,
      weight,
      sourceTable,
      properties: `Category: ${category}; Value: ${value}; AC: ${acFormula}; Strength: ${strength}; Stealth: ${stealth}; Weight: ${weight}`
    }
  });
}

function shieldDocument([name, armourClass, value, hands, dexterity, weight]) {
  const sourceTable = "Core Rules Shields Table";
  const shieldSize = name === "Buckler" ? "Buckler" : name.replace(" Shield", "");
  return makeDocument({
    name,
    type: "shield",
    folder: "Shields",
    img: "icons/svg/shield.svg",
    sourcePage: 198,
    sourceIdPrefix: "core.shield",
    details: [
      ["Value", value],
      ["Armour Class Bonus", `+${armourClass}`],
      ["Free Hands", hands],
      ["Dexterity", dexterity],
      ["Weight", weight],
      ["Source Table", sourceTable]
    ],
    summary: `${name} is a Core Rules shield option from the armour and shields table.`,
    system: {
      equipped: false,
      category: "Shield",
      armourClass,
      armourClassModifier: armourClass,
      dexterityRule: dexterity,
      strengthRequirement: "",
      stealth: "",
      value,
      weight,
      sourceTable,
      shieldSize,
      material: "",
      freeHands: hands,
      properties: `Value: ${value}; AC Bonus: +${armourClass}; Free Hands: ${hands}; Dexterity: ${dexterity}; Weight: ${weight}`
    }
  });
}

function itemAttributeDocument([name, page, summary, category, appliesTo, progression]) {
  return makeDocument({
    name,
    type: "itemAttribute",
    folder: "Item Attributes",
    img: "icons/svg/item-bag.svg",
    sourcePage: page,
    cost: 1,
    sourceIdPrefix: "core.item-attribute",
    details: [
      ["Category", category],
      ["Applies To", appliesTo],
      ["Progression", progression]
    ],
    summary,
    system: {
      parentAttribute: "Item",
      appliesTo
    }
  });
}

function namedItemDocument([name, folder, page, rank, points, summary, attributeSummary]) {
  return makeDocument({
    name,
    type: "itemOfPower",
    folder,
    img: "icons/svg/item-bag.svg",
    sourcePage: page,
    rank,
    cost: points,
    sourceIdPrefix: "core.item",
    details: [
      ["Item Rank", rank],
      ["Point Cost", points],
      ["Category", folder]
    ],
    summary,
    system: {
      equipped: false,
      quantity: 1,
      value: "",
      weight: "",
      currency: "gp",
      itemCategory: folder,
      points,
      attunement: "",
      attributeSummary,
      constructionStatus: "Manual bookkeeping",
      constructionNotes: "<p>Point-built item construction automation is not fully implemented. Use Points, Attunement, Attribute Summary, value, weight, and notes for source-backed bookkeeping.</p>"
    }
  });
}

function buildEquipment() {
  writeJson("data/sources/core/equipment/index.json", {
    pack: "anime5e.equipment",
    documentType: "Item",
    folders: [
      { name: "Weapons", color: "#8f5b5b" },
      { name: "Armour", color: "#6d7884" },
      { name: "Shields", color: "#6f788c" },
      { name: "Item Attributes", color: "#7c8fa8" },
      { name: "Adventuring Gear", color: "#7a805a" },
      { name: "Daily Devices", color: "#6f9186" },
      { name: "Items of Power", color: "#8f6fa8" },
      { name: "Protective Devices", color: "#6f86a8" },
      { name: "Armaments", color: "#a06f5f" }
    ],
    documents: [
      ...weapons.map(weaponDocument),
      ...armour.map(armourDocument),
      ...shields.map(shieldDocument),
      ...itemAttributes.map(itemAttributeDocument),
      ...namedItems.map(namedItemDocument)
    ]
  });
}

buildAttributes();
buildDefects();
buildTechniques();
buildPowers();
buildEquipment();

console.log("Core item source JSON rebuilt.");
