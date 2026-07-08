import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCoreAttributeUsageContext, calculateCoreAttributeEffects } from "../module/rules/attribute-effects.mjs";
import {
  buildAttributeModifierMechanics,
  calculateEffectiveAttributeRank
} from "../module/rules/attribute-modifier-mechanics.mjs";
import {
  buildCombatManoeuvreState,
  getCombatManoeuvre,
  manoeuvreGrantsTacticalAttackBonus
} from "../module/rules/combat-manoeuvres.mjs";
import { challengeRatingForPoints, parseChallengeRating, xpForChallengeRating } from "../module/rules/challenge-ratings.mjs";
import { calculateAttributeCustomization } from "../module/rules/points.mjs";
import {
  buildCriticalRollDetails,
  criticalFailureConsequenceCount,
  describeCriticalFailureTableResult
} from "../module/rules/rolls.mjs";
import {
  adjustDamageForType,
  applyHitPointChange,
  applyLongRestRecovery,
  applyShortRestRecovery,
  buildShortRestHitDiceFormula,
  canUseMajorPlayerRetcon,
  calculateWoundPressure,
  dramaticFeatEnergyCost,
  playerRetconEnergyCost,
  summarizeHitDice
} from "../module/rules/resources.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(root, "data/validation-regression-fixtures.json");
const fixture = readJson(fixturePath);
const errors = [];
const notes = [];

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function repoPath(relativePath) {
  return path.join(root, relativePath);
}

function fail(message) {
  errors.push(message);
}

