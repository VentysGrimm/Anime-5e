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

function summarizePointState(actor) {
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

async function applySpecies(actor, item) {
  const update = {
    "system.identity.race": item.name,
    "system.creation.speciesApplied": item.uuid ?? item.id,
    ...summarizePointState(actor)
  };

  return actor.update(update);
}

async function applySizeTemplate(actor, item) {
  const update = {
    "system.identity.sizeTemplate": item.name,
    ...summarizePointState(actor)
  };

  return actor.update(update);
}

async function applyClass(actor, item) {
  const slot = classSlotForItem(actor, item);
  const level = Math.max(1, numberOrZero(item.system?.level));
  const update = {
    [`system.progression.classes.${slot}.name`]: item.name,
    [`system.progression.classes.${slot}.level`]: level,
    [`system.progression.classes.${slot}.hitDice`]: item.system?.hitDice ?? "",
    "system.creation.classApplied": item.uuid ?? item.id,
    ...summarizePointState(actor)
  };

  const currentLevel = numberOrZero(actor.system?.level);
  if (currentLevel < level) update["system.level"] = level;

  return actor.update(update);
}

async function refreshCreationValidation(actor) {
  if (!actor?.isOwner) return;
  const update = summarizePointState(actor);
  if (Object.keys(update).length) await actor.update(update);
}

export function registerCreationWorkflowHooks() {
  Hooks.on("createItem", async (item, _options, userId) => {
    if (userId !== game.user.id) return;
    const actor = embeddedActorForItem(item);
    if (!actor) return;

    if (SPECIES_TYPES.has(item.type)) return applySpecies(actor, item);
    if (SIZE_TEMPLATE_TYPES.has(item.type)) return applySizeTemplate(actor, item);
    if (CLASS_TYPES.has(item.type)) return applyClass(actor, item);
    return refreshCreationValidation(actor);
  });

  Hooks.on("updateItem", async (item, _changes, _options, userId) => {
    if (userId !== game.user.id) return;
    const actor = embeddedActorForItem(item);
    if (!actor) return;
    await refreshCreationValidation(actor);
  });

  Hooks.on("deleteItem", async (item, _options, userId) => {
    if (userId !== game.user.id) return;
    const actor = embeddedActorForItem(item);
    if (!actor) return;
    await refreshCreationValidation(actor);
  });
}
