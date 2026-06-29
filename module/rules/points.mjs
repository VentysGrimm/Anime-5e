const ABILITY_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

export const LEVEL_XP_THRESHOLDS = Object.freeze({
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000
});

export const DEFAULT_STARTING_DISCRETIONARY_POINTS = 80;

export const CHARACTER_BENCHMARKS = Object.freeze([
  {
    key: "novice",
    label: "Novice",
    levelRange: "1st Level",
    minLevel: 1,
    maxLevel: 1,
    maxAbilityScores: [18, 17],
    maxAttributeRank: 4,
    maxProficiencyBonus: 3,
    maxArmourClass: 20,
    maxNormalDamage: 25
  },
  {
    key: "capable",
    label: "Capable",
    levelRange: "2nd-4th Level",
    minLevel: 2,
    maxLevel: 4,
    maxAbilityScores: [19, 18],
    maxAttributeRank: 5,
    maxProficiencyBonus: 4,
    maxArmourClass: 22,
    maxNormalDamage: 40
  },
  {
    key: "seasoned",
    label: "Seasoned",
    levelRange: "5th-10th Level",
    minLevel: 5,
    maxLevel: 10,
    maxAbilityScores: [20, 19],
    maxAttributeRank: 6,
    maxProficiencyBonus: 5,
    maxArmourClass: 24,
    maxNormalDamage: 60
  },
  {
    key: "veteran",
    label: "Veteran",
    levelRange: "11th-16th Level",
    minLevel: 11,
    maxLevel: 16,
    maxAbilityScores: [22, 20],
    maxAttributeRank: 8,
    maxProficiencyBonus: 7,
    maxArmourClass: 26,
    maxNormalDamage: 100
  },
  {
    key: "mythical",
    label: "Mythical",
    levelRange: "17th-20th Level",
    minLevel: 17,
    maxLevel: 20,
    maxAbilityScores: [24, 22],
    maxAttributeRank: 10,
    maxProficiencyBonus: 10,
    maxArmourClass: 30,
    maxNormalDamage: 200
  },
  {
    key: "epic",
    label: "Epic",
    levelRange: "Above 20th Level",
    minLevel: 21,
    maxLevel: Infinity,
    maxAbilityScores: null,
    maxAttributeRank: null,
    maxProficiencyBonus: null,
    maxArmourClass: null,
    maxNormalDamage: null
  }
]);

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

export function normalizeCharacterLevel(value) {
  return Math.max(1, Math.trunc(numberOrZero(value)) || 1);
}

export function calculateStartingExperience(level) {
  return LEVEL_XP_THRESHOLDS[normalizeCharacterLevel(level)] ?? null;
}

export function getLevelProgress(level, experience) {
  const currentLevel = normalizeCharacterLevel(level);
  const currentExperience = Math.max(0, Math.trunc(numberOrZero(experience)));
  const currentThreshold = LEVEL_XP_THRESHOLDS[currentLevel] ?? null;
  const nextLevel = currentLevel + 1;
  const nextThreshold = LEVEL_XP_THRESHOLDS[nextLevel] ?? null;
  const hasNextThreshold = nextThreshold !== null;
  const levelSpan = currentThreshold !== null && hasNextThreshold
    ? Math.max(0, nextThreshold - currentThreshold)
    : null;
  const xpIntoLevel = currentThreshold !== null
    ? Math.max(0, currentExperience - currentThreshold)
    : null;

  return {
    currentLevel,
    currentExperience,
    currentThreshold,
    nextLevel: hasNextThreshold ? nextLevel : null,
    nextThreshold,
    hasNextThreshold,
    xpIntoLevel,
    xpForLevel: levelSpan,
    xpToNext: hasNextThreshold ? Math.max(0, nextThreshold - currentExperience) : null,
    progressLabel: levelSpan !== null ? `${Math.min(xpIntoLevel, levelSpan)} / ${levelSpan}` : "Untracked",
    nextLevelLabel: hasNextThreshold ? `Level ${nextLevel}` : "Beyond 20",
    nextThresholdLabel: hasNextThreshold ? String(nextThreshold) : "Untracked",
    xpToNextLabel: hasNextThreshold ? String(Math.max(0, nextThreshold - currentExperience)) : "Untracked"
  };
}

export function calculateRecommendedDiscretionaryPoints(level) {
  return DEFAULT_STARTING_DISCRETIONARY_POINTS + Math.max(0, normalizeCharacterLevel(level) - 1);
}

