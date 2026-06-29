export const ABILITY_KEYS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma"
];

const ABILITY_LABELS = {
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  charisma: "Charisma"
};

const ABILITY_ALIASES = {
  str: "strength",
  strength: "strength",
  dex: "dexterity",
  dexterity: "dexterity",
  con: "constitution",
  constitution: "constitution",
  int: "intelligence",
  intelligence: "intelligence",
  wis: "wisdom",
  wisdom: "wisdom",
  cha: "charisma",
  charisma: "charisma"
};

const EFFECTS_BY_SOURCE_ID = {
  "core.attribute.ac-bonus": "acBonus",
  "core.attribute.augmented": "augmented",
  "core.attribute.energised": "energised",
  "core.attribute.fast": "fast",
  "core.attribute.flight": "flight",
  "core.attribute.special-movement": "specialMovement",
  "core.attribute.tough": "tough",
  "core.attribute.water-speed": "waterSpeed",
  "core.defect.degraded": "degraded",
  "core.defect.fragile": "fragile",
  "core.defect.slow": "slow"
};

const EFFECTS_BY_NAME = {
  "ac bonus": "acBonus",
  augmented: "augmented",
  energised: "energised",
  fast: "fast",
  flight: "flight",
  "special movement": "specialMovement",
  tough: "tough",
  "water speed": "waterSpeed",
  degraded: "degraded",
  fragile: "fragile",
  slow: "slow"
};

