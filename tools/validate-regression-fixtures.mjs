import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateAttributeCustomization } from "../module/rules/points.mjs";

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