export function summarizeClassLevelState(items = [], actorLevel = 1) {
  const normalizedActorLevel = normalizeCharacterLevel(actorLevel);
  const classes = (items ?? [])
    .filter((item) => item?.type === "class")
    .map((item) => ({
      id: item.id,
      name: item.name ?? "Unnamed Class",
      level: positiveNumber(item.system?.level)
    }));
  const classLevelItems = classes.filter((item) => item.level > 0).length;
  const classLevelTotal = classes.reduce((total, item) => total + item.level, 0);
  const hasClassLevels = classLevelItems > 0;
  const matchesActorLevel = hasClassLevels && classLevelTotal === normalizedActorLevel;
  const mismatch = hasClassLevels && classLevelTotal !== normalizedActorLevel;

  return {
    actorLevel: normalizedActorLevel,
    classLevelTotal,
    classLevelItems,
    classes,
    hasClassLevels,
    matchesActorLevel,
    mismatch,
    status: matchesActorLevel ? "valid" : "warning",
    statusLabel: matchesActorLevel ? "Matches" : hasClassLevels ? "Mismatch" : "No class levels"
  };
}

function formatGrantedBenefit(benefit = {}) {
  const label = benefit.label || benefit.type || "Benefit";
  const points = numberOrZero(benefit.points);
  const rank = numberOrZero(benefit.rank);
  const rankText = rank > 0 ? ` Rank ${rank}` : "";
  const pointText = points !== 0 ? ` [${points}]` : "";
  const notes = typeof benefit.notes === "string" && benefit.notes.trim() ? ` - ${benefit.notes.trim()}` : "";

  return `${label}${rankText}${pointText}${notes}`;
}

export function summarizeSingleClassBenefits(items = [], actorLevel = 1) {
  const classItems = (items ?? []).filter((item) => item?.type === "class");
  const warnings = [];

  if (!classItems.length) {
    return {
      active: false,
      classCount: 0,
      warnings,
      bonusPoints: 0,
      benefits: []
    };
  }

  if (classItems.length > 1) {
    warnings.push("Multiple Class items are attached; class benefit automation is limited to one class until multiclass support is implemented.");
  }

  const classItem = classItems[0];
  const system = classItem.system ?? {};
  const classLevel = Math.min(20, positiveNumber(system.level) || normalizeCharacterLevel(actorLevel));
  const progression = Array.isArray(system.progression) ? system.progression : [];
  if (!progression.length) {
    warnings.push(`${classItem.name ?? "Class"} has no structured progression data.`);
  }

  const rows = progression
    .filter((row) => positiveNumber(row.level) > 0 && positiveNumber(row.level) <= classLevel)
    .sort((a, b) => positiveNumber(a.level) - positiveNumber(b.level));
  const lastRow = rows[rows.length - 1] ?? null;
  const bonusPoints = rows.reduce((total, row) => total + positiveNumber(row.points), 0);
  const hitDice = system.hitDice ?? "";
  const savingThrows = system.savingThrows ?? "";
  const proficiencies = rows
    .map((row) => row.proficiencies)
    .filter((value) => typeof value === "string" && value.trim().length)
    .join("; ");
  const benefits = rows.flatMap((row) => {
    const rowBenefits = Array.isArray(row.benefits) ? row.benefits : [];
    return rowBenefits.map((benefit) => ({
      level: positiveNumber(row.level),
      label: formatGrantedBenefit(benefit),
      points: positiveNumber(benefit.points),
      notes: benefit.notes ?? ""
    }));
  });

  return {
    active: true,
    classCount: classItems.length,
    className: classItem.name ?? "Class",
    classLevel,
    hitDice,
    hitDicePool: hitDice ? `${classLevel}${hitDice}` : "",
    proficiencyBonus: positiveNumber(lastRow?.proficiencyBonus),
    savingThrows,
    proficiencies,
    bonusPoints,
    benefits,
    warnings
  };
}

export function getCharacterBenchmark(level) {
  const characterLevel = normalizeCharacterLevel(level);
  return CHARACTER_BENCHMARKS.find((benchmark) => characterLevel >= benchmark.minLevel && characterLevel <= benchmark.maxLevel)
    ?? CHARACTER_BENCHMARKS[CHARACTER_BENCHMARKS.length - 1];
}