const ATTRIBUTE_EFFECT_KEYS = new Set(["acBonus", "augmented", "energised", "fast", "flight", "specialMovement", "tough", "waterSpeed"]);
const DEFECT_EFFECT_KEYS = new Set(["degraded", "fragile", "slow"]);
const FAST_MULTIPLIERS = [1, 2, 4, 8, 15, 30, 50];
const SLOW_DIVISORS = [1, 2, 4, 8];
const DESCRIPTIVE_SPEED_LABELS = ["", "30 ft/round", "90 ft/round", "300 ft/round", "100 mph", "300 mph", "1,000 mph"];

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function numberOrFallback(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function rankForItem(item) {
  return Math.max(0, Math.trunc(numberOrZero(item?.system?.rank)));
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sourceIdForItem(item) {
  return String(
    item?.system?.sourceId
    ?? item?.flags?.anime5e?.sourceId
    ?? item?.flags?.anime5e?.source?.importId
    ?? item?.system?.importId
    ?? ""
  );
}

function effectKeyForItem(item) {
  const sourceId = sourceIdForItem(item);
  const bySourceId = EFFECTS_BY_SOURCE_ID[sourceId];
  if (bySourceId) return bySourceId;

  const normalizedName = normalizeName(item?.name);
  const exactMatch = EFFECTS_BY_NAME[normalizedName];
  if (exactMatch) return exactMatch;

  return Object.entries(EFFECTS_BY_NAME)
    .find(([name]) => normalizedName.startsWith(`${name} `))?.[1];
}

function normalizeAbilityKey(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;
  if (ABILITY_ALIASES[text]) return ABILITY_ALIASES[text];

  const normalized = text.replace(/[^a-z]+/g, " ");
  for (const [alias, key] of Object.entries(ABILITY_ALIASES)) {
    const pattern = new RegExp(`(^|\\s)${alias}(\\s|$)`, "i");
    if (pattern.test(normalized)) return key;
  }

  return null;
}

function abilityTargetForItem(item) {
  const system = item?.system ?? {};
  const directTarget = normalizeAbilityKey(
    system.ability
    ?? system.targetAbility
    ?? system.abilityTarget
    ?? system.appliesTo
  );
  if (directTarget) return directTarget;

  return normalizeAbilityKey(item?.name);
}

function signedNumber(value) {
  return value > 0 ? `+${value}` : String(value);
}

function movementMultiplierLabel(rank, table) {
  const cappedRank = Math.max(0, Math.min(table.length - 1, rank));
  return table[cappedRank];
}

function descriptiveSpeedLabel(rank) {
  const cappedRank = Math.max(0, Math.min(DESCRIPTIVE_SPEED_LABELS.length - 1, rank));
  return DESCRIPTIVE_SPEED_LABELS[cappedRank];
}

function splitMovementModes(value) {
  return String(value ?? "")
    .split(/[\n;,]+/g)
    .map((mode) => mode.trim())
    .filter(Boolean);
}

function movementModesForItem(item) {
  const configuredModes = splitMovementModes(item?.system?.movementModes);
  if (configuredModes.length) return configuredModes;

  const match = String(item?.name ?? "").match(/\(([^)]+)\)/);
  return match ? splitMovementModes(match[1]) : [];
}

function effectSource(item, fallbackLabel) {
  return String(item?.name ?? fallbackLabel);
}

function addAbilityBonus(result, item, effectKey, rank, sign) {
  const target = abilityTargetForItem(item);
  const source = effectSource(item, effectKey);
  if (!target) {
    result.warnings.push(`${source}: set an Ability target before this effect can be applied.`);
    result.unapplied.push({ key: effectKey, source, rank });
    return;
  }

  const amount = rank * sign;
  result.abilityBonuses[target] += amount;
  result.effects.push({
    key: effectKey,
    source,
    target,
    label: effectKey === "augmented" ? "Augmented" : "Degraded",
    detail: `${ABILITY_LABELS[target]} ${signedNumber(amount)}`,
    amount
  });
}

export function calculateCoreAttributeEffects({ system = {}, items = [] } = {}) {
  const result = {
    abilityBonuses: Object.fromEntries(ABILITY_KEYS.map((key) => [key, 0])),
    armourClassBonus: 0,
    energyMaxBonus: 0,
    hitPointPercentBonus: 0,
    hitPointMaxBonus: 0,
    movement: {
      baseGroundSpeed: 0,
      groundSpeed: 0,
      fastRanks: 0,
      slowRanks: 0,
      netFastRanks: 0,
      netSlowRanks: 0,
      multiplierLabel: "x1",
      flightRank: 0,
      flightSpeed: "",
      waterSpeedRank: 0,
      waterSpeed: "",
      specialModes: [],
      summary: []
    },
    effects: [],
    unapplied: [],
    warnings: []
  };

  for (const item of items) {
    const effectKey = effectKeyForItem(item);
    if (!effectKey) continue;
    if (ATTRIBUTE_EFFECT_KEYS.has(effectKey)) {
      if (item?.type !== "attribute") continue;
    } else if (DEFECT_EFFECT_KEYS.has(effectKey)) {
      if (item?.type !== "defect") continue;
    } else {
      continue;
    }

    const rank = rankForItem(item);
    if (!rank) continue;
    const source = effectSource(item, effectKey);

    if (effectKey === "acBonus") {
      result.armourClassBonus += rank;
      result.effects.push({ key: effectKey, source, label: "AC Bonus", detail: `Armour Class +${rank}`, amount: rank });
    } else if (effectKey === "augmented") {
      addAbilityBonus(result, item, effectKey, rank, 1);
    } else if (effectKey === "energised") {
      const amount = rank * 10;
      result.energyMaxBonus += amount;
      result.effects.push({ key: effectKey, source, label: "Energised", detail: `Energy max +${amount}`, amount });
    } else if (effectKey === "tough") {
      const amount = rank * 10;
      result.hitPointPercentBonus += amount;
      result.effects.push({ key: effectKey, source, label: "Tough", detail: `Hit Point max +${amount}%`, amount });
    } else if (effectKey === "fast") {
      result.movement.fastRanks += rank;
      const multiplier = movementMultiplierLabel(rank, FAST_MULTIPLIERS);
      result.effects.push({ key: effectKey, source, label: "Fast", detail: `Ground speed x${multiplier}`, amount: rank });
      if (rank >= FAST_MULTIPLIERS.length) result.warnings.push(`${source}: Fast Rank ${rank} exceeds the encoded Rank 6 speed table; displaying Rank 6 movement.`);
    } else if (effectKey === "flight") {
      result.movement.flightRank = Math.max(result.movement.flightRank, rank);
      const speed = descriptiveSpeedLabel(rank);
      result.effects.push({ key: effectKey, source, label: "Flight", detail: speed ? `Flight up to ${speed}` : `Flight Rank ${rank}`, amount: rank });
      if (rank >= DESCRIPTIVE_SPEED_LABELS.length) result.warnings.push(`${source}: Flight Rank ${rank} exceeds the encoded Rank 6 speed table; displaying Rank 6 movement.`);
    } else if (effectKey === "specialMovement") {
      const modes = movementModesForItem(item);
      result.movement.specialModes.push(...modes);
      const detail = modes.length ? `Special Movement: ${modes.join(", ")}` : `Special Movement: ${rank} mode${rank === 1 ? "" : "s"} to define`;
      result.effects.push({ key: effectKey, source, label: "Special Movement", detail, amount: rank });
      if (!modes.length) result.warnings.push(`${source}: enter selected movement modes on the item sheet.`);
    } else if (effectKey === "waterSpeed") {
      result.movement.waterSpeedRank = Math.max(result.movement.waterSpeedRank, rank);
      const speed = descriptiveSpeedLabel(rank);
      result.effects.push({ key: effectKey, source, label: "Water Speed", detail: speed ? `Water speed up to ${speed}` : `Water Speed Rank ${rank}`, amount: rank });
      if (rank >= DESCRIPTIVE_SPEED_LABELS.length) result.warnings.push(`${source}: Water Speed Rank ${rank} exceeds the encoded Rank 6 speed table; displaying Rank 6 movement.`);
    } else if (effectKey === "degraded") {
      addAbilityBonus(result, item, effectKey, rank, -1);
    } else if (effectKey === "fragile") {
      const amount = rank * -10;
      result.hitPointPercentBonus += amount;
      result.effects.push({ key: effectKey, source, label: "Fragile", detail: `Hit Point max ${amount}%`, amount });
    } else if (effectKey === "slow") {
      result.movement.slowRanks += rank;
      const divisor = movementMultiplierLabel(rank, SLOW_DIVISORS);
      result.effects.push({ key: effectKey, source, label: "Slow", detail: `Ground speed /${divisor}`, amount: rank });
      if (rank >= SLOW_DIVISORS.length) result.warnings.push(`${source}: Slow Rank ${rank} exceeds the encoded -3 Point speed table; displaying Rank 3 movement.`);
    }
  }

  const baseHitPointMax = Math.max(0, numberOrZero(system?.combat?.hitPoints?.max));
  result.hitPointMaxBonus = Math.round(baseHitPointMax * (result.hitPointPercentBonus / 100));

  const movement = result.movement;
  movement.baseGroundSpeed = Math.max(0, numberOrFallback(system?.combat?.movementSpeed, 30));
  movement.netFastRanks = Math.max(0, movement.fastRanks - movement.slowRanks);
  movement.netSlowRanks = Math.max(0, movement.slowRanks - movement.fastRanks);
  const fastMultiplier = movementMultiplierLabel(movement.netFastRanks, FAST_MULTIPLIERS);
  const slowDivisor = movementMultiplierLabel(movement.netSlowRanks, SLOW_DIVISORS);
  movement.multiplierLabel = movement.netFastRanks ? `x${fastMultiplier}` : movement.netSlowRanks ? `/${slowDivisor}` : "x1";
  movement.groundSpeed = Math.max(0, Math.round((movement.baseGroundSpeed * fastMultiplier) / slowDivisor));
  movement.flightSpeed = descriptiveSpeedLabel(movement.flightRank);
  movement.waterSpeed = descriptiveSpeedLabel(movement.waterSpeedRank);

  if (movement.fastRanks || movement.slowRanks) movement.summary.push(`Ground ${movement.groundSpeed} ft/round (${movement.multiplierLabel})`);
  if (movement.flightSpeed) movement.summary.push(`Flight ${movement.flightSpeed}`);
  if (movement.waterSpeed) movement.summary.push(`Water ${movement.waterSpeed}`);
  if (movement.specialModes.length) movement.summary.push(`Special ${movement.specialModes.join(", ")}`);

  return result;
}

export function buildCoreAttributeEffectContext({ system = {}, items = [] } = {}) {
  const effects = calculateCoreAttributeEffects({ system, items });
  const totals = [];

  for (const [ability, amount] of Object.entries(effects.abilityBonuses)) {
    if (amount) totals.push(`${ABILITY_LABELS[ability]} ${signedNumber(amount)}`);
  }
  if (effects.armourClassBonus) totals.push(`Armour Class +${effects.armourClassBonus}`);
  if (effects.energyMaxBonus) totals.push(`Energy max +${effects.energyMaxBonus}`);
  if (effects.hitPointPercentBonus) {
    totals.push(`Hit Point max ${signedNumber(effects.hitPointMaxBonus)} (${signedNumber(effects.hitPointPercentBonus)}%)`);
  }
  totals.push(...effects.movement.summary);

  return {
    active: effects.effects.length > 0 || effects.warnings.length > 0,
    effects: effects.effects,
    movement: effects.movement,
    warnings: effects.warnings,
    hasTotals: totals.length > 0,
    totals
  };
}
