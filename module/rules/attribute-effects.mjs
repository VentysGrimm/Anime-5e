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
  "core.attribute.tough": "tough",
  "core.defect.degraded": "degraded",
  "core.defect.fragile": "fragile"
};

const EFFECTS_BY_NAME = {
  "ac bonus": "acBonus",
  augmented: "augmented",
  energised: "energised",
  tough: "tough",
  degraded: "degraded",
  fragile: "fragile"
};

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
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
    effects: [],
    unapplied: [],
    warnings: []
  };

  for (const item of items) {
    const effectKey = effectKeyForItem(item);
    if (!effectKey) continue;
    if (effectKey.startsWith("ac") || effectKey === "augmented" || effectKey === "energised" || effectKey === "tough") {
      if (item?.type !== "attribute") continue;
    } else if (item?.type !== "defect") {
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
    } else if (effectKey === "degraded") {
      addAbilityBonus(result, item, effectKey, rank, -1);
    } else if (effectKey === "fragile") {
      const amount = rank * -10;
      result.hitPointPercentBonus += amount;
      result.effects.push({ key: effectKey, source, label: "Fragile", detail: `Hit Point max ${amount}%`, amount });
    }
  }

  const baseHitPointMax = Math.max(0, numberOrZero(system?.combat?.hitPoints?.max));
  result.hitPointMaxBonus = Math.round(baseHitPointMax * (result.hitPointPercentBonus / 100));

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

  return {
    active: effects.effects.length > 0 || effects.warnings.length > 0,
    effects: effects.effects,
    warnings: effects.warnings,
    hasTotals: totals.length > 0,
    totals
  };
}