export function summarizeCharacterBenchmark(benchmark) {
  if (!benchmark || benchmark.key === "epic") {
    return {
      abilityScores: "No maximums",
      attributeRank: "No maximum",
      proficiencyBonus: "No maximum",
      armourClass: "No maximum",
      normalDamage: "No maximum"
    };
  }

  return {
    abilityScores: `1 @ ${benchmark.maxAbilityScores[0]} | 1 @ ${benchmark.maxAbilityScores[1]}`,
    attributeRank: String(benchmark.maxAttributeRank),
    proficiencyBonus: `+${benchmark.maxProficiencyBonus}`,
    armourClass: String(benchmark.maxArmourClass),
    normalDamage: String(benchmark.maxNormalDamage)
  };
}

export function calculateBenchmarkWarnings(system = {}, items = []) {
  const level = normalizeCharacterLevel(system.level);
  const benchmark = getCharacterBenchmark(level);
  if (!benchmark || benchmark.key === "epic") return [];

  const warnings = [];
  const abilityScores = ABILITY_KEYS
    .map((key) => positiveNumber(system.abilities?.[key]?.effectiveValue ?? system.abilities?.[key]?.value))
    .sort((a, b) => b - a);
  const [highestScore = 0, secondHighestScore = 0] = abilityScores;
  const [highestLimit, secondHighestLimit] = benchmark.maxAbilityScores;

  if (highestScore > highestLimit) {
    warnings.push(`${benchmark.label} benchmark: highest Ability Score ${highestScore} exceeds ${highestLimit}.`);
  }
  if (secondHighestScore > secondHighestLimit) {
    warnings.push(`${benchmark.label} benchmark: second-highest Ability Score ${secondHighestScore} exceeds ${secondHighestLimit}.`);
  }

  const maxOwnedAttributeRank = (items ?? []).reduce((maxRank, item) => {
    if (!["attribute", "itemAttribute"].includes(item?.type)) return maxRank;
    return Math.max(maxRank, positiveNumber(item.system?.effectiveRank ?? item.system?.rank));
  }, 0);
  if (maxOwnedAttributeRank > benchmark.maxAttributeRank) {
    warnings.push(`${benchmark.label} benchmark: owned Attribute Rank ${maxOwnedAttributeRank} exceeds ${benchmark.maxAttributeRank}.`);
  }

  const proficiencyBonus = positiveNumber(system.combat?.proficiencyBonus);
  if (proficiencyBonus > benchmark.maxProficiencyBonus) {
    warnings.push(`${benchmark.label} benchmark: Proficiency Bonus +${proficiencyBonus} exceeds +${benchmark.maxProficiencyBonus}.`);
  }

  const armourClass = positiveNumber(system.combat?.armourClass);
  if (armourClass > benchmark.maxArmourClass) {
    warnings.push(`${benchmark.label} benchmark: Armour Class ${armourClass} exceeds ${benchmark.maxArmourClass}.`);
  }

  return warnings;
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
  const classBenefits = summarizeSingleClassBenefits(items, system.level);
  const benchmark = getCharacterBenchmark(system.level);
  const benchmarkSummary = summarizeCharacterBenchmark(benchmark);
  const benchmarkWarnings = calculateBenchmarkWarnings(system, items);
  const abilityScoreCost = calculateAbilityScoreCost(system.abilities);
  const manualSpent = positiveNumber(system.points?.spent);
  const manualRefund = positiveNumber(system.points?.refunded);
  const available = calculateAvailablePoints(system) + owned.defectRefund + classBenefits.bonusPoints;
  const totalSpent = abilityScoreCost
    + manualSpent
    + owned.speciesCost
    + owned.classCost
    + owned.attributeCost
    + owned.equipmentCost;
  const remaining = available - totalSpent;
  const actorLevel = positiveNumber(system.level);
  const warnings = [...owned.warningItems, ...classBenefits.warnings, ...benchmarkWarnings];

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
    classBonusPoints: classBenefits.bonusPoints,
    totalSpent,
    remaining,
    warnings,
    classBenefits,
    benchmark,
    benchmarkSummary,
    benchmarkWarnings,
    owned
  };
}

export function applyPointSummaryToSystem(system = {}, items = []) {
  const summary = calculatePointSummary(system, items);
  system.points ??= {};
  system.points.abilityScoreCost = summary.abilityScoreCost;
  system.points.speciesCost = summary.speciesCost;
  system.points.classCost = summary.classCost;
  system.points.classBonusPoints = summary.classBonusPoints;
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
