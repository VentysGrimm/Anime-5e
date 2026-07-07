import { proficiencyBonusForLevel } from "./points.mjs";
import { syncClassGrantedBenefits } from "./class-benefits.mjs";

const SPECIES_TYPES = new Set(["species"]);
const SIZE_TEMPLATE_TYPES = new Set(["sizeTemplate"]);
const CLASS_TYPES = new Set(["class"]);

function embeddedActorForItem(item) {
  return item?.parent?.documentName === "Actor" ? item.parent : null;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function textValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sourceArmourClass(actor) {
  return numberOrZero(
    actor?._source?.system?.combat?.armourClass
      ?? actor?.system?.combat?.baseArmourClass
      ?? actor?.system?.combat?.armourClass
      ?? 10
  ) || 10;
}

function sizeTemplateState(item) {
  const system = item?.system ?? {};

  return {
    armourClassModifier: numberOrZero(system.armourClassModifier),
    attackModifier: numberOrZero(system.attackModifier),
    damageModifier: textValue(system.damageModifier),
    strengthModifier: textValue(system.strengthModifier),
    movementModifier: textValue(system.movementModifier)
  };
}

function firstEmptyClassSlot(actor) {
  const classes = actor?.system?.progression?.classes ?? {};
  for (const key of ["primary", "secondary", "tertiary"]) {
    const entry = classes[key] ?? {};
    if (!String(entry.name ?? "").trim()) return key;
  }
  return "primary";
}

function classSlotForItem(actor, item) {
  const classes = actor?.system?.progression?.classes ?? {};
  const itemName = item?.name ?? "";
  for (const key of ["primary", "secondary", "tertiary"]) {
    if (classes[key]?.name === itemName) return key;
  }
  return firstEmptyClassSlot(actor);
}

function classItemsForActor(actor, pendingItem = null) {
  const items = [...(actor?.items?.contents ?? [])].filter((item) => item?.type === "class");
  if (pendingItem?.type === "class" && !items.some((item) => item.id === pendingItem.id || item.uuid === pendingItem.uuid)) {
    items.push(pendingItem);
  }
  return items;
}

function classProgressionUpdate(actor, pendingItem = null) {
  const classItems = classItemsForActor(actor, pendingItem);
  const classRows = classItems.map((item) => ({
    name: item.name ?? "",
    level: Math.max(0, numberOrZero(item.system?.level)),
    hitDice: item.system?.hitDice ?? ""
  }));
  const totalLevel = classRows.reduce((total, row) => total + row.level, 0);
  const update = {};
  const slots = ["primary", "secondary", "tertiary"];

  for (const [index, slot] of slots.entries()) {
    const row = classRows[index] ?? { name: "", level: 0, hitDice: "" };
    update[`system.progression.classes.${slot}.name`] = row.name;
    update[`system.progression.classes.${slot}.level`] = row.level;
    update[`system.progression.classes.${slot}.hitDice`] = row.hitDice;
  }

  if (totalLevel > 0) {
    update["system.level"] = totalLevel;
    update["system.combat.proficiencyBonus"] = proficiencyBonusForLevel(totalLevel);
  }

  return update;
}

export function summarizePointState(actor) {
  const summary = game.anime5e?.points?.calculatePointSummary?.(actor.system, actor.items?.contents ?? []);
  if (!summary) return {};

  return {
    "system.points.abilityScoreCost": summary.abilityScoreCost,
    "system.points.speciesCost": summary.speciesCost,
    "system.points.classCost": summary.classCost,
    "system.points.classBonusPoints": summary.classBonusPoints,
    "system.points.attributeCost": summary.attributeCost,
    "system.points.defectRefund": summary.defectRefund,
    "system.points.equipmentCost": summary.equipmentCost,
    "system.points.totalRefunded": summary.totalRefunded,
    "system.points.totalSpent": summary.totalSpent,
    "system.points.available": summary.available,
    "system.points.remaining": summary.remaining,
    "system.creation.validationStatus": summary.warnings.length ? "warning" : "valid",
    "system.creation.validationNotes": summary.warnings.join("\n")
  };
}

export async function applySpeciesItem(actor, item) {
  const update = {
    "system.identity.race": item.name,
    "system.creation.speciesApplied": item.uuid ?? item.id,
    ...summarizePointState(actor)
  };

  const result = await actor.update(update);
  await syncClassGrantedBenefits(actor);
  return result;
}

export async function removeSpeciesItem(actor, item) {
  const applied = String(actor.system?.creation?.speciesApplied ?? "");
  const identityRace = String(actor.system?.identity?.race ?? "");
  const itemRefs = new Set([item?.uuid, item?.id].filter(Boolean).map(String));
  const shouldClear = !item || itemRefs.has(applied) || identityRace === item.name;
  const update = {
    ...summarizePointState(actor)
  };

  if (shouldClear) {
    update["system.identity.race"] = "";
    update["system.creation.speciesApplied"] = "";
  }

  return actor.update(update);
}

export async function applySizeTemplateItem(actor, item) {
  const previousArmourClassModifier = numberOrZero(actor.system?.creation?.sizeTemplateArmourClassModifier);
  const nextState = sizeTemplateState(item);
  const nextArmourClass = Math.max(0, sourceArmourClass(actor) - previousArmourClassModifier + nextState.armourClassModifier);
  const update = {
    "system.identity.sizeTemplate": item.name,
    "system.creation.sizeTemplateApplied": item.uuid ?? item.id,
    "system.creation.sizeTemplateArmourClassModifier": nextState.armourClassModifier,
    "system.creation.sizeTemplateAttackModifier": nextState.attackModifier,
    "system.creation.sizeTemplateDamageModifier": nextState.damageModifier,
    "system.creation.sizeTemplateStrengthModifier": nextState.strengthModifier,
    "system.creation.sizeTemplateMovementModifier": nextState.movementModifier,
    "system.combat.armourClass": nextArmourClass,
    ...summarizePointState(actor)
  };

  return actor.update(update);
}

export async function removeSizeTemplateItem(actor, item) {
  const applied = String(actor.system?.creation?.sizeTemplateApplied ?? "");
  const identitySizeTemplate = String(actor.system?.identity?.sizeTemplate ?? "");
  const itemRefs = new Set([item?.uuid, item?.id].filter(Boolean).map(String));
  const shouldClear = !item || itemRefs.has(applied) || identitySizeTemplate === item.name;
  const previousArmourClassModifier = numberOrZero(actor.system?.creation?.sizeTemplateArmourClassModifier);
  const update = {
    ...summarizePointState(actor)
  };

  if (shouldClear) {
    update["system.identity.sizeTemplate"] = "";
    update["system.creation.sizeTemplateApplied"] = "";
    update["system.creation.sizeTemplateArmourClassModifier"] = 0;
    update["system.creation.sizeTemplateAttackModifier"] = 0;
    update["system.creation.sizeTemplateDamageModifier"] = "";
    update["system.creation.sizeTemplateStrengthModifier"] = "";
    update["system.creation.sizeTemplateMovementModifier"] = "";
    update["system.combat.armourClass"] = Math.max(0, sourceArmourClass(actor) - previousArmourClassModifier);
  }

  return actor.update(update);
}

async function applyClass(actor, item) {
  const slot = classSlotForItem(actor, item);
  const level = Math.max(1, numberOrZero(item.system?.level));
  if (numberOrZero(item.system?.level) < 1) await item.update({ "system.level": level });
  const update = {
    [`system.progression.classes.${slot}.name`]: item.name,
    [`system.progression.classes.${slot}.level`]: level,
    [`system.progression.classes.${slot}.hitDice`]: item.system?.hitDice ?? "",
    ...classProgressionUpdate(actor, item),
    "system.creation.classApplied": item.uuid ?? item.id,
    ...summarizePointState(actor)
  };

  return actor.update(update);
}

export async function refreshCreationValidation(actor) {
  if (!actor?.isOwner) return;
  const update = summarizePointState(actor);
  if (Object.keys(update).length) await actor.update(update);
}

export function registerCreationWorkflowHooks() {
  Hooks.on("createItem", async (item, _options, userId) => {
    if (userId !== game.user.id) return;
    const actor = embeddedActorForItem(item);
    if (!actor) return;

    if (SPECIES_TYPES.has(item.type)) return applySpeciesItem(actor, item);
    if (SIZE_TEMPLATE_TYPES.has(item.type)) return applySizeTemplateItem(actor, item);
    if (CLASS_TYPES.has(item.type)) return applyClass(actor, item);
    return refreshCreationValidation(actor);
  });

  Hooks.on("updateItem", async (item, _changes, _options, userId) => {
    if (userId !== game.user.id) return;
    const actor = embeddedActorForItem(item);
    if (!actor) return;
    if (SPECIES_TYPES.has(item.type)) {
      const applied = String(actor.system?.creation?.speciesApplied ?? "");
      if (applied === item.uuid || applied === item.id) return applySpeciesItem(actor, item);
    }
    if (SIZE_TEMPLATE_TYPES.has(item.type)) {
      const applied = String(actor.system?.creation?.sizeTemplateApplied ?? "");
      if (applied === item.uuid || applied === item.id) return applySizeTemplateItem(actor, item);
    }
    if (CLASS_TYPES.has(item.type)) {
      const result = await actor.update({
        ...classProgressionUpdate(actor, item),
        ...summarizePointState(actor)
      });
      await syncClassGrantedBenefits(actor);
      return result;
    }
    await refreshCreationValidation(actor);
  });

  Hooks.on("deleteItem", async (item, _options, userId) => {
    if (userId !== game.user.id) return;
    const actor = embeddedActorForItem(item);
    if (!actor) return;
    if (SPECIES_TYPES.has(item.type)) return removeSpeciesItem(actor, item);
    if (SIZE_TEMPLATE_TYPES.has(item.type)) return removeSizeTemplateItem(actor, item);
    if (CLASS_TYPES.has(item.type)) {
      const result = await actor.update({
        ...classProgressionUpdate(actor),
        ...summarizePointState(actor)
      });
      await syncClassGrantedBenefits(actor);
      return result;
    }
    await refreshCreationValidation(actor);
  });
}