function assertEqual(label, actual, expected) {
  if (actual !== expected) fail(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
}

function setPath(target, dottedPath, value) {
  const parts = dottedPath.split(".");
  let object = target;
  for (const part of parts.slice(0, -1)) {
    object[part] ??= {};
    object = object[part];
  }
  object[parts.at(-1)] = value;
}

function createMockActor(system) {
  return {
    system: structuredClone(system),
    update(updateData) {
      for (const [pathKey, value] of Object.entries(updateData)) {
        setPath(this, pathKey, value);
      }
    }
  };
}

function getDocuments(source) {
  return [...(source.documents ?? []), ...(source.entries ?? [])];
}

function sourceIdOf(document) {
  return document.flags?.anime5e?.sourceId
    ?? document.system?.sourceId
    ?? document.system?.source?.sourceId;
}

function countAttacksWithDamage(document) {
  const attacks = document.system?.combat?.attacks ?? {};
  return Object.values(attacks).filter((attack) => {
    if (!attack || typeof attack !== "object") return false;
    return Boolean(String(attack.weapon ?? "").trim() && String(attack.damage ?? "").trim());
  }).length;
}

function combatOf(document) {
  return document.system?.combat ?? {};
}

function moduleRootPath(moduleId, relativePath = "") {
  return repoPath(path.join("modules", moduleId, relativePath));
}

function readModuleJson(moduleId, relativePath) {
  return readJson(moduleRootPath(moduleId, relativePath));
}

function moduleSourceDocuments(moduleId, relativePath) {
  return getDocuments(readModuleJson(moduleId, relativePath));
}

function collectModuleSourceFiles(moduleId, relativePath = "data/source-manifest.json", seen = new Set()) {
  const normalizedPath = relativePath.replaceAll("\\", "/");
  if (seen.has(normalizedPath)) return [];
  seen.add(normalizedPath);

  const source = readModuleJson(moduleId, normalizedPath);
  const sources = [{ relativePath: normalizedPath, source }];
  for (const includePath of source.includes ?? []) {
    sources.push(...collectModuleSourceFiles(moduleId, includePath, seen));
  }
  return sources;
}

function requireMinimumDocuments(label, documents, minimum) {
  if (documents.length < minimum) {
    fail(`${label}: expected at least ${minimum} documents, got ${documents.length}.`);
  }
}

function requireDocumentNames(label, documents, expectedNames) {
  const names = new Set(documents.map((document) => document.name));
  for (const name of expectedNames) {
    if (!names.has(name)) fail(`${label}: missing ${name}.`);
  }
}

function requireDocumentSourceIds(label, documents, expectedSourceIds) {
  const sourceIds = new Set(documents.map(sourceIdOf));
  for (const sourceId of expectedSourceIds) {
    if (!sourceIds.has(sourceId)) fail(`${label}: missing ${sourceId}.`);
  }
}

function documentText(document) {
  return (document.pages ?? [])
    .map((page) => page.text?.content ?? "")
    .join("\n");
}

function validateScratchCharacters() {
  for (const character of fixture.scratchCharacters ?? []) {
    const system = character.system ?? {};
    const expected = character.expected ?? {};
    const label = `Scratch character ${character.name}`;
    const abilityScoreCost = Object.values(system.abilities ?? {})
      .reduce((total, ability) => total + Number(ability?.value ?? 0), 0);
    const startingPoints = Number(system.identity?.startingDiscretionaryPoints ?? 0);
    const remainingPoints = startingPoints - abilityScoreCost;
    const combat = system.combat ?? {};

    assertEqual(`${label} level`, system.level, expected.level);
    assertEqual(`${label} experience`, system.experience, expected.experience);
    assertEqual(`${label} ability score point cost`, abilityScoreCost, expected.abilityScoreCost);
    assertEqual(`${label} starting discretionary points`, startingPoints, expected.startingDiscretionaryPoints);
    assertEqual(`${label} remaining points`, remainingPoints, expected.remainingPoints);
    assertEqual(`${label} Armour Class`, combat.armourClass, expected.armourClass);
    assertEqual(`${label} Hit Points`, combat.hitPoints?.max, expected.hitPoints);
    assertEqual(`${label} Energy`, combat.energy?.max, expected.energy);
    assertEqual(`${label} Proficiency Bonus`, combat.proficiencyBonus, expected.proficiencyBonus);
    assertEqual(`${label} movement`, combat.movementSpeed, expected.movementSpeed);

    const attackCount = countAttacksWithDamage({ system });
    if (attackCount < expected.requiredAttackCount) {
      fail(`${label}: expected at least ${expected.requiredAttackCount} attacks with damage, got ${attackCount}.`);
    }
  }
}

function validateAttributeCustomizationRules() {
  const healingRange = calculateAttributeCustomization({
    type: "attribute",
    name: "Healing",
    system: {
      rank: 4,
      cost: 1,
      allowedEnhancements: "Area, Range, Targets",
      enhancementReferences: [
        {
          name: "Range",
          sourceId: "core.enhancement.range",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 1
        }
      ],
      limiterReferences: []
    }
  });
  assertEqual("Healing Range effective Rank", healingRange.effectiveRank, 3);
  assertEqual("Healing Range point cost", healingRange.totalCost, 4);
  if (healingRange.warnings.length) fail(`Healing Range customization emitted warnings: ${healingRange.warnings.join("; ")}`);

  const healingAreaTargets = calculateAttributeCustomization({
    type: "attribute",
    name: "Healing",
    system: {
      rank: 5,
      cost: 1,
      allowedEnhancements: "Area, Range, Targets",
      enhancementReferences: [
        {
          name: "Area",
          sourceId: "core.enhancement.area",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 2
        },
        {
          name: "Targets",
          sourceId: "core.enhancement.targets",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 2
        }
      ],
      limiterReferences: []
    }
  });
  assertEqual("Healing Area/Targets effective Rank", healingAreaTargets.effectiveRank, 1);
  assertEqual("Healing Area/Targets point cost", healingAreaTargets.totalCost, 5);
  if (healingAreaTargets.warnings.length) fail(`Healing Area/Targets customization emitted warnings: ${healingAreaTargets.warnings.join("; ")}`);

  const mindControl = calculateAttributeCustomization({
    type: "attribute",
    name: "Mind Control",
    system: {
      rank: 2,
      cost: 1,
      allowedEnhancements: "Area, Duration, Range, Targets",
      enhancementReferences: [
        {
          name: "Duration",
          sourceId: "core.enhancement.duration",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 1
        },
        {
          name: "Range",
          sourceId: "core.enhancement.range",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 1
        }
      ],
      limiterReferences: [
        {
          name: "Backlash",
          sourceId: "core.limiter.backlash",
          appliesTo: "Attribute",
          pointModifier: -1,
          assignmentCount: 2
        },
        {
          name: "Environmental",
          sourceId: "core.limiter.environmental",
          appliesTo: "Attribute",
          pointModifier: -1,
          assignmentCount: 1
        }
      ]
    }
  });
  assertEqual("Mind Control cumulative modifier effective Rank", mindControl.effectiveRank, 3);
  assertEqual("Mind Control cumulative modifier point cost", mindControl.totalCost, 2);
  if (mindControl.warnings.length) fail(`Mind Control customization emitted warnings: ${mindControl.warnings.join("; ")}`);

  const rangedAcBonus = {
    type: "attribute",
    name: "AC Bonus",
    system: {
      sourceId: "core.attribute.ac-bonus",
      rank: 3,
      cost: 1,
      allowedEnhancements: "Range",
      effectTargets: "Ally within approved range",
      enhancementReferences: [
        {
          name: "Range",
          sourceId: "core.enhancement.range",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 1,
          rulesNotes: "Lets an Attribute originate away from the character."
        }
      ],
      limiterReferences: []
    }
  };
  assertEqual("AC Bonus Enhancement effective Rank", calculateEffectiveAttributeRank(rangedAcBonus), 2);
  const rangedAcEffects = calculateCoreAttributeEffects({
    system: { combat: { hitPoints: { max: 20 }, movementSpeed: 30 } },
    items: [rangedAcBonus]
  });
  assertEqual("AC Bonus Enhancement derived AC", rangedAcEffects.armourClassBonus, 2);
  const rangedAcMechanics = buildAttributeModifierMechanics(rangedAcBonus);
  if (!rangedAcMechanics.tags.includes("Effective Rank 2")) fail("Ranged AC Bonus mechanics did not include effective-rank tag.");
  if (!rangedAcMechanics.tags.includes("Range 1")) fail("Ranged AC Bonus mechanics did not include Range tag.");
  if (rangedAcMechanics.automation.scope !== "Range 1") fail("Ranged AC Bonus mechanics did not automate Range scope.");

  const untrackedRangeAcBonus = structuredClone(rangedAcBonus);
  delete untrackedRangeAcBonus.system.effectTargets;
  const untrackedRangeEffects = calculateCoreAttributeEffects({
    system: { combat: { hitPoints: { max: 20 }, movementSpeed: 30 } },
    items: [untrackedRangeAcBonus]
  });
  assertEqual("Untracked Range AC Bonus derived AC", untrackedRangeEffects.armourClassBonus, 0);
  if (!untrackedRangeEffects.unapplied.length) fail("Untracked Range AC Bonus should wait for tracked targets before applying.");

  const depletedTough = {
    type: "attribute",
    name: "Tough",
    system: {
      sourceId: "core.attribute.tough",
      rank: 2,
      cost: 1,
      allowedEnhancements: "",
      enhancementReferences: [],
      limiterReferences: [
        {
          name: "Deplete",
          sourceId: "core.limiter.deplete",
          appliesTo: "Attribute",
          pointModifier: -1,
          assignmentCount: 1,
          rulesNotes: "Spends Energy to activate or maintain the Attribute."
        }
      ]
    }
  };
  assertEqual("Tough Deplete effective Rank", calculateEffectiveAttributeRank(depletedTough), 3);
  const depletedUsage = buildCoreAttributeUsageContext(depletedTough);
  assertEqual("Tough Deplete Energy payment required", depletedUsage.energy.requiresPayment, true);
  if (!depletedUsage.summary.some((entry) => entry.includes("Deplete 1"))) fail("Tough Deplete usage summary did not include Deplete mechanics.");

  const areaDurationHealing = {
    type: "attribute",
    name: "Healing",
    system: {
      sourceId: "core.attribute.healing",
      rank: 4,
      cost: 1,
      allowedEnhancements: "Area, Duration, Targets",
      enhancementReferences: [
        {
          name: "Area",
          sourceId: "core.enhancement.area",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 2
        },
        {
          name: "Duration",
          sourceId: "core.enhancement.duration",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 1
        },
        {
          name: "Targets",
          sourceId: "core.enhancement.targets",
          appliesTo: "Attribute",
          pointModifier: 1,
          assignmentCount: 3
        }
      ],
      limiterReferences: []
    }
  };
  const areaDurationUsage = buildCoreAttributeUsageContext(areaDurationHealing);
  assertEqual("Area/Duration automation scope", areaDurationUsage.scope, "Area 2");
  assertEqual("Area/Duration automation duration", areaDurationUsage.duration, "Duration 1");
  assertEqual("Area/Duration automation targets", areaDurationUsage.targetCount, "Targets 3");
  assertEqual("Area/Duration automation status", areaDurationUsage.active, false);
  if (!areaDurationUsage.blockers.some((entry) => entry.includes("remaining time"))) fail("Duration automation did not require remaining duration tracking.");
  if (!areaDurationUsage.blockers.some((entry) => entry.includes("tracked targets"))) fail("Area/Targets automation did not require tracked targets.");
}

function validateCriticalRollRules() {
  assertEqual("Extreme critical hit detail", buildCriticalRollDetails({ total: 26, targetNumber: 15 })[0]?.value, "Extreme success: double final damage after all modifiers.");
  assertEqual("Outrageous critical hit detail", buildCriticalRollDetails({ total: 30, targetNumber: 15 })[0]?.value, "Outrageous success: triple final damage after all modifiers.");
  assertEqual("Extreme critical failure count", criticalFailureConsequenceCount(4, 15), 1);
  assertEqual("Outrageous critical failure count", criticalFailureConsequenceCount(0, 15), 2);
  assertEqual("Critical failure table 10", describeCriticalFailureTableResult(10), "A nearby ally is hit instead and takes half damage.");

  const failureDetails = buildCriticalRollDetails({ total: 4, targetNumber: 15, failureRolls: [10], d20: 1 });
  if (!failureDetails.some((detail) => detail.label === "Critical Failure")) fail("Critical failure details did not include a margin-based failure note.");
  if (!failureDetails.some((detail) => detail.label === "Table 22 (10)")) fail("Critical failure details did not include the Table 22 consequence.");
  if (!failureDetails.some((detail) => detail.label === "Optional Natural 1")) fail("Critical failure details did not include the optional natural 1 note.");
}

function validateCombatManoeuvreStateRules() {
  const aim = getCombatManoeuvre("aim");
  const aimState = buildCombatManoeuvreState(aim, { attackName: "Bow", target: "Bugbear" });
  assertEqual("Aim tactical state label", aimState.tacticalAction, "Aiming");
  assertEqual("Aim tactical state target", aimState.target, "Bugbear");
  if (!aimState.notes.includes("Attack row: Bow")) fail("Aim state did not preserve attack-row context.");
  assertEqual("Aim grants tactical attack bonus", manoeuvreGrantsTacticalAttackBonus("aim"), true);
  assertEqual("Total Defence does not grant outgoing attack bonus", manoeuvreGrantsTacticalAttackBonus("total-defence"), false);

  const grapple = getCombatManoeuvre("grapple-pin");
  const grappleState = buildCombatManoeuvreState(grapple, { target: "Ogre" });
  assertEqual("Grapple pin state label", grappleState.grappleState, "Pinned");
  assertEqual("Grapple pin target", grappleState.target, "Ogre");
  if (!grappleState.notes.includes("pinned target suffers disadvantage")) fail("Grapple pin state did not include source-backed effect notes.");
}

function validateChallengeRatingRules() {
  assertEqual("CR 1/8 parse", parseChallengeRating("1/8"), 0.125);
  assertEqual("CR 1/4 XP", xpForChallengeRating("1/4"), 50);
  assertEqual("CR 0 point lookup", challengeRatingForPoints(50).cr, "0");
  assertEqual("CR 1 point lookup", challengeRatingForPoints(96).cr, "1");
  assertEqual("CR 8 point lookup", challengeRatingForPoints(180).cr, "8");
  assertEqual("CR 14 point lookup", challengeRatingForPoints(261).cr, "14");
  assertEqual("CR 28 point lookup", challengeRatingForPoints(600).cr, "28");
  assertEqual("CR 30 point lookup", challengeRatingForPoints(651).cr, "30");
  assertEqual("CR beyond table lookup", challengeRatingForPoints(701).cr, "30+");
  assertEqual("CR beyond table flag", challengeRatingForPoints(701).beyondTable, true);
}

async function validateDamageTypeRules() {
  const profile = {
    immunities: "poison",
    resistances: "fire, slashing",
    vulnerabilities: "cold",
    reduction: 2,
    reductionTypes: "standard, slashing"
  };

  const immune = adjustDamageForType(12, "Poison", profile);
  assertEqual("Poison immunity damage", immune.adjusted, 0);
  if (!immune.notes.some((note) => note.includes("immunity"))) fail("Poison immunity did not report an immunity note.");

  const resistant = adjustDamageForType(11, "Fire", profile);
  assertEqual("Fire resistance damage", resistant.adjusted, 5);

  const vulnerable = adjustDamageForType(6, "Cold", profile);
  assertEqual("Cold vulnerability damage", vulnerable.adjusted, 12);

  const reduced = adjustDamageForType(11, "Slashing", profile);
  assertEqual("Slashing resistance and reduction damage", reduced.adjusted, 3);

  const standard = adjustDamageForType(7, "", profile);
  assertEqual("Standard damage reduction", standard.adjusted, 5);

  const actor = createMockActor({
    combat: {
      hitPoints: { value: 10, max: 20, temporary: 4 },
      damageProfile: { resistances: "fire" }
    }
  });
  const change = await applyHitPointChange(actor, 8, "damage", { damageType: "fire" });
  assertEqual("Typed damage application adjusted amount", change.amount, 4);
  assertEqual("Typed damage temporary HP", actor.system.combat.hitPoints.temporary, 0);
  assertEqual("Typed damage current HP", actor.system.combat.hitPoints.value, 10);
}

async function validateResourceRecoveryRules() {
  const restSystem = {
    abilities: { constitution: { modifier: 2 } },
    combat: {
      hitPoints: { value: 4, max: 20 },
      energy: { value: 3, max: 10 },
      hitDice: { spent: 1, total: 3, dieSize: 8 }
    },
    progression: {
      classes: {
        primary: { level: 3, hitDice: "d8" }
      }
    }
  };
  const pressure = calculateWoundPressure(restSystem);
  assertEqual("Wound pressure active", pressure.active, true);
  assertEqual("Wound pressure threshold", pressure.threshold, 5);
  assertEqual("Wound pressure inactive above threshold", calculateWoundPressure({
    combat: { hitPoints: { value: 6, max: 20 } }
  }).active, false);

  const hitDice = summarizeHitDice(restSystem);
  assertEqual("Hit Dice total", hitDice.total, 3);
  assertEqual("Hit Dice available", hitDice.available, 2);
  assertEqual("Hit Dice label", hitDice.label, "3d8");

  const shortRestPlan = buildShortRestHitDiceFormula(restSystem, 2);
  assertEqual("Short rest Hit Dice formula", shortRestPlan.formula, "2d8 + 4");
  assertEqual("Short rest selected dice", shortRestPlan.hitDiceSpent, 2);

  const shortRestActor = createMockActor(restSystem);
  const shortRest = await applyShortRestRecovery(shortRestActor, {
    energyRecovery: 5,
    hitDiceSpent: 2,
    hitPointRecovery: 11
  });
  assertEqual("Short rest HP next", shortRest.hpNext, 15);
  assertEqual("Short rest actor HP", shortRestActor.system.combat.hitPoints.value, 15);
  assertEqual("Short rest Energy next", shortRest.energyNext, 8);
  assertEqual("Short rest Hit Dice spent", shortRestActor.system.combat.hitDice.spent, 3);

  const longRestActor = createMockActor({
    combat: {
      hitPoints: { value: 1, max: 20 },
      energy: { value: 0, max: 10 },
      hitDice: { spent: 3, total: 5, dieSize: 10 }
    },
    progression: {
      classes: {
        primary: { level: 5, hitDice: "d10" }
      }
    }
  });
  const longRest = await applyLongRestRecovery(longRestActor);
  assertEqual("Long rest HP next", longRest.hpNext, 20);
  assertEqual("Long rest Energy next", longRest.energyNext, 10);
  assertEqual("Long rest Hit Dice regained", longRest.hitDiceRegained, 2);
  assertEqual("Long rest actor Hit Dice spent", longRestActor.system.combat.hitDice.spent, 1);
}

function validateStoryEnergyRules() {
  assertEqual("Dramatic Feat +1 Energy cost", dramaticFeatEnergyCost(1), 5);
  assertEqual("Dramatic Feat +3 Energy cost", dramaticFeatEnergyCost(3), 15);
  assertEqual("Minor Player Retcon Energy cost", playerRetconEnergyCost("minor"), 10);
  assertEqual("Major Player Retcon Energy cost", playerRetconEnergyCost("major"), 50);
  assertEqual("Major Player Retcon low-level gate", canUseMajorPlayerRetcon({
    level: 7,
    items: []
  }), false);
  assertEqual("Major Player Retcon level gate", canUseMajorPlayerRetcon({
    level: 8,
    items: []
  }), true);
  assertEqual("Major Player Retcon Energised gate", canUseMajorPlayerRetcon({
    level: 3,
    items: [
      {
        type: "attribute",
        system: {
          sourceId: "core.attribute.energised"
        }
      }
    ]
  }), true);
}

function validateAdventuringRiskSources() {
  const riskSource = readJson(repoPath("data/sources/core/equipment/adventuring-risks-core-rules.json"));
  const risks = getDocuments(riskSource);
  const riskBySourceId = new Map(risks.map((risk) => [sourceIdOf(risk), risk]));
  const requiredRisks = [
    "core.adventuring-risk.poison-contact",
    "core.adventuring-risk.poison-ingested",
    "core.adventuring-risk.poison-inhaled",
    "core.adventuring-risk.poison-injury",
    "core.adventuring-risk.disease-direct-contact",
    "core.adventuring-risk.disease-indirect-contact",
    "core.adventuring-risk.disease-genetic-disorder",
    "core.adventuring-risk.environment-chemical-exposure",
    "core.adventuring-risk.environment-cold-air",
    "core.adventuring-risk.environment-fire",
    "core.adventuring-risk.environment-impact-falling",
    "core.adventuring-risk.environment-pressure",
    "core.adventuring-risk.environment-vacuum",
    "core.adventuring-risk.deprivation-starvation",
    "core.adventuring-risk.deprivation-drowning"
  ];

  for (const sourceId of requiredRisks) {
    if (!riskBySourceId.has(sourceId)) fail(`Adventuring risks: missing ${sourceId}.`);
  }

  const categories = risks.reduce((counts, risk) => {
    const category = risk.system?.category ?? "Uncategorized";
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});
  if ((categories.Poison ?? 0) < 4) fail("Adventuring risks: expected at least four poison entries.");
  if ((categories.Disease ?? 0) < 3) fail("Adventuring risks: expected at least three disease entries.");
  if ((categories["Environmental Damage"] ?? 0) < 7) fail("Adventuring risks: expected at least seven environmental damage entries.");
  if ((categories.Deprivation ?? 0) < 9) fail("Adventuring risks: expected the full deprivation table.");

  for (const sourceId of [
    "core.adventuring-risk.environment-chemical-exposure",
    "core.adventuring-risk.environment-fire",
    "core.adventuring-risk.environment-impact-falling",
    "core.adventuring-risk.environment-vacuum"
  ]) {
    const risk = riskBySourceId.get(sourceId);
    if (!String(risk?.system?.damageRoll ?? "").trim()) fail(`${sourceId}: missing risk damage roll.`);
    if (!String(risk?.system?.damageType ?? "").trim()) fail(`${sourceId}: missing risk damage type.`);
  }

  const rulesSource = readJson(repoPath("data/sources/core/rules/core-rules-reference.json"));
  const ruleSourceIds = new Set(getDocuments(rulesSource).map(sourceIdOf));
  if (!ruleSourceIds.has("core.rules.health-risks")) fail("Core rules reference: missing health risks quick reference.");
}

function validateCoreCreatureSources() {
  const expectedMonsters = [
    "Kobold",
    "Goblin",
    "Orc",
    "Bugbear",
    "Ogre",
    "Hell Hound",
    "Mummy",
    "Troll",
    "Wyvern",
    "Stone Giant",
    "Succubus",
    "Young White Dragon",
    "Purple Worm",
    "Adult Red Dragon"
  ];
  const expectedNeomorphs = ["Cabbit", "Elephox", "Gryphon", "Jackalope", "Nue", "Wolverpotamus"];
  const expectedTableNpcs = [
    "Apprentice Wizard",
    "Assassin",
    "Commoner",
    "Cultist",
    "Elementalist",
    "Guard",
    "Highway Bandit",
    "Hired Sword",
    "Informant",
    "Knight",
    "Merchant",
    "Mind Spy",
    "Noble Adventurer",
    "Protector",
    "Scout",
    "Soldier",
    "Street Urchin",
    "Thug",
    "Village Guardian",
    "Zombie"
  ];

  const monsters = getDocuments(readJson(repoPath("data/sources/core/creatures/monsters-core-rules.json")));
  const monsterNames = new Set(monsters.map((document) => document.name));
  for (const name of expectedMonsters) {
    if (!monsterNames.has(name)) fail(`Core monsters: missing ${name}.`);
  }

  const neomorphs = getDocuments(readJson(repoPath("data/sources/core/creatures/neomorphs-core-rules.json")));
  const neomorphNames = new Set(neomorphs.map((document) => document.name));
  for (const name of expectedNeomorphs) {
    if (!neomorphNames.has(name)) fail(`Core neomorphs: missing ${name}.`);
  }
  for (const name of expectedNeomorphs) {
    if (!neomorphNames.has(`${name} - Battle`)) fail(`Core neomorphs: missing ${name} - Battle.`);
  }

  const npcs = getDocuments(readJson(repoPath("data/sources/core/creatures/npcs-core-rules.json")));
  if (npcs.some((document) => /placeholder/i.test(document.name ?? ""))) fail("Core NPCs: placeholder entry should not remain.");
  const npcByName = new Map(npcs.map((document) => [document.name, document]));
  for (const name of expectedTableNpcs) {
    const npc = npcByName.get(name);
    if (!npc) {
      fail(`Core NPCs: missing Table 33 NPC ${name}.`);
      continue;
    }
    const label = `Core NPC ${name}`;
    const combat = combatOf(npc);
    if (npc.type !== "npc") fail(`${label}: expected npc actor type.`);
    if (!sourceIdOf(npc)) fail(`${label}: missing source id.`);
    if (npc.system?.source?.page !== 238) fail(`${label}: expected PDF source page 238.`);
    if (!npc.system?.identity?.challengeRating) fail(`${label}: missing Challenge Rating.`);
    if (!npc.system?.identity?.experienceValue) fail(`${label}: missing XP value.`);
    if (combat.armourClass === undefined || combat.armourClass === null || combat.armourClass === "") fail(`${label}: missing Armour Class.`);
    if (!combat.hitPoints?.max && combat.hitPoints?.max !== 0) fail(`${label}: missing max Hit Points.`);
    if (countAttacksWithDamage(npc) === 0) fail(`${label}: missing Table 33 damage attack.`);
  }
}

function validateSupplementalSourcebookContent() {
  const requiredModuleIds = [
    "anime5e-adventuring-accessories",
    "anime5e-beyonder-worlds",
    "anime5e-bonus-character-options",
    "anime5e-folstavia",
    "anime5e-game-screen-adventure",
    "anime5e-hybrid-species",
    "anime5e-monstrum-libri-vol1",
    "anime5e-monstrum-libri-vol2",
    "anime5e-mounts-and-monsters"
  ];
  const configuredModuleIds = new Set((fixture.contentModules ?? []).map((modulePath) => path.basename(modulePath)));

  for (const moduleId of requiredModuleIds) {
    if (!configuredModuleIds.has(moduleId)) fail(`Supplemental modules: ${moduleId} is not listed in regression fixtures.`);
    if (!fs.existsSync(moduleRootPath(moduleId, "module.json"))) {
      fail(`Supplemental modules: missing modules/${moduleId}/module.json.`);
      continue;
    }

    const packPrefix = `${moduleId}.`;
    for (const { relativePath, source } of collectModuleSourceFiles(moduleId)) {
      if (relativePath.includes("data/sources/core/")) {
        fail(`Supplemental modules: ${moduleId}/${relativePath} must not live under core sources.`);
      }

      if (source.pack) {
        if (!source.pack.startsWith(packPrefix)) {
          fail(`Supplemental modules: ${moduleId}/${relativePath} writes to ${source.pack} instead of a ${packPrefix} pack.`);
        }
        if (source.pack.startsWith("anime5e.")) {
          fail(`Supplemental modules: ${moduleId}/${relativePath} writes supplemental content into a core pack.`);
        }
      }

      for (const document of getDocuments(source)) {
        const systemSource = document.system?.source && typeof document.system.source === "object" ? document.system.source : {};
        const effectiveModuleId = document.flags?.anime5e?.source?.moduleId
          ?? systemSource.moduleId
          ?? document.system?.sourceModuleId
          ?? document.sourceModuleId
          ?? source.sourceModuleId;

        if (!effectiveModuleId) {
          fail(`Supplemental modules: ${moduleId}/${relativePath} -> ${document.name ?? "(unnamed)"} is missing source module id.`);
        } else if (effectiveModuleId !== moduleId) {
          fail(`Supplemental modules: ${moduleId}/${relativePath} -> ${document.name ?? "(unnamed)"} has source module id ${effectiveModuleId}.`);
        }
      }
    }
  }

  const folstaviaJournals = moduleSourceDocuments("anime5e-folstavia", "data/sources/folstavia-journals.json");
  const folstaviaSpecies = moduleSourceDocuments("anime5e-folstavia", "data/sources/folstavia-species.json");
  const folstaviaClasses = moduleSourceDocuments("anime5e-folstavia", "data/sources/folstavia-classes.json");
  const folstaviaAttributes = moduleSourceDocuments("anime5e-folstavia", "data/sources/folstavia-attributes.json");
  const folstaviaItems = moduleSourceDocuments("anime5e-folstavia", "data/sources/folstavia-items.json");
  const folstaviaCreatures = moduleSourceDocuments("anime5e-folstavia", "data/sources/folstavia-creatures.json");
  const folstaviaNpcs = moduleSourceDocuments("anime5e-folstavia", "data/sources/folstavia-npcs.json");
  requireMinimumDocuments("Folstavia journals", folstaviaJournals, 13);
  requireMinimumDocuments("Folstavia species", folstaviaSpecies, 20);
  requireMinimumDocuments("Folstavia classes", folstaviaClasses, 7);
  requireMinimumDocuments("Folstavia attributes", folstaviaAttributes, 8);
  requireMinimumDocuments("Folstavia items and vehicles", folstaviaItems, 10);
  requireMinimumDocuments("Folstavia creatures", folstaviaCreatures, 9);
  requireMinimumDocuments("Folstavia NPCs", folstaviaNpcs, 10);
  requireDocumentNames("Folstavia vehicles", folstaviaItems, ["Ash Scorpion", "Hybrid Galleon", "Refrigerated Delivery Carriage", "Storm Dreadnought", "Wind Cutter"]);
  requireDocumentNames("Folstavia named NPCs", folstaviaNpcs, ["Captain Marina Tennyson", "Feena Tarin", "Trin the Exemplar"]);
  const folstaviaMapIndex = folstaviaJournals.find((document) => sourceIdOf(document) === "folstavia.journal.folstavia-map-index");
  if (!folstaviaMapIndex) {
    fail("Folstavia maps: missing source-backed map index journal.");
  } else {
    if (folstaviaMapIndex.folder !== "Folstavia - Maps") fail("Folstavia maps: map index journal is not in the map folder.");
    const mapIndexText = documentText(folstaviaMapIndex);
    if (!mapIndexText.includes("PDF pp. 74-75")) fail("Folstavia maps: map index should cite the PDF viewer map spread.");
    if (!mapIndexText.includes("source-material/maps/")) fail("Folstavia maps: map index should reference the local-only map cache location.");
  }

  const beyonderJournals = moduleSourceDocuments("anime5e-beyonder-worlds", "data/sources/beyonder-worlds-journals.json");
  requireDocumentSourceIds("Beyonder Worlds genre journals", beyonderJournals, [
    "beyonder-worlds.journal.science-fiction",
    "beyonder-worlds.journal.mecha-fantasy",
    "beyonder-worlds.journal.urban-fantasy",
    "beyonder-worlds.journal.cyberpunk",
    "beyonder-worlds.journal.modern-earth"
  ]);
  requireMinimumDocuments("Beyonder Worlds character options", moduleSourceDocuments("anime5e-beyonder-worlds", "data/sources/beyonder-worlds-character-options.json"), 20);
  requireMinimumDocuments("Beyonder Worlds classes", moduleSourceDocuments("anime5e-beyonder-worlds", "data/sources/beyonder-worlds-classes.json"), 10);
  requireMinimumDocuments("Beyonder Worlds species", moduleSourceDocuments("anime5e-beyonder-worlds", "data/sources/beyonder-worlds-species.json"), 7);
  requireMinimumDocuments("Beyonder Worlds items", moduleSourceDocuments("anime5e-beyonder-worlds", "data/sources/beyonder-worlds-items.json"), 50);
  requireMinimumDocuments("Beyonder Worlds threats", moduleSourceDocuments("anime5e-beyonder-worlds", "data/sources/beyonder-worlds-threats.json"), 15);

  requireMinimumDocuments("Adventuring Accessories items", moduleSourceDocuments("anime5e-adventuring-accessories", "data/sources/items-adventuring-accessories.json"), 2);
  requireMinimumDocuments("Adventuring Accessories mecha", moduleSourceDocuments("anime5e-adventuring-accessories", "data/sources/mecha-adventuring-accessories.json"), 5);
  requireMinimumDocuments("Game Screen adventure journals", moduleSourceDocuments("anime5e-game-screen-adventure", "data/sources/adventure-journals.json"), 3);
  requireMinimumDocuments("Game Screen adventure NPCs", moduleSourceDocuments("anime5e-game-screen-adventure", "data/sources/adventure-npcs.json"), 3);
  requireMinimumDocuments("Game Screen pregenerated characters", moduleSourceDocuments("anime5e-game-screen-adventure", "data/sources/pregen-characters.json"), 6);
  requireMinimumDocuments("Mounts and Monsters mounts", moduleSourceDocuments("anime5e-mounts-and-monsters", "data/sources/mount-items.json"), 1);
  requireMinimumDocuments("Mounts and Monsters actors", moduleSourceDocuments("anime5e-mounts-and-monsters", "data/sources/mounts-and-monsters-actors.json"), 4);
  requireMinimumDocuments("Monstrum Libri Vol. 1 creatures", moduleSourceDocuments("anime5e-monstrum-libri-vol1", "data/sources/creatures-vol1.json"), 1);
  requireMinimumDocuments("Monstrum Libri Vol. 2 creatures", moduleSourceDocuments("anime5e-monstrum-libri-vol2", "data/sources/creatures-vol2.json"), 1);

  const actorSheetSource = fs.readFileSync(repoPath("module/sheets/actor-sheet.mjs"), "utf8");
  for (const tabId of ["overview", "attributes", "skills", "defects", "powers", "inventory", "combat", "companions", "biography", "journal"]) {
    if (!actorSheetSource.includes(`id: "${tabId}"`)) fail(`Character Folio sheet: missing ${tabId} tab.`);
  }

  const actorTemplateSource = fs.readFileSync(repoPath("templates/actor-sheet.hbs"), "utf8");
  for (const snippet of [
    "tabbed-folio-sheet",
    "system.notes.family",
    "system.notes.goals",
    "system.notes.group",
    "system.notes.advancement",
    "system.notes.journal"
  ]) {
    if (!actorTemplateSource.includes(snippet)) fail(`Character Folio sheet: missing ${snippet}.`);
  }
}

function validatePregens() {
  const source = readJson(repoPath("modules/anime5e-game-screen-adventure/data/sources/pregen-characters.json"));
  const documentsBySourceId = new Map(getDocuments(source).map((document) => [sourceIdOf(document), document]));

  for (const expected of fixture.gameScreenPregens ?? []) {
    const document = documentsBySourceId.get(expected.sourceId);
    const label = `Pregen ${expected.name}`;
    if (!document) {
      fail(`${label}: missing source document ${expected.sourceId}.`);
      continue;
    }

    const system = document.system ?? {};
    const combat = combatOf(document);
    assertEqual(`${label} name`, document.name, expected.name);
    assertEqual(`${label} actor type`, document.type, "character");
    assertEqual(`${label} level`, system.level, expected.level);
    assertEqual(`${label} Armour Class`, combat.armourClass, expected.armourClass);
    assertEqual(`${label} Hit Points`, combat.hitPoints?.max, expected.hitPoints);
    assertEqual(`${label} Energy`, combat.energy?.max, expected.energy);
    assertEqual(`${label} Proficiency Bonus`, combat.proficiencyBonus, expected.proficiencyBonus);
    assertEqual(`${label} movement`, combat.movementSpeed, expected.movementSpeed);
    assertEqual(`${label} total points`, system.identity?.totalPoints, expected.totalPoints);

    if (expected.flightSpeed !== undefined) assertEqual(`${label} flight speed`, combat.flightSpeed, expected.flightSpeed);

    const attackCount = countAttacksWithDamage(document);
    if (attackCount < expected.requiredAttackCount) {
      fail(`${label}: expected at least ${expected.requiredAttackCount} attacks with damage, got ${attackCount}.`);
    }
  }
}

function validateActorSources() {
  for (const check of fixture.actorSourceChecks ?? []) {
    const source = readJson(repoPath(check.path));
    const documents = getDocuments(source);
    if (documents.length < check.minimumDocuments) {
      fail(`${check.label}: expected at least ${check.minimumDocuments} documents, got ${documents.length}.`);
    }

    for (const document of documents) {
      const label = `${check.label} -> ${document.name ?? "(unnamed)"}`;
      const combat = combatOf(document);
      if (!document.name) fail(`${label}: missing name.`);
      if (!document.type) fail(`${label}: missing actor type.`);
      if (!sourceIdOf(document)) fail(`${label}: missing source id.`);
      if (combat.armourClass === undefined || combat.armourClass === null || combat.armourClass === "") fail(`${label}: missing Armour Class.`);
      if (!combat.hitPoints?.max && combat.hitPoints?.max !== 0) fail(`${label}: missing max Hit Points.`);

      if (check.requireAttackDamage && countAttacksWithDamage(document) === 0) {
        fail(`${label}: missing at least one attack with damage.`);
      }

      if (check.requireCombatSummary && !String(combat.offenseSummary ?? combat.defenseSummary ?? "").trim()) {
        fail(`${label}: missing combat summary.`);
      }
    }
  }
}

function validateContentModules() {
  for (const modulePath of fixture.contentModules ?? []) {
    const manifestPath = repoPath(path.join(modulePath, "module.json"));
    const scriptPath = repoPath(path.join(modulePath, "scripts/module.mjs"));
    if (!fs.existsSync(manifestPath)) {
      fail(`${modulePath}: missing module.json.`);
      continue;
    }
    if (!fs.existsSync(scriptPath)) fail(`${modulePath}: missing scripts/module.mjs.`);

    try {
      execFileSync(process.execPath, [repoPath("tools/validate-content-module.mjs"), repoPath(modulePath)], {
        cwd: root,
        stdio: "pipe"
      });
      notes.push(`${modulePath}: module source validation passed.`);
    } catch (error) {
      const stderr = error.stderr ? String(error.stderr) : "";
      const stdout = error.stdout ? String(error.stdout) : "";
      fail(`${modulePath}: content module validation failed.\n${stderr || stdout || error.message}`);
    }
  }
}

function validatePackage() {
  try {
    execFileSync(process.execPath, [repoPath("tools/validate-package.mjs")], {
      cwd: root,
      stdio: "pipe"
    });
    notes.push("Base package validation passed.");
  } catch (error) {
    const stderr = error.stderr ? String(error.stderr) : "";
    const stdout = error.stdout ? String(error.stdout) : "";
    fail(`Base package validation failed.\n${stderr || stdout || error.message}`);
  }
}

validateScratchCharacters();
validateAttributeCustomizationRules();
validateCriticalRollRules();
validateCombatManoeuvreStateRules();
validateChallengeRatingRules();
await validateDamageTypeRules();
await validateResourceRecoveryRules();
validateStoryEnergyRules();
validateAdventuringRiskSources();
validateCoreCreatureSources();
validateSupplementalSourcebookContent();
validatePregens();
validateActorSources();
validateContentModules();
validatePackage();

if (errors.length) {
  console.error("Anime 5e regression fixture validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Validated Anime 5e regression fixtures: ` +
    `${fixture.scratchCharacters?.length ?? 0} scratch character(s), ` +
    `${fixture.gameScreenPregens?.length ?? 0} Game Screen pregen(s), ` +
    `${fixture.actorSourceChecks?.length ?? 0} actor source check(s), ` +
    `${fixture.contentModules?.length ?? 0} standalone module(s).`
  );
  for (const note of notes) console.log(`- ${note}`);
}
