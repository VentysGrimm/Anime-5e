const ABILITY_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

const SPENDING_ITEM_TYPES = new Set([
  "attribute",
  "itemAttribute",
  "itemOfPower",
  "power",
  "technique",
  "weapon"
]);

const CHARACTER_OPTION_TYPES = new Set(["species", "sizeTemplate", "class", "background", "lifepath", "feature", "trait"]);
const DEFECT_TYPES = new Set(["defect"]);

export function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function positiveNumber(value) {
  return Math.max(0, numberOrZero(value));
}

export function calculateAbilityScoreCost(abilities = {}) {
  return ABILITY_KEYS.reduce((total, key) => {
    const score = positiveNumber(abilities?.[key]?.value);
    return total + score;
  }, 0);
}

export function calculateAttributeCost(item) {
  const system = item?.system ?? item ?? {};
  const rank = positiveNumber(system.effectiveRank ?? system.rank);
  const baseCost = positiveNumber(system.cost);
  const costAdjustment = numberOrZero(system.costAdjustment);
  return Math.max(0, rank * Math.max(0, baseCost + costAdjustment));
}

export function calculateDefectRefund(item) {
  const system = item?.system ?? item ?? {};
  const rank = positiveNumber(system.rank);
  const returned = positiveNumber(system.pointsReturned ?? system.cost);
  return rank * returned;
}

export function calculateSpeciesCost(item) {
  const system = item?.system ?? item ?? {};
  return positiveNumber(system.points ?? system.cost);
}

export function calculateClassCost(item) {
  const system = item?.system ?? item ?? {};
  const level = positiveNumber(system.level);
  return positiveNumber(system.cost)
    + positiveNumber(system.basePoints)
    + (level * positiveNumber(system.pointsPerLevel));
}

export function calculateEquipmentPointCost(item) {
  const system = item?.system ?? item ?? {};
  if (item?.type === "itemOfPower" || item?.type === "mecha") return positiveNumber(system.points ?? system.cost);
  return 0;
}

export function calculateOwnedPointTotals(items = []) {
  const totals = {
    attributeCost: 0,
    classCost: 0,
    classLevelItems: 0,
    classLevelTotal: 0,
    defectRefund: 0,
    equipmentCost: 0,
    speciesCost: 0,
    speciesCount: 0,
    warningItems: []
  };

  for (const item of items ?? []) {
    const type = item?.type;
    const system = item?.system ?? {};

    if (type === "attribute" || type === "itemAttribute" || type === "power" || type === "technique") {
      const cost = calculateAttributeCost(item);
      totals.attributeCost += cost;
      if (positiveNumber(system.rank) > 0 && positiveNumber(system.cost) === 0) {
        totals.warningItems.push(`${item.name ?? "Unnamed Attribute"} has a Rank but no cost.`);
      }
    } else if (DEFECT_TYPES.has(type)) {
      const refund = calculateDefectRefund(item);
      totals.defectRefund += refund;
      if (positiveNumber(system.rank) > 0 && positiveNumber(system.pointsReturned ?? system.cost) === 0) {
        totals.warningItems.push(`${item.name ?? "Unnamed Defect"} has a Rank but no point return.`);
      }
    } else if (type === "species" || type === "sizeTemplate") {
      totals.speciesCost += calculateSpeciesCost(item);
      if (type === "species") totals.speciesCount += 1;
    } else if (type === "class") {
      const level = positiveNumber(system.level);
      totals.classCost += calculateClassCost(item);
      if (level > 0) {
        totals.classLevelItems += 1;
        totals.classLevelTotal += level;
      }
    } else if (type === "itemOfPower" || type === "mecha") {
      totals.equipmentCost += calculateEquipmentPointCost(item);
    } else if (SPENDING_ITEM_TYPES.has(type) || CHARACTER_OPTION_TYPES.has(type)) {
      totals.attributeCost += positiveNumber(system.cost);
    }
  }

  return totals;
}

export function calculateAvailablePoints(system = {}) {
  const identity = system.identity ?? {};
  const points = system.points ?? {};
  return positiveNumber(identity.startingDiscretionaryPoints)
    + positiveNumber(identity.engagementBonusPoints)
    + positiveNumber(identity.otherNonLevellingPoints)
    + positiveNumber(points.refunded);
}

export function calculatePointSummary(system = {}, items = []) {
  const owned = calculateOwnedPointTotals(items);
  const abilityScoreCost = calculateAbilityScoreCost(system.abilities);
  const manualSpent = positiveNumber(system.points?.spent);
  const manualRefund = positiveNumber(system.points?.refunded);
  const available = calculateAvailablePoints(system) + owned.defectRefund;
  const totalSpent = abilityScoreCost
    + manualSpent
    + owned.speciesCost
    + owned.classCost
    + owned.attributeCost
    + owned.equipmentCost;
  const remaining = available - totalSpent;
  const actorLevel = positiveNumber(system.level);
  const warnings = [...owned.warningItems];

  if (remaining < 0) warnings.push("Point spending exceeds available points.");
  if (owned.speciesCount === 0) warnings.push("No Species/Race item is attached yet.");
  if (owned.speciesCount > 1) warnings.push("Multiple Species/Race items are attached; verify this is intentional.");
  if (owned.classLevelItems === 0) warnings.push("No Class item with a level is attached yet.");
  if (owned.classLevelItems > 0 && owned.classLevelTotal !== actorLevel) {
    warnings.push(`Owned class item levels total ${owned.classLevelTotal}, but actor level is ${actorLevel}.`);
  }

  return {
    available,
    manualSpent,
    manualRefund,
    abilityScoreCost,
    speciesCost: owned.speciesCost,
    classCost: owned.classCost,
    attributeCost: owned.attributeCost,
    equipmentCost: owned.equipmentCost,
    defectRefund: owned.defectRefund,
    totalRefunded: manualRefund + owned.defectRefund,
    totalSpent,
    remaining,
    warnings,
    owned
  };
}

export function applyPointSummaryToSystem(system = {}, items = []) {
  const summary = calculatePointSummary(system, items);
  system.points ??= {};
  system.points.abilityScoreCost = summary.abilityScoreCost;
  system.points.speciesCost = summary.speciesCost;
  system.points.classCost = summary.classCost;
  system.points.attributeCost = summary.attributeCost;
  system.points.defectRefund = summary.defectRefund;
  system.points.equipmentCost = summary.equipmentCost;
  system.points.totalSpent = summary.totalSpent;
  system.points.totalRefunded = summary.totalRefunded;
  system.points.available = summary.available;
  system.points.remaining = summary.remaining;
  if (system.creation) {
    system.creation.validationStatus = summary.warnings.length ? "warning" : "valid";
    system.creation.validationNotes = summary.warnings.join("\n");
  }
  return summary;
}
